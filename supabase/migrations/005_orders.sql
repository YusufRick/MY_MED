-- Order fulfilment type
create type fulfilment_type as enum ('locker', 'delivery');

-- Order status
create type order_status as enum (
  'pending',       -- patient submitted
  'confirmed',     -- pharmacy confirmed
  'ready',         -- meds packed and ready
  'dispatched',    -- rider picked up (delivery only)
  'completed',     -- patient collected/received
  'cancelled'
);

-- Orders
create table orders (
  id                  uuid primary key default uuid_generate_v4(),
  patient_id          uuid not null references profiles(id),
  pharmacy_id         uuid not null references pharmacies(id),
  prescription_id     uuid references prescriptions(id),
  fulfilment_type     fulfilment_type not null,
  locker_slot_id      uuid references locker_slots(id),
  grab_booking_ref    text,
  delivery_address    text,
  status              order_status not null default 'pending',
  qr_code             text,                -- base64 QR for locker pickup
  total_myr           decimal(10, 2),
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Order line items
create table order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references orders(id) on delete cascade,
  medication_id   uuid not null references medications(id),
  quantity        int not null default 1,
  unit_price_myr  decimal(10, 2) not null,
  created_at      timestamptz default now()
);

-- RLS
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Patient can view own orders"
  on orders for select using (auth.uid() = patient_id);

create policy "Patient can create orders"
  on orders for insert with check (auth.uid() = patient_id);

create policy "Pharmacy can view and update their orders"
  on orders for all
  using (
    auth.uid() = (select owner_id from pharmacies where id = pharmacy_id)
  );

create policy "Patient/pharmacy can view order items"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id
      and (
        o.patient_id = auth.uid() or
        auth.uid() = (select owner_id from pharmacies where id = o.pharmacy_id)
      )
    )
  );

-- Decrement refills when order is completed
create or replace function decrement_refills_on_order()
returns trigger as $$
declare
  item record;
begin
  if new.status = 'completed' and old.status != 'completed' then
    for item in
      select oi.medication_id
      from order_items oi where oi.order_id = new.id
    loop
      update patient_medication_access
      set refills_remaining = greatest(refills_remaining - 1, 0),
          updated_at = now()
      where patient_id = new.patient_id
        and medication_id = item.medication_id
        and refills_remaining > 0;
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_completed
  after update on orders
  for each row execute procedure decrement_refills_on_order();
