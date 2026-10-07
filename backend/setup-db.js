// Membuat tabel dan akun admin di database yang ada di .env
// Pemakaian: node setup-db.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // ganti dengan password Anda sendiri

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    await conn.query(`
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            report_type VARCHAR(20) NOT NULL,
            location VARCHAR(255),
            event_date DATETIME NOT NULL,
            reporter_name VARCHAR(255) NOT NULL,
            reporter_contact VARCHAR(255) NOT NULL,
            verification_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
            image_url VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    await conn.query(`
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL
        )`);

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await conn.query(
        `INSERT INTO admins (username, password_hash) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [ADMIN_USERNAME, hash]
    );

    const [rows] = await conn.query('SELECT id, username FROM admins');
    console.log('✅ Selesai. Isi tabel admins:', rows);
    await conn.end();
})().catch(err => {
    console.error('❌ Gagal:', err.message);
    process.exit(1);
});