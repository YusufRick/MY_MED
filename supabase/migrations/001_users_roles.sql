-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Roles enum
create type user_role as enum ('doctor', 'clinic_staff', 'pharmacy', 'patient');

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null,
  full_name   text not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- RLS
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    null,  -- no role until admin approves
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
