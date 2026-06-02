-- Medication access type
create type medication_access as enum ('otc', 'prescription_only');

-- Medications table (seeded from OpenFDA or manually)
create table medications (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  generic_name  text,
  description   text,
  dosage_form   text,           -- tablet, capsule, syrup, etc.
  strength      text,           -- e.g. "500mg"
  access_type   medication_access not null default 'otc',
  openfda_id    text,           -- reference to OpenFDA record
  created_at    timestamptz default now()
);

-- Patient medication access (prescription flag)
create table patient_medication_access (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references profiles(id) on delete cascade,
  medication_id   uuid not null references medications(id) on delete cascade,
  prescribed_by   uuid not null references profiles(id),
  refills_remaining int not null default 1 check (refills_remaining >= 0),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(patient_id, medication_id)
);

-- RLS
alter table medications enable row level security;
alter table patient_medication_access enable row level security;

create policy "Anyone can view medications"
  on medications for select using (true);

create policy "Patient can view own access"
  on patient_medication_access for select
  using (auth.uid() = patient_id);

create policy "Doctor can manage patient access"
  on patient_medication_access for all
  using (auth.uid() = prescribed_by);
