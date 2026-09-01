-- Sample seed data — matches the categories in the mobile app mockup

INSERT INTO categories (name, name_ta, name_kn, slug, icon, color, sort_order) VALUES
  ('Hospitals & Clinics',     'மருத்துவமனைகள் & மருந்தகங்கள்', 'ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಚಿಕಿತ್ಸಾಲಯಗಳು', 'hospitals',     'Hospital',        '#1F5F5B', 1),
  ('Restaurants & Hotels',    'உணவகங்கள் & ஹோட்டல்கள்', 'ಹೋಟೆಲ್‌ಗಳು ಮತ್ತು ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು', 'food',          'UtensilsCrossed', '#B5482F', 2),
  ('Schools & Colleges',      'பள்ளிகள் & கல்லூரிகள்', 'ಶಾಲೆಗಳು ಮತ್ತು ಕಾಲೇಜುಗಳು', 'education',     'GraduationCap',   '#6B7A34', 3),
  ('Grocery & Supermarkets',  'மளிகை & சூப்பர் மார்க்கெட்', 'ದಿನಸಿ ಮತ್ತು ಸೂಪರ್ ಮಾರ್ಕೆಟ್', 'grocery',       'ShoppingCart',    '#F2B705', 4),
  ('Auto & Garage',           'ஆட்டோ & கேரேஜ்', 'ಆಟೋ ಮತ್ತು ಗ್ಯಾರೇಜ್', 'auto',          'Car',             '#1F5F5B', 5),
  ('Home Services',           'வீட்டு சேவைகள்', 'ಮನೆ ಸೇವೆಗಳು', 'homeservices',  'Wrench',          '#B5482F', 6),
  ('Banks & ATMs',            'வங்கிகள் & ஏடிஎம்கள்', 'ಬ್ಯಾಂಕ್‌ಗಳು ಮತ್ತು ಎಟಿಎಂಗಳು', 'banks',         'Landmark',        '#6B7A34', 7),
  ('Temples & Worship',       'கோவில்கள் & வழிபாடு', 'ದೇವಾಲಯಗಳು ಮತ್ತು ಪೂಜೆ', 'temples',       'Flame',           '#F2B705', 8);

INSERT INTO businesses (category_id, name, tagline, phone, whatsapp, address, rating) VALUES
  ((SELECT id FROM categories WHERE slug = 'hospitals'), 'Kaveri Multispeciality Clinic', 'General & Pediatrics', '919876510001', '919876510001', 'Bazaar Street, Thalavadi', 4.6),
  ((SELECT id FROM categories WHERE slug = 'hospitals'), 'Anna Nagar Health Centre', '24-Hour Emergency', '919876510002', '919876510002', 'Anna Nagar Main Road', 4.3),
  ((SELECT id FROM categories WHERE slug = 'food'), 'Malai Mandram Mess', 'South Indian Meals', '919876520001', '919876520001', 'Market Road, Thalavadi', 4.5),
  ((SELECT id FROM categories WHERE slug = 'grocery'), 'Thalavadi Big Bazaar Stores', 'Daily Groceries', '919876540001', '919876540001', 'Main Bazaar', 4.3);

-- Real Thalavadi bus timings (T.N.S.T.C & K.S.R.T.C - Private departures),
-- transcribed from an official Thalavadi bus stand timetable board.
-- NOTE: dense multi-column timetable transcription can have small errors —
-- please review this list once via Admin -> Buses and correct anything
-- that doesn't match the board; every field is fully editable there.
INSERT INTO bus_schedules (route_name, source, destination, departure_time, bus_type, operator, notes) VALUES
  -- Thalavadi -> Sathyamangalam (via Hassanur)
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '05:00', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '06:00', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '06:30', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '07:15', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '08:00', 'Private', 'S.R.T', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '08:20', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '09:05', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '09:20', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '10:10', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '11:35', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '12:30', 'Private', 'N.M.S', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '13:10', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '14:05', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '14:45', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '15:45', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '16:15', 'Private', 'S.R.T', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '17:30', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '18:30', 'Government', 'T.N.S.T.C', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '18:45', 'Private', 'N.M.S', 'via Hassanur'),
  ('Thalavadi - Sathyamangalam (via Hassanur)', 'Thalavadi', 'Sathyamangalam', '19:15', 'Private', 'R.P.N', 'via Hassanur'),

  -- Thalavadi -> Panakahalli (via Eraganahalli)
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '06:20', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '07:05', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '08:30', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '09:20', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '11:35', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '13:35', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '15:45', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '16:10', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),
  ('Thalavadi - Panakahalli (via Eraganahalli)', 'Thalavadi', 'Panakahalli', '18:20', 'Government', 'T.N.S.T.C', 'via Eraganahalli'),

  -- Thalavadi -> Sathyamangalam (via Thalamalai)
  ('Thalavadi - Sathyamangalam (via Thalamalai)', 'Thalavadi', 'Sathyamangalam', '07:00', 'Private', 'RAMANI', 'via Thalamalai'),
  ('Thalavadi - Sathyamangalam (via Thalamalai)', 'Thalavadi', 'Sathyamangalam', '09:45', 'Government', 'T.N.S.T.C', 'via Thalamalai'),
  ('Thalavadi - Sathyamangalam (via Thalamalai)', 'Thalavadi', 'Sathyamangalam', '13:30', 'Government', 'T.N.S.T.C', 'via Thalamalai'),
  ('Thalavadi - Sathyamangalam (via Thalamalai)', 'Thalavadi', 'Sathyamangalam', '18:20', 'Government', 'T.N.S.T.C', 'via Thalamalai'),

  -- Thalavadi -> Panakahalli (via Arulvadi)
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '06:15', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '07:35', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '08:30', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '09:15', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '10:25', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '11:50', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '13:45', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '15:00', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '16:20', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '17:05', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '17:20', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '18:20', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '19:40', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '20:30', 'Government', 'T.N.S.T.C', 'via Arulvadi'),
  ('Thalavadi - Panakahalli (via Arulvadi)', 'Thalavadi', 'Panakahalli', '21:50', 'Government', 'T.N.S.T.C', 'via Arulvadi'),

  -- Thalavadi -> Kodipuram
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '06:00', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '09:15', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '09:30', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '10:25', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '10:30', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '11:45', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '13:00', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '14:20', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '15:15', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '16:10', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '17:25', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '17:50', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '19:30', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '20:00', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Kodipuram', 'Thalavadi', 'Kodipuram', '21:50', 'Government', 'T.N.S.T.C', NULL),

  -- Thalavadi -> Gettavadi
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '06:00', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '07:35', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '10:30', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '11:45', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '13:00', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '14:20', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '14:45', 'Private', 'RAMANI', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '15:20', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '16:50', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '17:50', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '18:35', 'Private', 'RAMANI', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '19:40', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '20:20', 'Government', 'T.N.S.T.C', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '21:50', 'Government', 'T.N.S.T.C', NULL),

  -- K.S.R.T.C — Thalavadi -> Chennasandra (CH) Nagar / Bislavadi / Bangalore
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '07:30', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - Bangalore (KSRTC)', 'Thalavadi', 'Bangalore', '08:10', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - Bislavadi (KSRTC)', 'Thalavadi', 'Bislavadi', '08:20', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '09:05', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '09:35', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '10:00', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '10:40', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - Bislavadi (KSRTC)', 'Thalavadi', 'Bislavadi', '11:00', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '11:35', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '12:05', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '12:40', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '13:10', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - Bislavadi (KSRTC)', 'Thalavadi', 'Bislavadi', '13:20', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '14:00', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '14:40', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '15:40', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '16:00', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '16:40', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '17:30', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '18:00', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '18:05', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - Bislavadi (KSRTC)', 'Thalavadi', 'Bislavadi', '18:35', 'Government', 'K.S.R.T.C', NULL),
  ('Thalavadi - CH Nagar (KSRTC)', 'Thalavadi', 'CH Nagar', '20:00', 'Government', 'K.S.R.T.C', NULL),

  -- Private operators — Thalavadi -> various (Mysore / Kollegal / Sathy / Erode / CH Nagar / etc.)
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '05:30', 'Private', 'RAMANI', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '06:00', 'Private', 'S.S.M', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '06:30', 'Private', 'R.D', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '07:00', 'Private', 'M.K.P', NULL),
  ('Thalavadi - Kollegal', 'Thalavadi', 'Kollegal', '07:42', 'Private', 'S.E.P', NULL),
  ('Thalavadi - Sathyamangalam', 'Thalavadi', 'Sathyamangalam', '08:00', 'Private', 'S.R.T', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '08:05', 'Private', 'S.P.S', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '08:35', 'Private', 'S.R.T', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '08:45', 'Private', 'A.R.P', NULL),
  ('Thalavadi - Sathyamangalam', 'Thalavadi', 'Sathyamangalam', '09:20', 'Private', 'S.V.P', NULL),
  ('Thalavadi - Sathyamangalam', 'Thalavadi', 'Sathyamangalam', '09:50', 'Private', 'N.M.S', NULL),
  ('Thalavadi - Kolipalayam', 'Thalavadi', 'Kolipalayam', '10:00', 'Private', 'M.K.P', NULL),
  ('Thalavadi - Erode', 'Thalavadi', 'Erode', '10:25', 'Private', 'R.P.N', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '10:30', 'Private', 'R.P.N', NULL),
  ('Thalavadi - Sathyamangalam', 'Thalavadi', 'Sathyamangalam', '11:00', 'Private', 'B.S.V', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '11:05', 'Private', 'R.P.N', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '11:30', 'Private', 'M.K.P', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '11:50', 'Private', 'R.P.N', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '12:25', 'Private', 'S.P.T', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '13:10', 'Private', 'RAMANI', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '13:35', 'Private', 'S.S.M', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '14:35', 'Private', 'S.R.T', NULL),
  ('Thalavadi - Kollegal', 'Thalavadi', 'Kollegal', '14:55', 'Private', 'S.K.M.S', NULL),
  ('Thalavadi - Gettavadi', 'Thalavadi', 'Gettavadi', '15:00', 'Private', 'RAMANI', NULL),
  ('Thalavadi - Kollegal', 'Thalavadi', 'Kollegal', '15:35', 'Private', 'M.K.P', NULL),
  ('Thalavadi - Sathyamangalam', 'Thalavadi', 'Sathyamangalam', '16:15', 'Private', 'S.R.T', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '16:20', 'Private', 'RAMANI', NULL),
  ('Thalavadi - Kollegal', 'Thalavadi', 'Kollegal', '16:45', 'Private', 'S.P.S', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '17:00', 'Private', 'R.P.N', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '17:15', 'Private', 'S.P.S', NULL),
  ('Thalavadi - CH Nagar', 'Thalavadi', 'CH Nagar', '17:40', 'Private', 'B.S.V', NULL),
  ('Thalavadi - Kollegal', 'Thalavadi', 'Kollegal', '17:40', 'Private', 'S.E.P', NULL),
  ('Thalavadi - Mysore', 'Thalavadi', 'Mysore', '18:30', 'Private', 'R.P.N', NULL),
  ('Thalavadi - Sathyamangalam', 'Thalavadi', 'Sathyamangalam', '19:00', 'Private', 'N.M.S', NULL),
  ('Thalavadi - Erode', 'Thalavadi', 'Erode', '19:15', 'Private', 'R.P.N', NULL),
  ('Thalavadi - Punjur', 'Thalavadi', 'Punjur', '20:00', 'Private', 'S.P.S', NULL);

  -- Chamarajanagar bus stand: full onward-connectivity schedule (KSRTC),
  -- useful for Thalavadi residents traveling further via Chamarajanagar.
  -- Source: "Chamarajanagar_Bus_Master" sheet, verified as of 2026-08-22.
