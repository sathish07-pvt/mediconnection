USE mediguard;

-- Passwords are 'password123' (hash will be needed, I'll insert a dummy hash for now)
-- Normally backend handles hashing. For seed, let's use a known bcrypt hash for 'password123'
-- $2a$10$1W.ZqY7N9M4JbO.x0C0l4O/9h/6J5g5H/R7F7D/18Z.1u5.6.8.8. (dummy hash)

INSERT INTO users (id, user_id, password_hash, role, name, email) VALUES
(1, 'MG-251047', '$2a$10$1W.ZqY7N9M4JbO.x0C0l4O/9h/6J5g5H/R7F7D/18Z.1u5.6.8.8.', 'patient', 'Vicky', 'vicky@mediguard.com'),
(2, 'CT-2045', '$2a$10$1W.ZqY7N9M4JbO.x0C0l4O/9h/6J5g5H/R7F7D/18Z.1u5.6.8.8.', 'caretaker', 'Priya', 'priya@mediguard.com'),
(3, 'DR-1024', '$2a$10$1W.ZqY7N9M4JbO.x0C0l4O/9h/6J5g5H/R7F7D/18Z.1u5.6.8.8.', 'doctor', 'Dr. Arun', 'arun@mediguard.com');

INSERT INTO patients (id, user_id, conditions, emergency_contact_name, emergency_contact_phone) VALUES
(1, 1, 'Diabetes', 'Raju', '9876543210');

INSERT INTO caretakers (id, user_id, qualification) VALUES
(1, 2, 'Registered Nurse');

INSERT INTO doctors (id, user_id, specialization, hospital) VALUES
(1, 3, 'Endocrinologist', 'City Care Hospital');

INSERT INTO patient_relations (patient_id, caretaker_id, doctor_id) VALUES
(1, 2, 3);

INSERT INTO medicine_schedules (id, patient_id, medicine_name, strength, dosage, tablets, instructions, scheduled_time, start_date, end_date, frequency, created_by) VALUES
(1, 1, 'Metformin', '500 mg', '1 Tablet', 1, 'After Breakfast', '09:00:00', CURDATE() - INTERVAL 2 DAY, CURDATE() + INTERVAL 1 DAY, 'daily', 2);

INSERT INTO medicine_logs (id, schedule_id, patient_id, scheduled_time, actual_time, status, reason) VALUES
('log_day1', 1, 1, CONCAT(CURDATE() - INTERVAL 2 DAY, ' 09:00:00'), CONCAT(CURDATE() - INTERVAL 2 DAY, ' 09:02:00'), 'taken', NULL),
('log_day2', 1, 1, CONCAT(CURDATE() - INTERVAL 1 DAY, ' 09:00:00'), NULL, 'missed', 'I was sleeping.'),
('log_day3', 1, 1, CONCAT(CURDATE(), ' 09:00:00'), CONCAT(CURDATE(), ' 09:05:00'), 'taken', NULL);

INSERT INTO activity_schedules (id, patient_id, activity_type, target_duration_mins) VALUES
(1, 1, 'Walking', 30);

INSERT INTO activity_logs (id, schedule_id, patient_id, date, duration_mins, steps, status) VALUES
('act_day1', 1, 1, CURDATE() - INTERVAL 2 DAY, 32, 3240, 'completed'),
('act_day2', 1, 1, CURDATE() - INTERVAL 1 DAY, 27, 2800, 'partial'),
('act_day3', 1, 1, CURDATE(), 35, 3600, 'completed');

INSERT INTO food_schedules (id, patient_id, meal_type, scheduled_time) VALUES
(1, 1, 'Breakfast', '08:30:00'),
(2, 1, 'Lunch', '13:00:00'),
(3, 1, 'Dinner', '20:30:00');
