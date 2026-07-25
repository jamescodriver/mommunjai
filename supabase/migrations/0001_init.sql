-- Mommunjai — initial schema (Supabase / Postgres)
-- Ref: docs/DATA-MODEL.md · deny-by-default RLS · all access via BFF service_role
-- Run in a dedicated Supabase project for this app

create extension if not exists "pgcrypto";

-- ========== tables ==========
create table if not exists leads (
  id             uuid primary key default gen_random_uuid(),
  nickname       text,
  contact_channel text check (contact_channel in ('line','phone','other')),
  contact_value  text,                       -- consider hashing/encrypting at app layer
  stage          text check (stage in ('prep','infertility','pregnant','lactating','male')),
  age_range      text,
  has_pcos       boolean default false,
  art_plan       text check (art_plan in ('none','iui','ivf','icsi')) default 'none',
  interests      jsonb default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists tickets (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  lead_id    uuid not null references leads(id) on delete cascade,
  status     text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_tickets_code on tickets(code);

create table if not exists tags (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null unique,
  label text not null,
  kind  text not null default 'auto' check (kind in ('auto','manual')),
  color text default '#5FB3B3'
);

create table if not exists tag_assignments (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  source     text not null default 'auto' check (source in ('auto','staff')),
  created_at timestamptz not null default now(),
  unique (lead_id, tag_id)
);
create index if not exists idx_tagassign_lead on tag_assignments(lead_id);

create table if not exists consent_log (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references leads(id) on delete cascade,
  policy_version text not null,
  consent_text   text not null,
  granted        boolean not null,
  ip             inet,
  created_at     timestamptz not null default now()
);

create table if not exists tool_results (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  tool       text not null check (tool in ('ovulation','protein','nutrients','sleep','vitamins')),
  input      jsonb,
  output     jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_toolresults_lead on tool_results(lead_id);

create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references leads(id) on delete set null,
  anon_id    text,
  name       text not null,
  props      jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_name on events(name);

-- ========== RLS: deny-by-default (BFF uses service_role which bypasses RLS) ==========
alter table leads            enable row level security;
alter table tickets          enable row level security;
alter table tags             enable row level security;
alter table tag_assignments  enable row level security;
alter table consent_log      enable row level security;
alter table tool_results     enable row level security;
alter table events           enable row level security;
-- (no policies added => anon/authenticated have no access; only service_role bypasses)

-- ========== ticket code generator (base32 without confusing chars) ==========
create or replace function gen_ticket_code() returns text language plpgsql as $$
declare
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- no 0/O/1/I
  code text;
  i int;
  attempt int := 0;
begin
  loop
    code := 'MJ-';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from tickets where tickets.code = code);
    attempt := attempt + 1;
    if attempt > 20 then raise exception 'could not generate unique ticket code'; end if;
  end loop;
  return code;
end $$;

-- keep updated_at fresh on leads
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_leads_touch on leads;
create trigger trg_leads_touch before update on leads
  for each row execute function touch_updated_at();

-- ========== seed auto tags ==========
insert into tags (slug, label, kind, color) values
  ('#PCOS','PCOS','auto','#E8A0BF'),
  ('#เตรียมท้อง','เตรียมตั้งครรภ์','auto','#5FB3B3'),
  ('#มีบุตรยาก','มีบุตรยาก','auto','#c85a8a'),
  ('#ICSI','วางแผน ICSI','auto','#E7B84B'),
  ('#IVF','วางแผน IVF','auto','#E7B84B'),
  ('#IUI','วางแผน IUI','auto','#E7B84B'),
  ('#บำรุงชาย','ฝ่ายชาย','auto','#4A78C9'),
  ('#สนใจ-OvaAll','สนใจ OvaAll','auto','#5FB3B3'),
  ('#สนใจ-Ferty','สนใจโปรตีน Ferty','auto','#5FB3B3'),
  ('#engaged','ทำหลายเครื่องมือ','auto','#8BC34A')
on conflict (slug) do nothing;