INSERT INTO bus_schedules (route_name, source, destination, departure_time, bus_type, operator, notes) VALUES
  ('Chamarajanagar - Erode', 'Chamarajanagar', 'Erode', '06:00', 'Government', 'KSRTC', 'Express — via Hasanur → Bannari → Sathyamangalam → Gobichettipalayam'),
  ('Chamarajanagar - Erode', 'Chamarajanagar', 'Erode', '08:00', 'Government', 'KSRTC', 'Express — via Hasanur → Bannari → Sathyamangalam → Gobichettipalayam'),
  ('Chamarajanagar - Tiruppur', 'Chamarajanagar', 'Tiruppur', '10:45', 'Government', 'KSRTC', 'Express — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Avinashi'),
  ('Chamarajanagar - Ooty', 'Chamarajanagar', 'Ooty', '06:20', 'Government', 'KSRTC', 'Ordinary — via Gundlupet → Ooty'),
  ('Chamarajanagar - Mysuru', 'Chamarajanagar', 'Mysuru', '11:15', 'Government', 'KSRTC', 'Ordinary — via Mysuru corridor'),
  ('Chamarajanagar - Mysuru', 'Chamarajanagar', 'Mysuru', '12:30', 'Government', 'KSRTC', 'Ordinary — via Mysuru corridor'),
  ('Chamarajanagar - Tirupati', 'Chamarajanagar', 'Tirupati', '06:00', 'Government', 'KSRTC', 'Ordinary — via Via Kollegal'),
  ('Chamarajanagar - Tirupati', 'Chamarajanagar', 'Tirupati', '08:30', 'Government', 'KSRTC', 'Ordinary — via Via Kollegal'),
  ('Chamarajanagar - Madikeri', 'Chamarajanagar', 'Madikeri', '09:30', 'Government', 'KSRTC', 'Ordinary — via Via Mysuru'),
  ('Chamarajanagar - Dharmasthala', 'Chamarajanagar', 'Dharmasthala', '08:00', 'Government', 'KSRTC', 'Ordinary — via Via T. Narasipura → Mysuru'),
  ('Chamarajanagar - Emmemadu', 'Chamarajanagar', 'Emmemadu', '06:30', 'Government', 'KSRTC', 'Ordinary — via Via Mysuru'),
  ('Chamarajanagar - Harihar', 'Chamarajanagar', 'Harihar', '04:30', 'Government', 'KSRTC', 'Ordinary — via Via Mysuru'),
  ('Chamarajanagar - Kumbakonam', 'Chamarajanagar', 'Kumbakonam', '20:45', 'Government', 'KSRTC', 'Rajahamsa — via Via Sathyamangalam'),
  ('Chamarajanagar - Somvarpet', 'Chamarajanagar', 'Somvarpet', '08:40', 'Government', 'KSRTC', 'Ordinary — via Via Mysuru'),
  ('Chamarajanagar - Somvarpet', 'Chamarajanagar', 'Somvarpet', '10:30', 'Government', 'KSRTC', 'Ordinary — via Via Mysuru'),
  ('Chamarajanagar - Udupi', 'Chamarajanagar', 'Udupi', '07:20', 'Government', 'KSRTC', 'Ordinary — via Via Mysuru'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '07:30', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '08:30', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '09:15', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '10:00', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '11:00', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '11:30', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '13:30', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '14:00', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '14:30', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '14:45', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '15:10', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '15:30', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '16:20', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '16:30', 'Government', 'KSRTC', 'Airavat — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '17:45', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '18:30', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '18:45', 'Government', 'KSRTC', 'Airavat — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '20:30', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Coimbatore', 'Chamarajanagar', 'Coimbatore', '22:00', 'Government', 'KSRTC', 'Ordinary — via Hasanur → Bannari → Sathyamangalam → Puliyampatti → Annur'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '04:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '04:20', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '04:30', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '04:45', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '05:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '05:20', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '05:45', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '06:10', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '07:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '07:10', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '08:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '08:15', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '08:30', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '09:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '09:30', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '10:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '10:15', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '10:40', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '11:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '11:10', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '11:15', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '11:20', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '11:30', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '11:45', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '12:30', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '13:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '13:30', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '14:30', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '15:00', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Bengaluru', 'Chamarajanagar', 'Bengaluru', '18:20', 'Government', 'KSRTC', 'Ordinary — via Kollegal → Maddur / Kanakapura corridor'),
  ('Chamarajanagar - Madurai', 'Chamarajanagar', 'Madurai', '00:30', 'Government', 'KSRTC', 'Karnataka Sarige — via Hasanur → Bannari → Sathyamangalam → Erode → Karur → Dindigul'),
  ('Chamarajanagar - Madurai', 'Chamarajanagar', 'Madurai', '20:30', 'Government', 'KSRTC', 'Karnataka Sarige / Rajahamsa — via Hasanur → Bannari → Sathyamangalam → Coimbatore → Pollachi → Palani'),
  ('Chamarajanagar - Madurai', 'Chamarajanagar', 'Madurai', '21:30', 'Government', 'KSRTC', 'Karnataka Sarige / Rajahamsa — via Hasanur → Bannari → Sathyamangalam → Erode → Karur → Dindigul'),
  ('Chamarajanagar - Madurai', 'Chamarajanagar', 'Madurai', '22:30', 'Government', 'KSRTC', 'Karnataka Sarige / Rajahamsa — via Hasanur → Bannari → Sathyamangalam → Tiruppur → Dharapuram');

  -- Sathyamangalam bus stand: departure board covering Thalavadi
  -- (both hill routes), surrounding towns, and major cities. Rows
  -- marked "Every N mins" are frequent/running services rather than
  -- fixed timings — the listed departure_time is the service window's
  -- start, with the full frequency description preserved in notes.
