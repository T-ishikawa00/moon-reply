create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.reading_requests (
  id uuid primary key default gen_random_uuid(),
  request_token text unique not null,
  email text not null,
  nickname text not null,
  age_range text not null,
  relationship_type text not null,
  relationship_status text[] not null default '{}'::text[],
  last_partner_message text,
  last_user_message text,
  intended_message text not null,
  reply_wait_duration text not null,
  recent_context text not null,
  main_anxiety text not null,
  desired_outcome text not null,
  main_question text not null,
  send_tonight text not null,
  consent_ai boolean not null default false,
  consent_not_medical boolean not null default false,
  consent_no_guarantee boolean not null default false,
  consent_privacy boolean not null default false,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_requests_status_check check (
    status in (
      'draft',
      'submitted',
      'safety_rejected',
      'payment_pending',
      'paid',
      'generating',
      'completed',
      'failed',
      'refunded'
    )
  )
);

create table public.safety_checks (
  id uuid primary key default gen_random_uuid(),
  reading_request_id uuid not null references public.reading_requests(id) on delete cascade,
  self_harm_flag boolean not null default false,
  harm_others_flag boolean not null default false,
  dv_abuse_flag boolean not null default false,
  stalking_flag boolean not null default false,
  threat_flag boolean not null default false,
  minor_flag boolean not null default false,
  surveillance_flag boolean not null default false,
  doxxing_flag boolean not null default false,
  result text not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint safety_checks_result_check check (
    result in ('normal_allowed', 'needs_review', 'rejected')
  )
);

create table public.readings (
  id uuid primary key default gen_random_uuid(),
  reading_request_id uuid not null references public.reading_requests(id) on delete cascade,
  result_token text unique not null,
  judgment_label text,
  full_reading_markdown text,
  saveable_card_copy text,
  send_message_suggestion text,
  three_day_policy text,
  emotional_tags text[] not null default '{}'::text[],
  generation_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint readings_generation_status_check check (
    generation_status in ('pending', 'generated', 'failed', 'blocked')
  )
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  reading_request_id uuid references public.reading_requests(id) on delete set null,
  provider text not null,
  provider_purchase_id text,
  provider_customer_id text,
  amount_jpy integer not null,
  currency text not null default 'JPY',
  product_type text not null,
  product_code text not null,
  status text not null default 'pending',
  purchased_at timestamptz,
  refunded_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchases_amount_jpy_check check (amount_jpy >= 0),
  constraint purchases_status_check check (
    status in ('pending', 'paid', 'failed', 'refunded', 'revoked')
  )
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  available_credits integer not null default 0,
  active_plan text,
  status text not null default 'active',
  last_credit_ledger_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entitlements_available_credits_check check (available_credits >= 0),
  constraint entitlements_status_check check (
    status in ('active', 'suspended', 'revoked')
  )
);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid references public.entitlements(id) on delete set null,
  reading_request_id uuid references public.reading_requests(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  reason text not null,
  delta integer not null,
  balance_after integer not null,
  idempotency_key text unique not null,
  created_at timestamptz not null default now(),
  constraint credit_ledger_reason_check check (
    reason in (
      'purchase_grant',
      'reading_consumed',
      'generation_failed_compensation',
      'refund_reversal',
      'admin_adjustment'
    )
  ),
  constraint credit_ledger_balance_after_check check (balance_after >= 0)
);

create table public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  related_purchase_id uuid references public.purchases(id) on delete set null,
  related_reading_request_id uuid references public.reading_requests(id) on delete set null,
  processing_status text not null default 'received',
  payload_json jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint provider_events_processing_status_check check (
    processing_status in ('received', 'processed', 'duplicate', 'failed')
  ),
  constraint provider_events_provider_event_unique unique (provider, provider_event_id)
);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  reading_request_id uuid references public.reading_requests(id) on delete set null,
  reading_id uuid references public.readings(id) on delete set null,
  generation_type text not null,
  model text,
  prompt_version text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_jpy numeric(10, 4),
  status text not null default 'started',
  error_message text,
  created_at timestamptz not null default now(),
  constraint ai_generation_logs_generation_type_check check (
    generation_type in ('safety_assist', 'judgment', 'full_reading')
  ),
  constraint ai_generation_logs_status_check check (
    status in ('started', 'completed', 'failed', 'blocked')
  ),
  constraint ai_generation_logs_input_tokens_check check (
    input_tokens is null or input_tokens >= 0
  ),
  constraint ai_generation_logs_output_tokens_check check (
    output_tokens is null or output_tokens >= 0
  ),
  constraint ai_generation_logs_estimated_cost_jpy_check check (
    estimated_cost_jpy is null or estimated_cost_jpy >= 0
  )
);

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid references public.readings(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  status text not null default 'pending',
  provider_message_id text,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint email_deliveries_status_check check (
    status in ('pending', 'sent', 'failed')
  )
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid references public.readings(id) on delete cascade,
  satisfaction_score integer,
  judgment_agreement_score integer,
  save_intent boolean,
  repeat_intent boolean,
  price_value text,
  chatgpt_enough boolean,
  free_comment text,
  created_at timestamptz not null default now(),
  constraint feedback_satisfaction_score_check check (
    satisfaction_score is null or satisfaction_score between 1 and 5
  ),
  constraint feedback_judgment_agreement_score_check check (
    judgment_agreement_score is null or judgment_agreement_score between 1 and 5
  )
);

create trigger set_reading_requests_updated_at
before update on public.reading_requests
for each row
execute function public.set_updated_at();

create trigger set_readings_updated_at
before update on public.readings
for each row
execute function public.set_updated_at();

create trigger set_purchases_updated_at
before update on public.purchases
for each row
execute function public.set_updated_at();

create trigger set_entitlements_updated_at
before update on public.entitlements
for each row
execute function public.set_updated_at();

create index reading_requests_email_idx on public.reading_requests(email);
create index safety_checks_reading_request_id_idx on public.safety_checks(reading_request_id);
create index readings_reading_request_id_idx on public.readings(reading_request_id);
create index purchases_reading_request_id_idx on public.purchases(reading_request_id);
create unique index purchases_provider_purchase_id_unique_idx
  on public.purchases(provider, provider_purchase_id)
  where provider_purchase_id is not null;
create index credit_ledger_entitlement_id_idx on public.credit_ledger(entitlement_id);
create index ai_generation_logs_reading_request_id_idx on public.ai_generation_logs(reading_request_id);
create index email_deliveries_reading_id_idx on public.email_deliveries(reading_id);
create index feedback_reading_id_idx on public.feedback(reading_id);

alter table public.reading_requests enable row level security;
alter table public.safety_checks enable row level security;
alter table public.readings enable row level security;
alter table public.purchases enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.entitlements enable row level security;
alter table public.provider_events enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.feedback enable row level security;

comment on table public.reading_requests is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.safety_checks is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.readings is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.purchases is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.credit_ledger is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.entitlements is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.provider_events is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.ai_generation_logs is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.email_deliveries is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';
comment on table public.feedback is
  'Stage 3 data foundation table. Public access policies will be designed only when API routes/server-side access patterns are implemented.';

-- No public policies are added in Stage 3.
-- Public access policies will be designed only when API routes/server-side access patterns are implemented.
