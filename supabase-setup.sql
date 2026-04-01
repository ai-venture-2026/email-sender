-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Leads table
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null default '',
  phone text,
  website text,
  address text,
  business_type text,
  status text not null default 'new' check (status in ('new', 'contacted', 'replied', 'closed')),
  notes text,
  created_at timestamptz default now()
);

-- Unique index on email (for upsert, skip empty emails)
create unique index if not exists leads_email_unique
  on leads (email)
  where email != '';

-- Email log table
create table if not exists email_log (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error_message text,
  sent_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists leads_status_idx on leads (status);
create index if not exists email_log_lead_idx on email_log (lead_id);
create index if not exists email_log_sent_at_idx on email_log (sent_at desc);