INSERT INTO bus_schedules (route_name, source, destination, departure_time, bus_type, operator, notes) VALUES
  ('Sathyamangalam - Thalavadi (via Thalamalai)', 'Sathyamangalam', 'Thalavadi', '06:00', 'Government', 'TNSTC Hill / Rural Service', 'via Bannari to Thalamalai Forest to Ramaranai to Kotada'),
  ('Sathyamangalam - Thalavadi (via Thalamalai)', 'Sathyamangalam', 'Thalavadi', '12:15', 'Government', 'TNSTC Hill / Rural Service', 'via Bannari to Thalamalai Forest to Ramaranai to Kotada'),
  ('Sathyamangalam - Thalavadi (via Thalamalai)', 'Sathyamangalam', 'Thalavadi', '15:45', 'Government', 'TNSTC Hill / Rural Service', 'via Bannari to Thalamalai Forest to Ramaranai to Kotada'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '07:05', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '08:05', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '09:35', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '10:30', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '11:20', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '12:15', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '13:10', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '14:05', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '15:05', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '17:15', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '18:45', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '19:20', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Thalavadi (via Dhimbam)', 'Sathyamangalam', 'Thalavadi', '20:15', 'Government', 'TNSTC (Thalavadi Depot / Erode Div)', 'via Bannari to Dhimbam Ghats (27 Bends) to Hasanur'),
  ('Sathyamangalam - Coimbatore (Gandhipuram)', 'Sathyamangalam', 'Coimbatore', '03:30', 'Government', 'TNSTC, Private (Annur, SRS)', 'Every 5-10 mins (03:30 AM to 11:30 PM) — via Puliyampatti to Annur to Saravanampatti'),
  ('Sathyamangalam - Erode', 'Sathyamangalam', 'Erode', '04:00', 'Government', 'TNSTC, Private', 'Every 5-10 mins (04:00 AM to 11:45 PM) — via Gobichettipalayam to Perundurai / Kavindapadi'),
  ('Sathyamangalam - Gobichettipalayam', 'Sathyamangalam', 'Gobichettipalayam', '00:00', 'Government', 'TNSTC, Town Buses', 'Every 5-10 mins (24 Hours) — via Direct / Alathukombai'),
  ('Sathyamangalam - Tiruppur', 'Sathyamangalam', 'Tiruppur', '04:30', 'Government', 'TNSTC, Private', 'Every 15-20 mins (04:30 AM to 10:30 PM) — via Puliyampatti to Sevur to Avinashi'),
  ('Sathyamangalam - Mettupalayam / Ooty', 'Sathyamangalam', 'Mettupalayam / Ooty', '05:00', 'Government', 'TNSTC (Nilgiris / Erode Div)', 'Every 20-30 mins (05:00 AM to 09:30 PM) — via Sirumugai to Mettupalayam to Coonoor'),
  ('Sathyamangalam - Bannari Amman Temple', 'Sathyamangalam', 'Bannari Amman Temple', '05:30', 'Government', 'TNSTC', 'Every 15-20 mins (05:30 AM to 09:30 PM) — via Direct (Shuttle)'),
  ('Sathyamangalam - Chamarajanagar', 'Sathyamangalam', 'Chamarajanagar', '06:00', 'Government', 'KSRTC (Sarige), TNSTC', 'via Dhimbam to Hasanur to Punajanur'),
  ('Sathyamangalam - Chamarajanagar', 'Sathyamangalam', 'Chamarajanagar', '07:15', 'Government', 'KSRTC (Sarige), TNSTC', 'via Dhimbam to Hasanur to Punajanur'),
  ('Sathyamangalam - Chamarajanagar', 'Sathyamangalam', 'Chamarajanagar', '08:45', 'Government', 'KSRTC (Sarige), TNSTC', 'via Dhimbam to Hasanur to Punajanur'),
  ('Sathyamangalam - Chamarajanagar', 'Sathyamangalam', 'Chamarajanagar', '10:30', 'Government', 'KSRTC (Sarige), TNSTC', 'via Dhimbam to Hasanur to Punajanur'),
  ('Sathyamangalam - Chamarajanagar', 'Sathyamangalam', 'Chamarajanagar', '12:00', 'Government', 'KSRTC (Sarige), TNSTC', 'via Dhimbam to Hasanur to Punajanur'),
  ('Sathyamangalam - Chamarajanagar', 'Sathyamangalam', 'Chamarajanagar', '13:45', 'Government', 'KSRTC (Sarige), TNSTC', 'via Dhimbam to Hasanur to Punajanur'),
  ('Sathyamangalam - Chamarajanagar', 'Sathyamangalam', 'Chamarajanagar', '15:30', 'Government', 'KSRTC (Sarige), TNSTC', 'via Dhimbam to Hasanur to Punajanur'),
  ('Sathyamangalam - Chamarajanagar', 'Sathyamangalam', 'Chamarajanagar', '17:15', 'Government', 'KSRTC (Sarige), TNSTC', 'via Dhimbam to Hasanur to Punajanur'),
  ('Sathyamangalam - Mysuru (Mysore)', 'Sathyamangalam', 'Mysuru', '06:30', 'Government', 'KSRTC, TNSTC, Private', 'via Hasanur to Chamarajanagar to Nanjangud'),
  ('Sathyamangalam - Mysuru (Mysore)', 'Sathyamangalam', 'Mysuru', '07:45', 'Government', 'KSRTC, TNSTC, Private', 'via Hasanur to Chamarajanagar to Nanjangud'),
  ('Sathyamangalam - Mysuru (Mysore)', 'Sathyamangalam', 'Mysuru', '09:00', 'Government', 'KSRTC, TNSTC, Private', 'via Hasanur to Chamarajanagar to Nanjangud'),
  ('Sathyamangalam - Mysuru (Mysore)', 'Sathyamangalam', 'Mysuru', '11:15', 'Government', 'KSRTC, TNSTC, Private', 'via Hasanur to Chamarajanagar to Nanjangud'),
  ('Sathyamangalam - Mysuru (Mysore)', 'Sathyamangalam', 'Mysuru', '13:00', 'Government', 'KSRTC, TNSTC, Private', 'via Hasanur to Chamarajanagar to Nanjangud'),
  ('Sathyamangalam - Mysuru (Mysore)', 'Sathyamangalam', 'Mysuru', '14:30', 'Government', 'KSRTC, TNSTC, Private', 'via Hasanur to Chamarajanagar to Nanjangud'),
  ('Sathyamangalam - Mysuru (Mysore)', 'Sathyamangalam', 'Mysuru', '16:15', 'Government', 'KSRTC, TNSTC, Private', 'via Hasanur to Chamarajanagar to Nanjangud'),
  ('Sathyamangalam - Mysuru (Mysore)', 'Sathyamangalam', 'Mysuru', '18:00', 'Government', 'KSRTC, TNSTC, Private', 'via Hasanur to Chamarajanagar to Nanjangud'),
  ('Sathyamangalam - Kollegal', 'Sathyamangalam', 'Kollegal', '07:00', 'Government', 'KSRTC, TNSTC', 'via Dhimbam to Germalam / Hasanur to Hanur'),
  ('Sathyamangalam - Kollegal', 'Sathyamangalam', 'Kollegal', '09:30', 'Government', 'KSRTC, TNSTC', 'via Dhimbam to Germalam / Hasanur to Hanur'),
  ('Sathyamangalam - Kollegal', 'Sathyamangalam', 'Kollegal', '12:30', 'Government', 'KSRTC, TNSTC', 'via Dhimbam to Germalam / Hasanur to Hanur'),
  ('Sathyamangalam - Kollegal', 'Sathyamangalam', 'Kollegal', '15:00', 'Government', 'KSRTC, TNSTC', 'via Dhimbam to Germalam / Hasanur to Hanur'),
  ('Sathyamangalam - Kollegal', 'Sathyamangalam', 'Kollegal', '17:00', 'Government', 'KSRTC, TNSTC', 'via Dhimbam to Germalam / Hasanur to Hanur'),
  ('Sathyamangalam - Bengaluru (Bangalore)', 'Sathyamangalam', 'Bengaluru', '08:30', 'Government', 'KSRTC, SETC, Private Omnibuses', 'via Chamarajanagar to Kollegal OR Salem to Hosur'),
  ('Sathyamangalam - Bengaluru (Bangalore)', 'Sathyamangalam', 'Bengaluru', '10:30', 'Government', 'KSRTC, SETC, Private Omnibuses', 'via Chamarajanagar to Kollegal OR Salem to Hosur'),
  ('Sathyamangalam - Bengaluru (Bangalore)', 'Sathyamangalam', 'Bengaluru', '13:30', 'Government', 'KSRTC, SETC, Private Omnibuses', 'via Chamarajanagar to Kollegal OR Salem to Hosur'),
  ('Sathyamangalam - Bengaluru (Bangalore)', 'Sathyamangalam', 'Bengaluru', '21:30', 'Government', 'KSRTC, SETC, Private Omnibuses', 'via Chamarajanagar to Kollegal OR Salem to Hosur'),
  ('Sathyamangalam - Bengaluru (Bangalore)', 'Sathyamangalam', 'Bengaluru', '22:15', 'Government', 'KSRTC, SETC, Private Omnibuses', 'via Chamarajanagar to Kollegal OR Salem to Hosur'),
  ('Sathyamangalam - Bengaluru (Bangalore)', 'Sathyamangalam', 'Bengaluru', '23:00', 'Government', 'KSRTC, SETC, Private Omnibuses', 'via Chamarajanagar to Kollegal OR Salem to Hosur'),
  ('Sathyamangalam - Salem', 'Sathyamangalam', 'Salem', '05:00', 'Government', 'TNSTC', 'via Gobi to Anthiyur to Bhavani to Sankari'),
  ('Sathyamangalam - Salem', 'Sathyamangalam', 'Salem', '06:30', 'Government', 'TNSTC', 'via Gobi to Anthiyur to Bhavani to Sankari'),
  ('Sathyamangalam - Salem', 'Sathyamangalam', 'Salem', '08:00', 'Government', 'TNSTC', 'via Gobi to Anthiyur to Bhavani to Sankari'),
  ('Sathyamangalam - Salem', 'Sathyamangalam', 'Salem', '11:00', 'Government', 'TNSTC', 'via Gobi to Anthiyur to Bhavani to Sankari'),
  ('Sathyamangalam - Salem', 'Sathyamangalam', 'Salem', '14:00', 'Government', 'TNSTC', 'via Gobi to Anthiyur to Bhavani to Sankari'),
  ('Sathyamangalam - Salem', 'Sathyamangalam', 'Salem', '16:30', 'Government', 'TNSTC', 'via Gobi to Anthiyur to Bhavani to Sankari'),
  ('Sathyamangalam - Salem', 'Sathyamangalam', 'Salem', '18:30', 'Government', 'TNSTC', 'via Gobi to Anthiyur to Bhavani to Sankari'),
  ('Sathyamangalam - Madurai / Palani', 'Sathyamangalam', 'Madurai / Palani', '05:30', 'Government', 'TNSTC', 'via Tiruppur to Dharapuram to Oddanchatram'),
  ('Sathyamangalam - Madurai / Palani', 'Sathyamangalam', 'Madurai / Palani', '07:00', 'Government', 'TNSTC', 'via Tiruppur to Dharapuram to Oddanchatram'),
  ('Sathyamangalam - Madurai / Palani', 'Sathyamangalam', 'Madurai / Palani', '09:15', 'Government', 'TNSTC', 'via Tiruppur to Dharapuram to Oddanchatram'),
  ('Sathyamangalam - Madurai / Palani', 'Sathyamangalam', 'Madurai / Palani', '13:00', 'Government', 'TNSTC', 'via Tiruppur to Dharapuram to Oddanchatram'),
  ('Sathyamangalam - Madurai / Palani', 'Sathyamangalam', 'Madurai / Palani', '15:30', 'Government', 'TNSTC', 'via Tiruppur to Dharapuram to Oddanchatram'),
  ('Sathyamangalam - Madurai / Palani', 'Sathyamangalam', 'Madurai / Palani', '21:00', 'Government', 'TNSTC', 'via Tiruppur to Dharapuram to Oddanchatram'),
  ('Sathyamangalam - Trichy', 'Sathyamangalam', 'Trichy', '06:00', 'Government', 'TNSTC', 'via Erode to Karur to Kulithalai'),
  ('Sathyamangalam - Trichy', 'Sathyamangalam', 'Trichy', '08:30', 'Government', 'TNSTC', 'via Erode to Karur to Kulithalai'),
  ('Sathyamangalam - Trichy', 'Sathyamangalam', 'Trichy', '11:30', 'Government', 'TNSTC', 'via Erode to Karur to Kulithalai'),
  ('Sathyamangalam - Trichy', 'Sathyamangalam', 'Trichy', '14:30', 'Government', 'TNSTC', 'via Erode to Karur to Kulithalai'),
  ('Sathyamangalam - Trichy', 'Sathyamangalam', 'Trichy', '17:30', 'Government', 'TNSTC', 'via Erode to Karur to Kulithalai'),
  ('Sathyamangalam - Chennai', 'Sathyamangalam', 'Chennai', '19:30', 'Government', 'SETC, TNSTC Ultra Deluxe, Private Omni', 'via Salem to Villupuram to Tambaram / Koyambedu / KCBT'),
  ('Sathyamangalam - Chennai', 'Sathyamangalam', 'Chennai', '20:30', 'Government', 'SETC, TNSTC Ultra Deluxe, Private Omni', 'via Salem to Villupuram to Tambaram / Koyambedu / KCBT'),
  ('Sathyamangalam - Chennai', 'Sathyamangalam', 'Chennai', '21:15', 'Government', 'SETC, TNSTC Ultra Deluxe, Private Omni', 'via Salem to Villupuram to Tambaram / Koyambedu / KCBT'),
  ('Sathyamangalam - Chennai', 'Sathyamangalam', 'Chennai', '21:45', 'Government', 'SETC, TNSTC Ultra Deluxe, Private Omni', 'via Salem to Villupuram to Tambaram / Koyambedu / KCBT'),
  ('Sathyamangalam - Chennai', 'Sathyamangalam', 'Chennai', '22:30', 'Government', 'SETC, TNSTC Ultra Deluxe, Private Omni', 'via Salem to Villupuram to Tambaram / Koyambedu / KCBT');


-- Blood donors (sample — fictional volunteers)
INSERT INTO blood_donors (name, blood_group, phone, area, is_available) VALUES
  ('Karthik R.', 'O+', '919876601001', 'Anna Nagar', true),
  ('Priya S.', 'O+', '919876601002', 'Bazaar Street', true),
  ('Muthu K.', 'O-', '919876601003', 'Gandhi Street', true),
  ('Lakshmi N.', 'A+', '919876601004', 'Temple Road', true),
  ('Suresh P.', 'A-', '919876601005', 'School Street', false),
  ('Divya M.', 'B+', '919876601006', 'Market Road', true),
  ('Ravi T.', 'B-', '919876601007', 'New Colony', true),
  ('Anitha V.', 'AB+', '919876601008', 'Kovil Street', true),
  ('Gopal S.', 'AB-', '919876601009', 'Bypass Road', true),
  ('Meena R.', 'O+', '919876601010', 'Panchayat Office Road', true);

-- Farmers & Agriculture — subcategories and sample listing
INSERT INTO farmer_categories (name, name_ta, name_kn, slug, icon, sort_order) VALUES
  ('Tractors & Machinery', 'டிராக்டர் & இயந்திரங்கள்', 'ಟ್ರಾಕ್ಟರ್ ಮತ್ತು ಯಂತ್ರೋಪಕರಣಗಳು', 'tractors-machinery', 'Wrench', 1),
  ('Seeds & Nurseries', 'விதைகள் & நாற்றங்கால்கள்', 'ಬೀಜಗಳು ಮತ್ತು ನರ್ಸರಿಗಳು', 'seeds-nurseries', 'Sprout', 2),
  ('Irrigation & Water', 'பாசனம் & நீர்', 'ನೀರಾವರಿ ಮತ್ತು ನೀರು', 'irrigation-water', 'Droplet', 3),
  ('Livestock & Veterinary', 'கால்நடை & கால்நடை மருத்துவம்', 'ಜಾನುವಾರು ಮತ್ತು ಪಶುವೈದ್ಯಕೀಯ', 'livestock-veterinary', 'Stethoscope', 4),
  ('Crop Buyers', 'பயிர் வாங்குபவர்கள்', 'ಬೆಳೆ ಖರೀದಿದಾರರು', 'crop-buyers', 'Store', 5);

INSERT INTO farmer_services (category_id, name, contact_person, phone, whatsapp, address, village, service_area, description, opening_hours, is_verified) VALUES
  ((SELECT id FROM farmer_categories WHERE slug = 'seeds-nurseries'), 'Sri Lakshmi Nursery', 'Murugan', '919876706001', '919876706001', 'Near Bus Stand, Thalavadi', 'Thalavadi', 'Thalavadi, Bejalatti, Gettavadi',
   'Family-run nursery supplying vegetable seeds, saplings and fruit plants to farmers across the taluk.',
   'Mon-Sat: 8:00 AM - 7:00 PM', true);

-- Government Offices — Thalavadi Government Directory
-- Researched from Erode District Administration / Government of Tamil Nadu sources.
-- verification_status other than 'verified'/'official-service'/'official-source' means
-- the record is a category-level reference and should be reviewed/updated via Admin.

-- 20 citizen-oriented categories
-- ---------------------------------------------------------------------------

INSERT INTO government_categories
(name, name_ta, name_kn, slug, icon, display_order)
VALUES
('Revenue & Land', 'வருவாய் மற்றும் நிலம்', 'ಆದಾಯ ಮತ್ತು ಭೂಮಿ', 'revenue-land', 'land', 1),
('Local Administration', 'உள்ளாட்சி நிர்வாகம்', 'ಸ್ಥಳೀಯ ಆಡಳಿತ', 'local-administration', 'panchayat', 2),
('Police & Law', 'காவல்துறை மற்றும் சட்டம்', 'ಪೊಲೀಸ್ ಮತ್ತು ಕಾನೂನು', 'police-law', 'police', 3),
('Electricity', 'மின்சாரம்', 'ವಿದ್ಯುತ್', 'electricity', 'electricity', 4),
('Water & Public Works', 'குடிநீர் மற்றும் பொதுப்பணிகள்', 'ನೀರು ಮತ್ತು ಸಾರ್ವಜನಿಕ ಕಾಮಗಾರಿ', 'water-public-works', 'water', 5),
('Transport', 'போக்குவரத்து', 'ಸಾರಿಗೆ', 'transport', 'transport', 6),
('Health & Medical', 'சுகாதாரம் மற்றும் மருத்துவம்', 'ಆರೋಗ್ಯ ಮತ್ತು ವೈದ್ಯಕೀಯ', 'health-medical', 'health', 7),
('Education', 'கல்வி', 'ಶಿಕ್ಷಣ', 'education', 'education', 8),
('Agriculture & Farmers', 'விவசாயம் மற்றும் விவசாயிகள்', 'ಕೃಷಿ ಮತ್ತು ರೈತರು', 'agriculture-farmers', 'agriculture', 9),
('Social Welfare', 'சமூக நலத்துறை', 'ಸಾಮಾಜಿಕ ಕಲ್ಯಾಣ', 'social-welfare', 'social', 10),
('Food & Consumer Services', 'உணவு மற்றும் நுகர்வோர் சேவைகள்', 'ಆಹಾರ ಮತ್ತು ಗ್ರಾಹಕ ಸೇವೆಗಳು', 'food-consumer', 'food', 11),
('Employment & Labour', 'வேலைவாய்ப்பு மற்றும் தொழிலாளர்', 'ಉದ್ಯೋಗ ಮತ್ತು ಕಾರ್ಮಿಕ', 'employment-labour', 'employment', 12),
('Registration & Certificates', 'பதிவு மற்றும் சான்றிதழ்கள்', 'ನೋಂದಣಿ ಮತ್ತು ಪ್ರಮಾಣಪತ್ರಗಳು', 'registration-certificates', 'certificate', 13),
('Government Financial Services', 'அரசு நிதிச் சேவைகள்', 'ಸರ್ಕಾರಿ ಹಣಕಾಸು ಸೇವೆಗಳು', 'government-finance', 'finance', 14),
('Forest & Environment', 'வனத்துறை மற்றும் சுற்றுச்சூழல்', 'ಅರಣ್ಯ ಮತ್ತು ಪರಿಸರ', 'forest-environment', 'forest', 15),
('Housing & Urban Development', 'வீட்டு வசதி மற்றும் நகர்ப்புற வளர்ச்சி', 'ವಸತಿ ಮತ್ತು ನಗರಾಭಿವೃದ್ಧಿ', 'housing-urban', 'housing', 16),
('Industries & Business', 'தொழில் மற்றும் வணிகம்', 'ಕೈಗಾರಿಕೆಗಳು ಮತ್ತು ವ್ಯಾಪಾರ', 'industries-business', 'business', 17),
('Tourism & Culture', 'சுற்றுலா மற்றும் கலாச்சாரம்', 'ಪ್ರವಾಸೋದ್ಯಮ ಮತ್ತು ಸಂಸ್ಕೃತಿ', 'tourism-culture', 'tourism', 18),
('Emergency & Disaster Management', 'அவசரம் மற்றும் பேரிடர் மேலாண்மை', 'ತುರ್ತು ಮತ್ತು ವಿಪತ್ತು ನಿರ್ವಹಣೆ', 'emergency-disaster', 'emergency', 19),
('Citizen Services / e-Sevai', 'குடிமக்கள் சேவைகள் / இ-சேவை', 'ಪೌರ ಸೇವೆಗಳು / ಇ-ಸೇವೈ', 'citizen-esevai', 'esevai', 20)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ta = EXCLUDED.name_ta,
    name_kn = EXCLUDED.name_kn,
    icon = EXCLUDED.icon,
    display_order = EXCLUDED.display_order;

-- Helper pattern used below: category is resolved by slug.
-- ---------------------------------------------------------------------------
-- 1. REVENUE & LAND
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, office_name_tamil, designation, phone, address, pincode,
 services, source_url, verified_date, verification_status)
