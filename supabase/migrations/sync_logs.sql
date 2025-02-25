-- Table des logs de synchronisation
create table if not exists "public"."sync_logs" (
    "id" uuid primary key default gen_random_uuid(),
    "type" text not null check (type in ('orders', 'products')),
    "status" text not null check (status in ('pending', 'success', 'error')),
    "items_processed" integer not null default 0,
    "items_succeeded" integer not null default 0,
    "items_failed" integer not null default 0,
    "error_message" text,
    "started_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
);

-- Index pour le monitoring
create index if not exists sync_logs_type_idx on sync_logs(type);
create index if not exists sync_logs_status_idx on sync_logs(status);
create index if not exists sync_logs_started_at_idx on sync_logs(started_at desc);

-- RLS Policies
alter table "public"."sync_logs" enable row level security;

create policy "Sync logs are viewable by authenticated users"
  on "public"."sync_logs" for select
  using ( auth.role() = 'authenticated' );

create policy "Sync logs are insertable by authenticated users"
  on "public"."sync_logs" for insert
  with check ( auth.role() = 'authenticated' );

create policy "Sync logs are updatable by authenticated users"
  on "public"."sync_logs" for update
  using ( auth.role() = 'authenticated' );

-- Create function to get last sync status
create or replace function get_last_sync_status(sync_type text)
returns table (
  last_success timestamp with time zone,
  last_error timestamp with time zone,
  is_syncing boolean
) as $$
begin
  return query
  select
    (select completed_at
     from "public"."sync_logs"
     where type = sync_type
     and status = 'success'
     order by completed_at desc
     limit 1) as last_success,
    (select completed_at
     from "public"."sync_logs"
     where type = sync_type
     and status = 'error'
     order by completed_at desc
     limit 1) as last_error,
    exists(
      select 1
      from "public"."sync_logs"
      where type = sync_type
      and status = 'pending'
      and completed_at is null
    ) as is_syncing;
end;
$$ language plpgsql;
