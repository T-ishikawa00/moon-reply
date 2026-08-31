-- Launch Measurement R1: source-only schema. Human apply is a separate action.

alter table public.production_purchase_intents
  add column measurement_client_id text,
  add column measurement_session_id bigint,
  add column measurement_utm_source text,
  add column measurement_utm_medium text,
  add column measurement_utm_campaign text,
  add column measurement_utm_content text,
  add column measurement_gclid text,
  add column measurement_landing_path text,
  add column measurement_attribution_captured_at timestamptz,
  add constraint production_purchase_intent_measurement_context check (
    (measurement_client_id is null
      and measurement_session_id is null
      and measurement_landing_path is null
      and measurement_attribution_captured_at is null)
    or
    (measurement_client_id ~ '^[1-9][0-9]{0,9}[.][1-9][0-9]{0,9}$'
      and measurement_session_id > 0
      and measurement_landing_path in (
        '/', '/sample-report', '/request', '/contact', '/legal',
        '/legal/privacy', '/legal/terms', '/legal/refund',
        '/legal/tokushoho', '/legal/unsupported-cases',
        '/legal/ai-disclosure'
      )
      and measurement_attribution_captured_at is not null)
  ),
  add constraint production_purchase_intent_measurement_utm check (
    (measurement_utm_source is null or
      (length(measurement_utm_source) between 1 and 64 and
       measurement_utm_source ~ '^[A-Za-z0-9._~-]+$'))
    and (measurement_utm_medium is null or
      (length(measurement_utm_medium) between 1 and 64 and
       measurement_utm_medium ~ '^[A-Za-z0-9._~-]+$'))
    and ((measurement_utm_source is null) = (measurement_utm_medium is null))
    and (measurement_utm_campaign is null or
      (length(measurement_utm_campaign) between 1 and 100 and
       measurement_utm_campaign ~ '^[A-Za-z0-9._~-]+$'))
    and (measurement_utm_content is null or
      (length(measurement_utm_content) between 1 and 100 and
       measurement_utm_content ~ '^[A-Za-z0-9._~-]+$'))
    and (measurement_gclid is null or
      (length(measurement_gclid) between 1 and 200 and
       measurement_gclid ~ '^[A-Za-z0-9_-]+$'))
    and (measurement_gclid is null or
      (measurement_utm_source = 'google' and measurement_utm_medium = 'cpc'))
  );

