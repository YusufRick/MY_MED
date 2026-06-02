-- Add admin to the role enum and add pending state
alter type user_role add value if not exists 'admin';

-- Add pending column to profiles (null role = awaiting admin approval)
-- We repurpose the role column: null means pending
-- Drop NOT NULL constraint so new users can have no role
alter table profiles alter column role drop not null;

-- Admin can view and update all profiles
create policy "Admin can view all profiles"
  on profiles for select
  using (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

create policy "Admin can update all profiles"
  on profiles for update
  using (
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- Seed script helper: call this in SQL editor to make yourself admin
-- UPDATE profiles SET role = 'admin' WHERE id = '<your-user-id>';