SELECT id, 'Thalavadi Taluk Office', 'தாளவாடி வட்டாட்சியர் அலுவலகம்',
       'Tahsildar, Thalavadi', '04295-245388',
       'Taluk Office, Kongahalli Road, Thalavadi, Erode District, Tamil Nadu',
       '638461',
       'Revenue administration; land and revenue related citizen services; certificates',
       'https://erode.nic.in/contact-directory/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='revenue-land'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, address, services, source_url, verified_date,
 verification_status)
SELECT id, 'Thalavadi VAO Offices', 'Village Administrative Officer',
       'Village-level offices under Thalavadi Taluk',
       'Village administration; revenue records; certificates and local revenue services',
       'https://erode.nic.in/contact-directory/',
       DATE '2026-08-13', 'official-directory-listed'
FROM government_categories WHERE slug='revenue-land'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. LOCAL ADMINISTRATION
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, designation, phone, mobile, address, pincode,
 services, source_url, verified_date, verification_status)
SELECT id, 'Thalavadi Block Development Office', 'BDO (Block Panchayat)',
       '04295-245233', '7402607150',
       'BDO Office, Thalavadi, Erode District, Tamil Nadu', '638461',
       'Rural development; Panchayat Union administration; development schemes',
       'https://erode.nic.in/contact-directory/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='local-administration'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, mobile, address, pincode,
 services, source_url, verified_date, verification_status)