create function public.bind_purchase_intent_measurement_attribution_r1(
  p_purchase_intent_id uuid,
  p_measurement_client_id text,
  p_measurement_session_id bigint,
  p_measurement_utm_source text,
  p_measurement_utm_medium text,
  p_measurement_utm_campaign text,
  p_measurement_utm_content text,
  p_measurement_gclid text,
  p_measurement_landing_path text,
  p_measurement_attribution_captured_at timestamptz,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_measurement_client_id is null then
    return;
  end if;
  update public.production_purchase_intents set
    measurement_client_id = p_measurement_client_id,
    measurement_session_id = p_measurement_session_id,
    measurement_utm_source = p_measurement_utm_source,
    measurement_utm_medium = p_measurement_utm_medium,
    measurement_utm_campaign = p_measurement_utm_campaign,
    measurement_utm_content = p_measurement_utm_content,
    measurement_gclid = p_measurement_gclid,
    measurement_landing_path = p_measurement_landing_path,
    measurement_attribution_captured_at = p_measurement_attribution_captured_at,
    updated_at = greatest(updated_at, p_now)
  where id = p_purchase_intent_id
    and measurement_client_id is null;
end;
$function$;

create function public.protect_purchase_intent_measurement_attribution_r1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if old.measurement_client_id is not null and (
    new.measurement_client_id is distinct from old.measurement_client_id or
    new.measurement_session_id is distinct from old.measurement_session_id or
    new.measurement_utm_source is distinct from old.measurement_utm_source or
    new.measurement_utm_medium is distinct from old.measurement_utm_medium or
    new.measurement_utm_campaign is distinct from old.measurement_utm_campaign or
    new.measurement_utm_content is distinct from old.measurement_utm_content or
    new.measurement_gclid is distinct from old.measurement_gclid or
    new.measurement_landing_path is distinct from old.measurement_landing_path or
    new.measurement_attribution_captured_at is distinct from old.measurement_attribution_captured_at
  ) then
    raise exception 'MEASUREMENT_ATTRIBUTION_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

create trigger production_purchase_intent_measurement_immutability_r1
before update of
  measurement_client_id, measurement_session_id, measurement_utm_source,
  measurement_utm_medium, measurement_utm_campaign, measurement_utm_content,
  measurement_gclid, measurement_landing_path,
  measurement_attribution_captured_at
on public.production_purchase_intents
for each row execute function public.protect_purchase_intent_measurement_attribution_r1();

create function public.begin_rc2_purchase_intent_measurement_r1(
  p_purchase_intent_id uuid,
  p_preparation_capability_hash text,
  p_trusted_session_token_hash text,
  p_status_capability_hash text,
  p_delivery_authority_reference text,
  p_expected_product_code text,
  p_expected_amount integer,
  p_currency text,
  p_purchase_kind text,
  p_environment text,
  p_now timestamptz,
  p_measurement_client_id text,
  p_measurement_session_id bigint,
  p_measurement_utm_source text,
  p_measurement_utm_medium text,
  p_measurement_utm_campaign text,
  p_measurement_utm_content text,
  p_measurement_gclid text,
  p_measurement_landing_path text,
  p_measurement_attribution_captured_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare result jsonb;
begin
  result := public.begin_rc2_purchase_intent_v1(
    p_purchase_intent_id, p_preparation_capability_hash,
    p_trusted_session_token_hash, p_status_capability_hash,
    p_delivery_authority_reference, p_expected_product_code,
    p_expected_amount, p_currency, p_purchase_kind, p_environment, p_now
  );
  perform public.bind_purchase_intent_measurement_attribution_r1(
    (result ->> 'purchase_intent_id')::uuid,
    p_measurement_client_id, p_measurement_session_id,
    p_measurement_utm_source, p_measurement_utm_medium,
    p_measurement_utm_campaign, p_measurement_utm_content,
    p_measurement_gclid, p_measurement_landing_path,
    p_measurement_attribution_captured_at, p_now
  );
  return result;
end;
$function$;

create function public.begin_customer_purchase_intent_measurement_r1(
  p_purchase_intent_id uuid,
  p_customer_user_id uuid,
  p_preparation_capability_hash text,
  p_status_capability_hash text,
  p_delivery_authority_reference text,
  p_expected_product_code text,
  p_expected_amount integer,
  p_currency text,
  p_purchase_kind text,
  p_environment text,
  p_now timestamptz,
  p_measurement_client_id text,
  p_measurement_session_id bigint,
  p_measurement_utm_source text,
  p_measurement_utm_medium text,
  p_measurement_utm_campaign text,
  p_measurement_utm_content text,
  p_measurement_gclid text,
  p_measurement_landing_path text,
  p_measurement_attribution_captured_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare result jsonb;
declare intent public.production_purchase_intents%rowtype;
begin
  result := public.begin_customer_purchase_intent_v1(
    p_purchase_intent_id, p_customer_user_id,
    p_preparation_capability_hash, p_status_capability_hash,
    p_delivery_authority_reference, p_expected_product_code,
    p_expected_amount, p_currency, p_purchase_kind, p_environment, p_now
  );
  perform public.bind_purchase_intent_measurement_attribution_r1(
    ((result -> 'intent') ->> 'id')::uuid,
    p_measurement_client_id, p_measurement_session_id,
    p_measurement_utm_source, p_measurement_utm_medium,
    p_measurement_utm_campaign, p_measurement_utm_content,
    p_measurement_gclid, p_measurement_landing_path,
    p_measurement_attribution_captured_at, p_now
  );
  select * into intent from public.production_purchase_intents
    where id = ((result -> 'intent') ->> 'id')::uuid;
  return pg_catalog.jsonb_set(result, '{intent}', pg_catalog.to_jsonb(intent));
end;
$function$;

create function public.begin_customer_purchase_intent_from_continuation_measurement_r1(
  p_purchase_intent_id uuid,
  p_customer_user_id uuid,
  p_continuation_token_hash text,
  p_status_capability_hash text,
  p_delivery_authority_reference text,
  p_expected_product_code text,
  p_expected_amount integer,
  p_currency text,
  p_purchase_kind text,
  p_environment text,
  p_now timestamptz,
  p_measurement_client_id text,
  p_measurement_session_id bigint,
  p_measurement_utm_source text,
  p_measurement_utm_medium text,
  p_measurement_utm_campaign text,
  p_measurement_utm_content text,
  p_measurement_gclid text,
  p_measurement_landing_path text,
  p_measurement_attribution_captured_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare result jsonb;
declare intent public.production_purchase_intents%rowtype;
begin
  result := public.begin_customer_purchase_intent_from_continuation_v1(
    p_purchase_intent_id, p_customer_user_id, p_continuation_token_hash,
    p_status_capability_hash, p_delivery_authority_reference,
    p_expected_product_code, p_expected_amount, p_currency,
    p_purchase_kind, p_environment, p_now
  );
  perform public.bind_purchase_intent_measurement_attribution_r1(
    ((result -> 'intent') ->> 'id')::uuid,
    p_measurement_client_id, p_measurement_session_id,
    p_measurement_utm_source, p_measurement_utm_medium,
    p_measurement_utm_campaign, p_measurement_utm_content,
    p_measurement_gclid, p_measurement_landing_path,
    p_measurement_attribution_captured_at, p_now
  );
  select * into intent from public.production_purchase_intents
    where id = ((result -> 'intent') ->> 'id')::uuid;
  return pg_catalog.jsonb_set(result, '{intent}', pg_catalog.to_jsonb(intent));
end;
$function$;

create table public.production_purchase_measurement_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  verified_payment_id uuid not null unique,
  purchase_intent_id uuid not null unique,
  environment text not null check (environment in ('test', 'live')),
  transaction_id text not null unique
    check (transaction_id ~ '^mrp_[A-Za-z0-9_-]{43}$'),
  measurement_client_id text,
  measurement_session_id bigint,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  gclid text,
  landing_path text,
  attribution_captured_at timestamptz,
  value integer not null default 980 check (value = 980),
  currency text not null default 'JPY' check (currency = 'JPY'),
  state text not null check (state in (
    'pending', 'processing', 'retryable', 'sent',
    'terminal_failure', 'suppressed'
  )),
  owner_id uuid,
  lease_expires_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  retry_after timestamptz,
  last_error_code text check (
    last_error_code is null or last_error_code ~ '^[A-Z0-9_]{1,64}$'
  ),
  sent_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_purchase_measurement_job_payment_fk
    foreign key (purchase_intent_id, verified_payment_id)
    references public.production_verified_payments(purchase_intent_id, id)
    on delete restrict,
  constraint production_purchase_measurement_job_context check (
    (measurement_client_id is null and measurement_session_id is null
      and landing_path is null and attribution_captured_at is null)
    or
    (measurement_client_id ~ '^[1-9][0-9]{0,9}[.][1-9][0-9]{0,9}$'
      and measurement_session_id > 0 and landing_path in (
        '/', '/sample-report', '/request', '/contact', '/legal',
        '/legal/privacy', '/legal/terms', '/legal/refund',
        '/legal/tokushoho', '/legal/unsupported-cases',
        '/legal/ai-disclosure'
      )
      and attribution_captured_at is not null)
  ),
  constraint production_purchase_measurement_job_utm check (
    (utm_source is null or
      (length(utm_source) between 1 and 64 and utm_source ~ '^[A-Za-z0-9._~-]+$'))
    and (utm_medium is null or
      (length(utm_medium) between 1 and 64 and utm_medium ~ '^[A-Za-z0-9._~-]+$'))
    and ((utm_source is null) = (utm_medium is null))
    and (utm_campaign is null or
      (length(utm_campaign) between 1 and 100 and utm_campaign ~ '^[A-Za-z0-9._~-]+$'))
    and (utm_content is null or
      (length(utm_content) between 1 and 100 and utm_content ~ '^[A-Za-z0-9._~-]+$'))
    and (gclid is null or
      (length(gclid) between 1 and 200 and gclid ~ '^[A-Za-z0-9_-]+$'))
    and (gclid is null or (utm_source = 'google' and utm_medium = 'cpc'))
  )
);

create function public.protect_production_purchase_measurement_job_immutability_r1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.id is distinct from old.id
     or new.verified_payment_id is distinct from old.verified_payment_id
     or new.purchase_intent_id is distinct from old.purchase_intent_id
     or new.environment is distinct from old.environment
     or new.transaction_id is distinct from old.transaction_id
     or new.measurement_client_id is distinct from old.measurement_client_id
     or new.measurement_session_id is distinct from old.measurement_session_id
     or new.utm_source is distinct from old.utm_source
     or new.utm_medium is distinct from old.utm_medium
     or new.utm_campaign is distinct from old.utm_campaign
     or new.utm_content is distinct from old.utm_content
     or new.gclid is distinct from old.gclid
     or new.landing_path is distinct from old.landing_path
     or new.attribution_captured_at is distinct from old.attribution_captured_at
     or new.value is distinct from old.value
     or new.currency is distinct from old.currency
     or new.created_at is distinct from old.created_at
  then
    raise exception 'MEASUREMENT_JOB_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

create trigger production_purchase_measurement_job_immutability_r1
before update on public.production_purchase_measurement_jobs
for each row execute function
  public.protect_production_purchase_measurement_job_immutability_r1();

alter table public.production_purchase_measurement_jobs enable row level security;

create function public.enqueue_production_purchase_measurement_job_r1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare intent public.production_purchase_intents%rowtype;
declare generated_transaction_id text;
begin
  select * into intent from public.production_purchase_intents
    where id = new.purchase_intent_id;
  generated_transaction_id := 'mrp_' || pg_catalog.translate(
    pg_catalog.rtrim(pg_catalog.encode(extensions.gen_random_bytes(32), 'base64'), '='),
    '+/', '-_'
  );
  insert into public.production_purchase_measurement_jobs (
    verified_payment_id, purchase_intent_id, environment, transaction_id,
    measurement_client_id, measurement_session_id,
    utm_source, utm_medium, utm_campaign, utm_content, gclid,
    landing_path, attribution_captured_at, state, created_at, updated_at
  ) values (
    new.id, new.purchase_intent_id, new.environment, generated_transaction_id,
    intent.measurement_client_id, intent.measurement_session_id,
    intent.measurement_utm_source, intent.measurement_utm_medium,
    intent.measurement_utm_campaign, intent.measurement_utm_content,
    intent.measurement_gclid, intent.measurement_landing_path,
    intent.measurement_attribution_captured_at,
    case when intent.measurement_client_id is null
      then 'terminal_failure' else 'pending' end,
    new.created_at, new.created_at
  );
  return new;
end;
$function$;

create trigger production_verified_payment_measurement_job_r1
after insert on public.production_verified_payments
for each row execute function public.enqueue_production_purchase_measurement_job_r1();

insert into public.production_purchase_measurement_jobs (
  verified_payment_id, purchase_intent_id, environment, transaction_id,
  measurement_client_id, measurement_session_id,
  utm_source, utm_medium, utm_campaign, utm_content, gclid,
  landing_path, attribution_captured_at, state, last_error_code,
  created_at, updated_at
)
select payment.id, payment.purchase_intent_id, payment.environment,
  'mrp_' || pg_catalog.translate(
    pg_catalog.rtrim(pg_catalog.encode(extensions.gen_random_bytes(32), 'base64'), '='),
    '+/', '-_'
  ),
  intent.measurement_client_id, intent.measurement_session_id,
  intent.measurement_utm_source, intent.measurement_utm_medium,
  intent.measurement_utm_campaign, intent.measurement_utm_content,
  intent.measurement_gclid, intent.measurement_landing_path,
  intent.measurement_attribution_captured_at,
  'suppressed', 'PRE_R1_PAYMENT', payment.created_at, payment.created_at
from public.production_verified_payments as payment
join public.production_purchase_intents as intent on intent.id = payment.purchase_intent_id
on conflict (verified_payment_id) do nothing;

create function public.claim_production_purchase_measurement_batch_r1(
  p_environment text,
  p_owner_id uuid,
  p_now timestamptz,
  p_lease_expires_at timestamptz,
  p_limit integer
) returns setof public.production_purchase_measurement_jobs
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_environment not in ('test', 'live') or p_limit < 1 or p_limit > 10
     or p_lease_expires_at <= p_now then
    raise exception 'MEASUREMENT_CLAIM_INVALID' using errcode = 'P0001';
  end if;
  return query
  with candidates as (
    select id from public.production_purchase_measurement_jobs
    where environment = p_environment
      and measurement_client_id is not null
      and (
        (state in ('pending', 'retryable') and coalesce(retry_after, p_now) <= p_now)
        or (state = 'processing' and lease_expires_at <= p_now)
      )
    order by created_at, id
    for update skip locked
    limit p_limit
  )
  update public.production_purchase_measurement_jobs as job set
    state = 'processing', owner_id = p_owner_id,
    lease_expires_at = p_lease_expires_at,
    attempt_count = job.attempt_count + 1,
    retry_after = null, updated_at = p_now
  from candidates where job.id = candidates.id
  returning job.*;
end;
$function$;

create function public.complete_production_purchase_measurement_r1(
  p_job_id uuid, p_owner_id uuid, p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_purchase_measurement_jobs set
    state = 'sent', owner_id = null, lease_expires_at = null,
    last_error_code = null, sent_at = p_now, updated_at = p_now
  where id = p_job_id and state = 'processing' and owner_id = p_owner_id;
  if not found then
    raise exception 'MEASUREMENT_JOB_OWNERSHIP_LOST' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.fail_production_purchase_measurement_r1(
  p_job_id uuid, p_owner_id uuid, p_retryable boolean,
  p_error_code text, p_retry_after timestamptz, p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_error_code !~ '^[A-Z0-9_]{1,64}$' then
    raise exception 'MEASUREMENT_JOB_FAILURE_INVALID' using errcode = 'P0001';
  end if;
  update public.production_purchase_measurement_jobs set
    state = case when p_retryable then 'retryable' else 'terminal_failure' end,
    owner_id = null, lease_expires_at = null,
    retry_after = case when p_retryable then p_retry_after else null end,
    last_error_code = p_error_code, updated_at = p_now
  where id = p_job_id and state = 'processing' and owner_id = p_owner_id;
  if not found then
    raise exception 'MEASUREMENT_JOB_OWNERSHIP_LOST' using errcode = 'P0001';
  end if;
end;
$function$;

revoke all on table public.production_purchase_measurement_jobs from public, anon, authenticated;
grant select, insert, update on table public.production_purchase_measurement_jobs to service_role;

revoke all on function public.bind_purchase_intent_measurement_attribution_r1(uuid, text, bigint, text, text, text, text, text, text, timestamptz, timestamptz) from public;
revoke all on function public.begin_rc2_purchase_intent_measurement_r1(uuid, text, text, text, text, text, integer, text, text, text, timestamptz, text, bigint, text, text, text, text, text, text, timestamptz) from public;
revoke all on function public.begin_customer_purchase_intent_measurement_r1(uuid, uuid, text, text, text, text, integer, text, text, text, timestamptz, text, bigint, text, text, text, text, text, text, timestamptz) from public;
revoke all on function public.begin_customer_purchase_intent_from_continuation_measurement_r1(uuid, uuid, text, text, text, text, integer, text, text, text, timestamptz, text, bigint, text, text, text, text, text, text, timestamptz) from public;
revoke all on function public.claim_production_purchase_measurement_batch_r1(text, uuid, timestamptz, timestamptz, integer) from public;
revoke all on function public.complete_production_purchase_measurement_r1(uuid, uuid, timestamptz) from public;
revoke all on function public.fail_production_purchase_measurement_r1(uuid, uuid, boolean, text, timestamptz, timestamptz) from public;
revoke all on function public.enqueue_production_purchase_measurement_job_r1() from public;
revoke all on function public.protect_purchase_intent_measurement_attribution_r1() from public;
revoke all on function public.protect_production_purchase_measurement_job_immutability_r1() from public;

revoke all on table public.production_purchase_measurement_jobs from m2_b2_stripe_ingress;
revoke all on function public.bind_purchase_intent_measurement_attribution_r1(uuid, text, bigint, text, text, text, text, text, text, timestamptz, timestamptz) from m2_b2_stripe_ingress;
revoke all on function public.claim_production_purchase_measurement_batch_r1(text, uuid, timestamptz, timestamptz, integer) from m2_b2_stripe_ingress;
revoke all on function public.complete_production_purchase_measurement_r1(uuid, uuid, timestamptz) from m2_b2_stripe_ingress;
revoke all on function public.fail_production_purchase_measurement_r1(uuid, uuid, boolean, text, timestamptz, timestamptz) from m2_b2_stripe_ingress;
revoke all on function public.protect_production_purchase_measurement_job_immutability_r1() from m2_b2_stripe_ingress;

grant execute on function public.bind_purchase_intent_measurement_attribution_r1(uuid, text, bigint, text, text, text, text, text, text, timestamptz, timestamptz) to service_role;
grant execute on function public.begin_rc2_purchase_intent_measurement_r1(uuid, text, text, text, text, text, integer, text, text, text, timestamptz, text, bigint, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.begin_customer_purchase_intent_measurement_r1(uuid, uuid, text, text, text, text, integer, text, text, text, timestamptz, text, bigint, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.begin_customer_purchase_intent_from_continuation_measurement_r1(uuid, uuid, text, text, text, text, integer, text, text, text, timestamptz, text, bigint, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.claim_production_purchase_measurement_batch_r1(text, uuid, timestamptz, timestamptz, integer) to service_role;
grant execute on function public.complete_production_purchase_measurement_r1(uuid, uuid, timestamptz) to service_role;
grant execute on function public.fail_production_purchase_measurement_r1(uuid, uuid, boolean, text, timestamptz, timestamptz) to service_role;
