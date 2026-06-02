-- ─── ADMIN SETUP ─────────────────────────────────────────────
-- After creating your account via the signup page,
-- run this in Supabase SQL Editor to make yourself admin:
--
--   UPDATE profiles SET role = 'admin' WHERE id = '<your-user-id>';
--
-- Find your user ID under Authentication → Users in the Supabase dashboard.
-- Only do this once for the first admin. All other users go through the UI.

-- Sample medications (mix of OTC and Rx-only)
insert into medications (name, generic_name, description, dosage_form, strength, access_type) values
  ('Panadol',        'Paracetamol',     'Pain relief and fever reducer',    'tablet',  '500mg', 'otc'),
  ('Ibuprofen',      'Ibuprofen',       'Anti-inflammatory pain relief',    'tablet',  '400mg', 'otc'),
  ('Clarityne',      'Loratadine',      'Non-drowsy antihistamine',         'tablet',  '10mg',  'otc'),
  ('Metformin',      'Metformin HCl',   'Type 2 diabetes management',       'tablet',  '500mg', 'prescription_only'),
  ('Lisinopril',     'Lisinopril',      'ACE inhibitor for hypertension',   'tablet',  '10mg',  'prescription_only'),
  ('Amoxicillin',    'Amoxicillin',     'Broad-spectrum antibiotic',        'capsule', '250mg', 'prescription_only'),
  ('Atorvastatin',   'Atorvastatin',    'Cholesterol-lowering statin',      'tablet',  '20mg',  'prescription_only'),
  ('Cetirizine',     'Cetirizine HCl',  'Antihistamine for allergies',      'tablet',  '10mg',  'otc'),
  ('Omeprazole',     'Omeprazole',      'Proton pump inhibitor for GERD',   'capsule', '20mg',  'otc'),
  ('Salbutamol',     'Salbutamol',      'Bronchodilator for asthma',        'inhaler', '100mcg','prescription_only');

-- Sample pharmacies in Kuala Lumpur
insert into pharmacies (owner_id, name, address, lat, lng, phone, has_locker, is_active)
select
  (select id from profiles where role = 'pharmacy' limit 1),
  p.name, p.address, p.lat, p.lng, p.phone, p.has_locker, true
from (values
  ('Guardian Pharmacy KLCC',      'Suria KLCC, Kuala Lumpur City Centre, 50088 KL',      3.1578, 101.7123, '03-2382 2288', true),
  ('Watsons Bukit Bintang',       'Pavilion KL, 168 Jalan Bukit Bintang, 55100 KL',      3.1488, 101.7132, '03-2141 8688', true),
  ('Caring Pharmacy Mid Valley',  'Mid Valley Megamall, Lingkaran Syed Putra, 59200 KL', 3.1179, 101.6774, '03-2282 8111', false),
  ('BIG Pharmacy Damansara',      'Damansara Uptown, 47400 Petaling Jaya, Selangor',      3.1385, 101.6230, '03-7722 1818', true),
  ('Pharmacy One Bangsar',        'Bangsar Shopping Centre, 285 Jalan Maarof, 59000 KL', 3.1314, 101.6742, '03-2094 5678', false)
) as p(name, address, lat, lng, phone, has_locker);
