CREATE DATABASE IF NOT EXISTS mediguard;
USE mediguard;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. MG-251047, CT-2045
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient', 'caretaker', 'doctor') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  dob DATE,
  gender ENUM('male', 'female', 'other'),
  blood_group VARCHAR(10),
  conditions TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE caretakers (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  qualification VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE doctors (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  specialization VARCHAR(100),
  hospital VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE patient_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  caretaker_id INT,
  doctor_id INT,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (caretaker_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE medicine_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medicine_name VARCHAR(100) NOT NULL,
  strength VARCHAR(50),
  dosage VARCHAR(50),
  tablets INT,
  instructions VARCHAR(255), -- e.g., 'After breakfast'
  scheduled_time TIME NOT NULL,
  start_date DATE,
  end_date DATE,
  frequency VARCHAR(50), -- e.g., 'daily'
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE medicine_logs (
  id VARCHAR(50) PRIMARY KEY, -- Using string/UUID for offline sync
  schedule_id INT NOT NULL,
  patient_id INT NOT NULL,
  scheduled_time DATETIME NOT NULL,
  actual_time DATETIME,
  status ENUM('taken', 'missed') NOT NULL,
  reason TEXT, -- voice transcript or typed
  voice_reason_url VARCHAR(255),
  sync_status ENUM('synced', 'pending') DEFAULT 'synced',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES medicine_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Similarly for food, activity, etc. (To keep it manageable, let's add them)

CREATE TABLE food_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  meal_type VARCHAR(50) NOT NULL, -- e.g., 'Breakfast'
  scheduled_time TIME NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE food_logs (
  id VARCHAR(50) PRIMARY KEY,
  schedule_id INT NOT NULL,
  patient_id INT NOT NULL,
  scheduled_time DATETIME NOT NULL,
  actual_time DATETIME,
  status ENUM('completed', 'skipped') NOT NULL,
  reason TEXT,
  FOREIGN KEY (schedule_id) REFERENCES food_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE activity_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL, -- e.g., 'Walking'
  target_duration_mins INT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE activity_logs (
  id VARCHAR(50) PRIMARY KEY,
  schedule_id INT NOT NULL,
  patient_id INT NOT NULL,
  date DATE NOT NULL,
  duration_mins INT NOT NULL,
  steps INT,
  status ENUM('completed', 'partial', 'missed'),
  FOREIGN KEY (schedule_id) REFERENCES activity_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  ocr_data JSON,
  verification_status ENUM('verified', 'unverified') DEFAULT 'unverified',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id VARCHAR(50) UNIQUE NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE emergency_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  location VARCHAR(255),
  status ENUM('active', 'resolved') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE voice_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  audio_url VARCHAR(255) NOT NULL,
  transcript TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
