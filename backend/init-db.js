const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('Connected to MySQL server.');

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    
    console.log('Executing seed.sql...');
    await connection.query(seedSql);

    console.log('Database initialized successfully!');
    await connection.end();
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

run();
