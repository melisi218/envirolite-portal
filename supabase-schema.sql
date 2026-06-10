-- =============================================
-- Envirolite Portal - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Companies table (Cardinal Health, Grainger, Medline, etc.)
create table companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default now()
);

-- Requests table (one company has many requests)
create table requests (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references companies(id) on delete cascade,
  title text not null,
  description text,
  status text default 'In Progress' check (status in ('In Progress', 'On Hold', 'Completed', 'Cancelled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Products table (one request has many products)
create table products (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references requests(id) on delete cascade,
  name text not null,
  sku text,
  -- Packaging specs
  box_length_in numeric,
  box_width_in numeric,
  box_height_in numeric,
  pieces_per_unit integer,
  units_per_case integer,
  cases_per_pallet integer,
  pallet_pattern text,
  -- Weight
  unit_weight_lbs numeric,
  case_weight_lbs numeric,
  -- Notes
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Files table (photos + documents linked to a product)
create table product_files (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  file_name text not null,
  file_path text not null,   -- Supabase Storage path
  file_type text not null,   -- 'photo' | 'document'
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamp with time zone default now()
);

-- Seed initial companies
insert into companies (name) values
  ('Cardinal Health'),
  ('Grainger'),
  ('Medline');

-- Enable Row Level Security (open for now, lock down when you add auth)
alter table companies enable row level security;
alter table requests enable row level security;
alter table products enable row level security;
alter table product_files enable row level security;

-- Allow all operations while using PIN gate (update these when you add real auth)
create policy "Allow all" on companies for all using (true);
create policy "Allow all" on requests for all using (true);
create policy "Allow all" on products for all using (true);
create policy "Allow all" on product_files for all using (true);

-- Storage bucket for product files
-- Run this after creating the schema:
-- insert into storage.buckets (id, name, public) values ('product-files', 'product-files', false);
