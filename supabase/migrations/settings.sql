-- Table des paramètres de l'application
create table "public"."settings" (
    "key" text primary key,
    "value" jsonb not null,
    "description" text,
    "updated_at" timestamp with time zone default now(),
    "updated_by" uuid references auth.users(id)
);

-- Données initiales
insert into "public"."settings" ("key", "value", "description") values
    ('sync_config', 
    jsonb_build_object(
        'orders_sync_interval_minutes', 15,
        'products_sync_interval_minutes', 60,
        'max_items_per_sync', 100,
        'enabled', true
    ),
    'Configuration de la synchronisation'),
    
    ('display_config',
    jsonb_build_object(
        'default_currency', 'EUR',
        'date_format', 'DD/MM/YYYY',
        'items_per_page', 25
    ),
    'Configuration de l''affichage');

-- RLS Policies
alter table "public"."settings" enable row level security;

create policy "Allow read access for all authenticated users"
on "public"."settings"
for select
to authenticated
using (true);

create policy "Allow write access for authenticated users"
on "public"."settings"
for insert
to authenticated
with check (true);

create policy "Allow update for authenticated users"
on "public"."settings"
for update
to authenticated
using (true)
with check (true);
