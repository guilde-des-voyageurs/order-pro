create table "public"."orders" (
    "id" text primary key,
    "name" text not null,
    "created_at" timestamp with time zone not null,
    "closed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "display_fulfillment_status" text,
    "display_financial_status" text,
    "note" text,
    "total_price" text,
    "total_price_currency" text,
    "customer" jsonb,
    "shipping_address" jsonb,
    "line_items" jsonb,
    "synced_at" timestamp with time zone default now()
);

-- Index pour améliorer les performances des requêtes
create index orders_created_at_idx on orders(created_at desc);
create index orders_closed_at_idx on orders(closed_at);
create index orders_cancelled_at_idx on orders(cancelled_at);

-- Politique de sécurité RLS (Row Level Security)
alter table "public"."orders" enable row level security;

-- Permettre la lecture pour tous les utilisateurs authentifiés
create policy "Allow read access for all authenticated users"
on "public"."orders"
for select
to authenticated
using (true);

-- Permettre l'écriture uniquement pour les utilisateurs authentifiés
create policy "Allow write access for authenticated users"
on "public"."orders"
for insert
to authenticated
with check (true);

create policy "Allow update access for authenticated users"
on "public"."orders"
for update
to authenticated
using (true)
with check (true);