SELECT id, 'Thalavadi Block Development Office', 'BDO (Village Panchayat)',
       '04295-245233', '7402607151',
       'BDO Office, Thalavadi, Erode District, Tamil Nadu', '638461',
       'Village Panchayat administration; rural local-body services',
       'https://erode.nic.in/contact-directory/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='local-administration'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. POLICE & LAW
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, phone, address, pincode, services,
 source_url, verified_date, verification_status)
SELECT id, 'Thalavadi Police Station', '04295-245228',
       'Thalavadi, Erode District, Tamil Nadu', '638461',
       'Police assistance; complaints; law and order; emergency response',
       'https://erode.nic.in/', DATE '2026-08-13', 'locally-listed'
FROM government_categories WHERE slug='police-law'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, services, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'National Emergency Number', 'Emergency services', '112',
       'Integrated emergency assistance',
       'https://www.112.gov.in/', DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='police-law'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. ELECTRICITY
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, phone, services, website_url, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'TNPDCL Power Failure Support', '9498794987',
       '24x7 power-failure complaints',
       'https://www.tnebltd.org/',
       'https://www.tnebltd.gov.in/bp/BPsearchEmployee',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='electricity'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, address, services,
 source_url, verified_date, verification_status, is_local_office)
SELECT id, 'Executive Engineer, TANGEDCO Sathyamangalam',
       'Executive Engineer', '04295-220232',
       'Sathyamangalam, Erode District, Tamil Nadu',
       'Electricity distribution administration and consumer services',
       'https://erode.nic.in/public-utility-category/electricity/',
       DATE '2026-08-13', 'verified-district-contact', FALSE
