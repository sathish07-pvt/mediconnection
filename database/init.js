const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    // Connect without database selected first to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('Connected to MySQL server.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    
    // Switch to database
    await connection.query('USE mediguard');
    
    console.log('Inserting Demo Accounts...');
    
    const patientHash = await bcrypt.hash('Patient@123', 10);
    const caretakerHash = await bcrypt.hash('Caretaker@123', 10);
    const doctorHash = await bcrypt.hash('Doctor@123', 10);

    // Insert demo users explicitly ensuring correct passwords
    await connection.query(`
      INSERT IGNORE INTO users (id, user_id, password_hash, role, name, email) VALUES
      (1, 'PT1001', ?, 'patient', 'Vicky', 'patient@mediguard.demo'),
      (2, 'CT1001', ?, 'caretaker', 'Priya', 'caretaker@mediguard.demo'),
      (3, 'DR1001', ?, 'doctor', 'Dr. Arun', 'doctor@mediguard.demo');
    `, [patientHash, caretakerHash, doctorHash]);

    await connection.query(`
      INSERT IGNORE INTO patients (id, user_id, conditions, emergency_contact_name, emergency_contact_phone) VALUES
      (1, 1, 'Diabetes', 'Raju', '9876543210');
    `);

    await connection.query(`
      INSERT IGNORE INTO caretakers (id, user_id, qualification) VALUES
      (1, 2, 'Registered Nurse');
    `);
    
    await connection.query(`
      INSERT IGNORE INTO doctors (id, user_id, specialization, hospital) VALUES
      (1, 3, 'Endocrinologist', 'City Care Hospital');
    `);

    await connection.query(`
      INSERT IGNORE INTO patient_relations (patient_id, caretaker_id, doctor_id) VALUES
      (1, 2, 3);
    `);

    console.log('Database initialized successfully with Demo Credentials!');
    console.log('Patient: PT1001 / Patient@123');
    console.log('Caretaker: CT1001 / Caretaker@123');
    console.log('Doctor: DR1001 / Doctor@123');

    await connection.end();
  } catch (err) {
    console.error('Failed to initialize database. Ensure MySQL is running and DB_PASSWORD in .env is correct.', err.message);
    process.exit(1);
  }
}

initializeDatabase();
