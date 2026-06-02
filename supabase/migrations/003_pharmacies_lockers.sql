-- Pharmacies table
create table pharmacies (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references profiles(id) on delete cascade,
  name          text not null,
  address       text not null,
  lat           decimal(10, 8) not null,
  lng           decimal(11, 8) not null,
  phone         text,
  email         text,
  is_active     boolean default true,
  has_locker    boolean default false,
  created_at    timestamptz default now()
);

-- Pharmacy medication prices
create table pharmacy_medication_prices (
  id            uuid primary key default uuid_generate_v4(),
  pharmacy_id   uuid not null references pharmacies(id) on delete cascade,
  medication_id uuid not null references medications(id) on delete cascade,
  price_myr     decimal(10, 2) not null check (price_myr >= 0),
  in_stock      boolean default true,
  updated_at    timestamptz default now(),
  unique(pharmacy_id, medication_id)
);

-- Locker slots (virtual)
create table locker_slots (
  id            uuid primary key default uuid_generate_v4(),
  pharmacy_id   uuid not null references pharmacies(id) on delete cascade,
  slot_date     date not null,
  slot_time     time not null,           -- e.g. 10:00, 10:30, 11:00
  is_available  boolean default true,
  booked_by     uuid references profiles(id),
  booked_at     timestamptz,
  created_at    timestamptz default now(),
  unique(pharmacy_id, slot_date, slot_time)
);

-- RLS
alter table pharmacies enable row level security;
alter table pharmacy_medication_prices enable row level security;
alter table locker_slots enable row level security;

create policy "Anyone can view active pharmacies"
  on pharmacies for select using (is_active = true);

create policy "Pharmacy owner can manage their pharmacy"
  on pharmacies for all using (auth.uid() = owner_id);

create policy "Anyone can view prices"
  on pharmacy_medication_prices for select using (true);

create policy "Pharmacy owner can manage prices"
  on pharmacy_medication_prices for all
  using (
    auth.uid() = (select owner_id from pharmacies where id = pharmacy_id)
  );

create policy "Anyone can view available slots"
  on locker_slots for select using (true);

create policy "Pharmacy owner can manage slots"
  on locker_slots for all
  using (
    auth.uid() = (select owner_id from pharmacies where id = pharmacy_id)
  );