FROM government_categories WHERE slug='electricity'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. WATER & PUBLIC WORKS
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Water Supply & Public Works - Thalavadi',
       'Citizen information point for water supply, roads, irrigation and public works. Local officer contact should be verified by the administrator before publication.',
       'https://erode.nic.in/departments/',
       DATE '2026-08-13', 'category-service-record', TRUE
FROM government_categories WHERE slug='water-public-works'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. TRANSPORT
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Tamil Nadu State Transport Corporation - Citizen Services',
       'Government bus services, routes, fares and transport information for Thalavadi residents.',
       'https://erode.nic.in/about-district/',
       DATE '2026-08-13', 'official-district-reference', FALSE
FROM government_categories WHERE slug='transport'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'RTO / Motor Vehicle Services - Erode District',
       'Driving licence, vehicle registration, permits and motor-vehicle related services. Verify the current jurisdiction/contact before publishing a local office number.',
       'https://erode.nic.in/departments/',
       DATE '2026-08-13', 'category-service-record', FALSE
FROM government_categories WHERE slug='transport'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. HEALTH & MEDICAL
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Government Health Services - Thalavadi Taluk',
       'Primary healthcare, Health Sub Centres, maternal and child health, communicable disease services and emergency medical services.',
       'https://erode.nic.in/public-health-and-preventive-medicine/',
       DATE '2026-08-13', 'official-district-service', TRUE
FROM government_categories WHERE slug='health-medical'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, services, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Emergency Ambulance Service', 'Emergency medical transport', '108',
       'Emergency ambulance service',
       'https://www.tn.gov.in/',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='health-medical'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. EDUCATION
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, designation, mobile, phone, services,
 source_url, verified_date, verification_status)
