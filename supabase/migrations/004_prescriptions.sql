-- Prescription status enum
create type prescription_status as enum (
  'pending',    -- doctor created, awaiting staff approval
  'approved',   -- staff approved
  'rejected',   -- staff rejected
  'fulfilled'   -- patient has collected/received all meds
);

-- Prescriptions
create table prescriptions (
  id            uuid primary key default uuid_generate_v4(),
  patient_id    uuid not null references profiles(id),
  doctor_id     uuid not null references profiles(id),
  approved_by   uuid references profiles(id),
  status        prescription_status not null default 'pending',
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Prescription line items (one per medication)
create table prescription_items (
  id              uuid primary key default uuid_generate_v4(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medication_id   uuid not null references medications(id),
  dosage          text not null,          -- e.g. "1 tablet twice daily"
  quantity        int not null default 1,
  refills         int not null default 0, -- number of refills allowed
  created_at      timestamptz default now()
);

-- RLS
alter table prescriptions enable row level security;
alter table prescription_items enable row level security;

create policy "Patient can view own prescriptions"
  on prescriptions for select using (auth.uid() = patient_id);

create policy "Doctor can manage own prescriptions"
  on prescriptions for all using (auth.uid() = doctor_id);

create policy "Staff can view and approve all prescriptions"
  on prescriptions for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'clinic_staff'
    )
  );

create policy "Patient/doctor can view prescription items"
  on prescription_items for select
  using (
    exists (
      select 1 from prescriptions p
      where p.id = prescription_id
      and (p.patient_id = auth.uid() or p.doctor_id = auth.uid())
    )
  );

create policy "Doctor can manage prescription items"
  on prescription_items for all
  using (
    exists (
      select 1 from prescriptions p
      where p.id = prescription_id and p.doctor_id = auth.uid()
    )
  );

-- When a prescription is approved, flag patient access for each medication
create or replace function grant_patient_medication_access()
returns trigger as $$
declare
  item record;
begin
  if new.status = 'approved' and old.status = 'pending' then
    for item in
      select * from prescription_items where prescription_id = new.id
    loop
      insert into patient_medication_access
        (patient_id, medication_id, prescribed_by, refills_remaining)
      values
        (new.patient_id, item.medication_id, new.doctor_id, item.refills + 1)
      on conflict (patient_id, medication_id) do update
        set refills_remaining = patient_medication_access.refills_remaining + item.refills + 1,
            updated_at = now();
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_prescription_approved
  after update on prescriptions
  for each row execute procedure grant_patient_medication_access();
