begin;

-- Expand-only, service-mediated counters. No email, OTP, IP, cookie, Auth user,
-- purchase or session data. Existing Auth objects and functions are unchanged.
create table public.account_otp_throttle_buckets (
  identity_hash text not null check (identity_hash ~ '^[0-9a-f]{64}$'),
  purpose text not null check (purpose in ('request', 'verify')),
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  attempt_count integer not null,
  primary key (identity_hash, purpose),
  check (expires_at = window_started_at + interval '10 minutes'),
  check (attempt_count between 1 and case when purpose = 'request' then 5 else 10 end)
);
create index account_otp_throttle_expiry on public.account_otp_throttle_buckets(expires_at);
alter table public.account_otp_throttle_buckets enable row level security;
revoke all on public.account_otp_throttle_buckets from public, anon, authenticated, service_role;

create function public.consume_account_otp_attempt_v1(p_identity_hash text, p_purpose text)
returns jsonb language plpgsql security definer set search_path = '' as $function$
declare
  instant timestamptz := clock_timestamp();
  maximum integer;
  claimed public.account_otp_throttle_buckets%rowtype;
  expiry timestamptz;
  admitted boolean;
begin
  if p_identity_hash is null or p_identity_hash !~ '^[0-9a-f]{64}$'
    or p_purpose is null or p_purpose not in ('request', 'verify') then
    raise exception 'ACCOUNT_OTP_THROTTLE_INPUT_INVALID' using errcode = 'P0001';
  end if;
  maximum := case when p_purpose = 'request' then 5 else 10 end;

  insert into public.account_otp_throttle_buckets as b
    (identity_hash, purpose, window_started_at, expires_at, attempt_count)
    values (p_identity_hash, p_purpose, instant, instant + interval '10 minutes', 1)
    on conflict (identity_hash, purpose) do update set
      window_started_at = case when b.expires_at <= instant then instant else b.window_started_at end,
      expires_at = case when b.expires_at <= instant then instant + interval '10 minutes' else b.expires_at end,
      attempt_count = case when b.expires_at <= instant then 1 else b.attempt_count + 1 end
    where b.expires_at <= instant or b.attempt_count < maximum
    returning * into claimed;
  admitted := found;
  if not admitted then
    select expires_at into expiry from public.account_otp_throttle_buckets
      where identity_hash = p_identity_hash and purpose = p_purpose;
  end if;

  -- Acquire the target counter first. Cleanup must never hold unrelated rows
  -- while waiting for that counter (which could introduce a lock-order cycle).
  -- Logical expiry never depends on this bounded, non-blocking cleanup.
  with expired as (
    select identity_hash, purpose from public.account_otp_throttle_buckets
    where expires_at <= instant order by expires_at limit 100 for update skip locked
  ) delete from public.account_otp_throttle_buckets b using expired e
    where b.identity_hash = e.identity_hash and b.purpose = e.purpose;
  if admitted then
    return jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  end if;
  return jsonb_build_object('allowed', false, 'retry_after_seconds',
    greatest(1, least(600, ceil(extract(epoch from (expiry - instant)))::integer)));
end;
$function$;
revoke all on function public.consume_account_otp_attempt_v1(text,text) from public, anon, authenticated, service_role;
grant execute on function public.consume_account_otp_attempt_v1(text,text) to service_role;

comment on table public.account_otp_throttle_buckets is
  'F010 security counters: fixed 600s expiry; bounded lazy deletion on subsequent throttle traffic. Success does not reset shared counters. No background purge or Customer retention-policy change.';
commit;