SELECT id, 'School Education - Thalavadi Taluk Contact',
       'Taluk-level education contact', '9442844631', '9788858652',
       'School education administration and citizen/student enquiries',
       'https://erode.nic.in/departments/school-education/',
       DATE '2026-08-13', 'verified-district-directory'
FROM government_categories WHERE slug='education'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. AGRICULTURE & FARMERS
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, designation, officer_name, mobile, address,
 services, source_url, verified_date, verification_status)
SELECT id, 'Agriculture Extension Centre, Thalavadi',
       'Assistant Director of Agriculture (i/c)', 'T. Arunkumar', '9842030800',
       'Agriculture Extension Centre, Kongahalli Road, Thalavady',
       'Agriculture extension; farmer schemes; crop and input guidance',
       'https://erode.nic.in/contact-details-agriculture-departments/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='agriculture-farmers'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, officer_name, mobile, address,
 services, source_url, verified_date, verification_status)
SELECT id, 'Sub Agriculture Extension Centre, Germalam',
       'Deputy Agricultural Officer', 'J. Arunkumar', '9894552226',
       'Germalam, Thalavadi Taluk, Erode District',
       'Farmer assistance and agriculture extension services',
       'https://erode.nic.in/contact-details-agriculture-departments/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='agriculture-farmers'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, officer_name, mobile, address,
 services, source_url, verified_date, verification_status)
SELECT id, 'Agriculture Extension Centre, Thalavadi',
       'Assistant Seed Officer', 'P. Loganathan', '9500503852',
       'Agriculture Extension Centre, Kongahalli Road, Thalavady',
       'Seed-related agriculture services',
       'https://erode.nic.in/contact-details-agriculture-departments/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='agriculture-farmers'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, officer_name, mobile, address,
 services, source_url, verified_date, verification_status)
SELECT id, 'Doddagajanur Agriculture Contact',
       'Assistant Agricultural Officer', 'J. Saran', '6385711709',
       'Doddagajanur, Thalavadi Taluk, Erode District',
       'Agriculture extension and farmer support',
       'https://erode.nic.in/contact-details-agriculture-departments/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='agriculture-farmers'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, officer_name, mobile, address,
 services, source_url, verified_date, verification_status)
SELECT id, 'Erahanalli Agriculture Contact',
       'Assistant Agricultural Officer', 'L. Mathankumar', '9629689712',
       'Erahanalli, Thalavadi Taluk, Erode District',
       'Agriculture extension and farmer support',
       'https://erode.nic.in/contact-details-agriculture-departments/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='agriculture-farmers'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, officer_name, mobile, address,
 services, source_url, verified_date, verification_status)
SELECT id, 'Iggalore Agriculture Contact',
       'Assistant Agricultural Officer', 'P. Pavankumar', '9500312044',
       'Iggalore, Thalavadi Taluk, Erode District',
       'Agriculture extension and farmer support',
       'https://erode.nic.in/contact-details-agriculture-departments/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='agriculture-farmers'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. SOCIAL WELFARE
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, designation, services, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Social Security Scheme Office, Thalavadi',
       'Special Tahsildar (SSS)',
       'Social security pensions and assistance schemes',
       'https://erode.nic.in/right-to-information-act/',
       DATE '2026-08-13', 'official-directory-listed', TRUE
FROM government_categories WHERE slug='social-welfare'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, address, services,
 source_url, verified_date, verification_status, is_local_office)
SELECT id, 'District Social Welfare Office, Erode',
       'District Social Welfare Office', '0424-2261405',
       'District Collectorate, Erode - 638011',
       'Marriage assistance; girl child protection and other social welfare schemes',
       'https://erode.nic.in/service/marriage-scheme-application-status/',
       DATE '2026-08-13', 'verified-district-contact', FALSE
FROM government_categories WHERE slug='social-welfare'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 11. FOOD & CONSUMER SERVICES
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, designation, services, source_url,
 verified_date, verification_status)
SELECT id, 'Civil Supplies Office, Thalavadi',
       'Taluk Supply Officer, Thalavadi',
       'Public Distribution System; ration-card related services and civil supplies administration',
       'https://erode.nic.in/right-to-information-act/',
       DATE '2026-08-13', 'official-directory-listed'
FROM government_categories WHERE slug='food-consumer'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 12. EMPLOYMENT & LABOUR
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Employment & Labour Services - Erode District',
       'Employment registration, government employment services, labour welfare and worker-related services. Current Thalavadi contact should be verified before publishing.',
       'https://erode.nic.in/departments/',
       DATE '2026-08-13', 'category-service-record', FALSE
FROM government_categories WHERE slug='employment-labour'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 13. REGISTRATION & CERTIFICATES
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Revenue Certificate Services - Thalavadi',
       'Income, community, nativity and other revenue certificates through the Tamil Nadu e-District/e-Sevai ecosystem.',
       'https://erode.nic.in/e-governance/',
       DATE '2026-08-13', 'official-service', TRUE
FROM government_categories WHERE slug='registration-certificates'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Sub-Registrar / Registration Services',
       'Property registration, document registration and marriage registration services. Verify the current Thalavadi SRO contact/address before publication.',
       'https://erode.nic.in/departments/',
       DATE '2026-08-13', 'category-service-record', FALSE
FROM government_categories WHERE slug='registration-certificates'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 14. GOVERNMENT FINANCIAL SERVICES
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Government Treasury & Pension Services',
       'Government treasury, pension and related financial services. Local office/contact should be verified before publication.',
       'https://erode.nic.in/departments/',
       DATE '2026-08-13', 'category-service-record', FALSE
FROM government_categories WHERE slug='government-finance'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 15. FOREST & ENVIRONMENT
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, designation, officer_name, phone, address, pincode,
 services, source_url, verified_date, verification_status)
SELECT id, 'Sathyamangalam Tiger Reserve - Hassanur Forest Division',
       'Deputy Director', 'Yogesh Kumar Garg, I.F.S.', '04295-244226',
       'Office of the Deputy Director, Sathyamangalam Tiger Reserve, Hassanur Forest Division, Hassanur, Thalavadi Taluk, Erode District',
       '638401',
       'Forest administration; wildlife; human-wildlife conflict related administration',
       'https://erode.nic.in/whos-who/',
       DATE '2026-08-13', 'verified'
FROM government_categories WHERE slug='forest-environment'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 16. HOUSING & URBAN DEVELOPMENT
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Rural Housing & Development Services - Thalavadi',
       'Government housing schemes and rural development services. Verify the current implementing-office contact before publication.',
       'https://erode.nic.in/rural-development-and-panchayat-raj/',
       DATE '2026-08-13', 'official-service', TRUE
FROM government_categories WHERE slug='housing-urban'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 17. INDUSTRIES & BUSINESS
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'District Industries Centre - Erode',
       'MSME registration guidance, industrial development and entrepreneurship support. District-level office; verify current contact before publication.',
       'https://erode.nic.in/departments/',
       DATE '2026-08-13', 'category-service-record', FALSE
FROM government_categories WHERE slug='industries-business'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 18. TOURISM & CULTURE
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, source_url, verified_date,
 verification_status, is_local_office)
SELECT id, 'Tourism & Culture - Erode District',
       'Tourism information, heritage and cultural services relevant to Thalavadi and Erode district.',
       'https://erode.nic.in/departments/',
       DATE '2026-08-13', 'category-service-record', FALSE
