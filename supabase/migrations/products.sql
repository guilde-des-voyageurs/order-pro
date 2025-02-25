-- Table des produits
create table if not exists "public"."products" (
    "id" text primary key,
    "title" text not null,
    "vendor" text,
    "product_type" text,
    "handle" text,
    "status" text not null default 'active',
    "variants" jsonb not null default '[]'::jsonb,
    "options" jsonb not null default '[]'::jsonb,
    "images" jsonb not null default '[]'::jsonb,
    "tags" text[] not null default '{}',
    "synced_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

-- Enable RLS
alter table "public"."products" enable row level security;

-- Create RLS policies
create policy "Products are viewable by authenticated users"
  on "public"."products" for select
  using ( auth.role() = 'authenticated' );

create policy "Products are insertable by authenticated users"
  on "public"."products" for insert
  with check ( auth.role() = 'authenticated' );

create policy "Products are updatable by authenticated users"
  on "public"."products" for update
  using ( auth.role() = 'authenticated' );

-- Create updated_at trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_products_updated_at
  before update on "public"."products"
  for each row
  execute function handle_updated_at();

-- Create indexes
create index if not exists products_title_idx on "public"."products" using gin (to_tsvector('french', title));
create index if not exists products_vendor_idx on "public"."products"(vendor);
create index if not exists products_status_idx on "public"."products"(status);
create index if not exists products_synced_at_idx on "public"."products"(synced_at);

-- Create function to search products
create or replace function search_products(search_query text)
returns setof "public"."products" as $$
begin
  return query
  select *
  from "public"."products"
  where
    to_tsvector('french', title) @@ plainto_tsquery('french', search_query)
    or vendor ilike '%' || search_query || '%'
    or product_type ilike '%' || search_query || '%'
    or handle ilike '%' || search_query || '%'
  order by ts_rank(to_tsvector('french', title), plainto_tsquery('french', search_query)) desc;
end;
$$ language plpgsql;