FROM government_categories WHERE slug='tourism-culture'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 19. EMERGENCY & DISASTER MANAGEMENT
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, designation, phone, services, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Integrated Emergency Number', 'Emergency Services', '112',
       'Police, fire and medical emergency assistance',
       'https://www.112.gov.in/',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='emergency-disaster'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, services, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Fire & Rescue Services', 'Emergency', '101',
       'Fire and rescue emergency assistance',
       'https://www.tn.gov.in/',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='emergency-disaster'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, services, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Emergency Ambulance', 'Emergency Medical Service', '108',
       'Emergency ambulance service',
       'https://www.tn.gov.in/',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='emergency-disaster'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, services, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Women Helpline', 'Emergency Support', '181',
       'Women in distress and support services',
       'https://www.tn.gov.in/',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='emergency-disaster'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, designation, phone, services, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Child Helpline', 'Emergency Support', '1098',
       'Child protection and emergency assistance',
       'https://www.tn.gov.in/',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='emergency-disaster'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 20. CITIZEN SERVICES / e-SEVAI
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, website_url, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Tamil Nadu e-Sevai',
       'Government citizen services through e-Sevai/Common Service Centres, including certificates and online applications.',
       'https://tnesevai.tn.gov.in/',
       'https://erode.nic.in/e-governance/',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='citizen-esevai'
ON CONFLICT DO NOTHING;

INSERT INTO government_offices
(category_id, office_name, services, website_url, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'E-District Revenue Services',
       'Application status and verification for revenue certificates and other e-District services.',
       'https://eservices.tn.gov.in/eservicesnew/index.html',
       'https://erode.nic.in/e-governance/',
       DATE '2026-08-13', 'official-service', FALSE
FROM government_categories WHERE slug='citizen-esevai'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Useful public-service links as records
-- ---------------------------------------------------------------------------

INSERT INTO government_offices
(category_id, office_name, services, website_url, source_url,
 verified_date, verification_status, is_local_office)
SELECT id, 'Erode District Government Portal',
       'District administration, departments, contacts, public utilities and citizen information.',
       'https://erode.nic.in/',
       'https://erode.nic.in/',
       DATE '2026-08-13', 'official-source', FALSE
FROM government_categories WHERE slug='citizen-esevai'
ON CONFLICT DO NOTHING;

-- Emergency contacts, including ambulance services (sample)
INSERT INTO emergency_contacts (name, category, phone, address) VALUES
  ('Thalavadi Police Station', 'police', '914246202001', 'Police Station Road, Thalavadi'),
  ('Thalavadi Fire & Rescue Services', 'fire', '101', 'Bypass Road, Thalavadi'),
  ('108 Emergency Ambulance', 'ambulance', '108', 'State-wide free ambulance service'),
  ('Anna Nagar Health Centre - Ambulance', 'ambulance', '919876510002', 'Anna Nagar Main Road'),
  ('Kaveri Clinic - Ambulance', 'ambulance', '919876510001', 'Bazaar Street, Thalavadi'),
  ('Thalavadi Govt Hospital Emergency', 'hospital', '914246202002', 'Hospital Road, Thalavadi');

-- Classifieds (sample)
INSERT INTO classifieds (type, title, description, price, location, contact_name, contact_phone, details) VALUES
  ('job', 'Sales Staff Needed', 'Grocery store looking for full-time sales staff. Prior experience preferred.', '₹12,000/month', 'Main Bazaar, Thalavadi', 'Store Manager', '919876701001', '{"job_type":"Full-time","experience":"1+ years"}'),
  ('job', 'School Bus Driver', 'Heavy vehicle license required. Morning and afternoon shifts.', '₹15,000/month', 'Thalavadi', 'HR Office', '919876701002', '{"job_type":"Full-time","experience":"2+ years, HMV license"}'),
  ('rental', '2BHK House for Rent', 'Independent house, close to bus stand, water and power backup available.', '₹6,500/month', 'Anna Nagar, Thalavadi', 'Owner - Rajan', '919876702001', '{"bhk":2,"furnishing":"Semi-furnished"}'),
  ('rental', '1RK for Rent - Bachelors', 'Compact room near market, suitable for a single working person.', '₹2,500/month', 'Bazaar Street', 'Owner - Kamala', '919876702002', '{"bhk":"1RK","furnishing":"Unfurnished"}'),
  ('property', '3 Acres Farmland for Sale', 'Fertile land with borewell, road frontage, near Thalavadi bypass.', '₹18,00,000', 'Bypass Road, Thalavadi', 'Owner - Murugesan', '919876703001', '{"property_type":"Agricultural land","area":"3 acres"}'),
  ('property', 'Residential Plot for Sale', '1200 sqft plot, clear title, DTCP approved layout.', '₹9,50,000', 'New Colony, Thalavadi', 'Owner - Selvi', '919876703002', '{"property_type":"Residential plot","area":"1200 sqft"}'),
  ('auto_cab', 'Auto Available for Hire', 'Local trips and outstation drops. Available all day.', '₹15/km', 'Bus Stand, Thalavadi', 'Driver - Ganesan', '919876704001', '{"vehicle_type":"Auto Rickshaw","available":"All day"}'),
  ('auto_cab', 'Cab for Outstation Trips', 'Sedan available for Erode, Coimbatore and Sathyamangalam trips.', '₹13/km', 'Thalavadi', 'Driver - Bala', '919876704002', '{"vehicle_type":"Sedan","available":"6 AM - 10 PM"}');

-- City news alerts (sample)
INSERT INTO news_alerts (title, body, is_urgent) VALUES
  ('Water Supply Maintenance', 'Water supply will be interrupted on Sunday from 10 AM to 4 PM for pipeline maintenance near Anna Nagar.', false),
  ('Road Closure - Bypass Road', 'Bypass Road will be closed for repair work this week. Please use the Market Road diversion.', true),
  ('Free Health Camp This Weekend', 'Thalavadi Govt Hospital is organizing a free health checkup camp at the Panchayat grounds on Saturday.', false);

-- Communities (sample)
INSERT INTO communities (name, category, description, contact_name, contact_phone, meeting_info) VALUES
  ('Thalavadi Youth Welfare Club', 'Youth Club', 'Organizes sports events and community service activities for young people.', 'Karthik', '919876705001', 'Meets every Sunday, 5 PM at the Panchayat grounds'),
  ('Sri Lakshmi Women''s SHG', 'Women''s Self-Help Group', 'Savings and small business support group for women in Thalavadi.', 'Meena', '919876705002', 'Meets first Monday of every month'),
  ('Thalavadi Farmers Association', 'Agriculture', 'Supports local farmers with information on schemes, pricing and best practices.', 'Murugesan', '919876705003', 'Meets on demand, contact for details');

-- Posting permissions — every user-postable content type, all allowed by
-- default. Admins can toggle these off individually from Admin → Users &
-- Moderation → Posting Permissions.
INSERT INTO posting_permissions (type_key, label) VALUES
  ('farmer', 'Farmers & Agriculture'),
  ('return_pickup', 'Return Pickups'),
  ('carpool', 'Car Pooling'),
  ('auto_cab', 'Auto / Cab / Local Transport'),
  ('rental', 'Rentals'),
  ('property', 'Properties'),
  ('event', 'Events'),
  ('job', 'Jobs'),
  ('education', 'Schools & Colleges'),
  ('hospitals', 'Hospitals & Clinics'),
  ('banks', 'Banks & ATMs'),
  ('grocery', 'Grocery & Supermarkets'),
  ('food', 'Restaurants & Hotels'),
  ('auto', 'Auto & Garage'),
  ('homeservices', 'Home Services'),
  ('temples', 'Temples & Worship')
ON CONFLICT (type_key) DO NOTHING;
