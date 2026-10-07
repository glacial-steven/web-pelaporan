const mysql = require('mysql2/promise');
require('dotenv').config(); // Memuat variabel dari .env

// Membuat connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Database cloud biasanya wajib SSL. Isi DB_SSL=true di environment variable.
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

// Tes koneksi
pool.getConnection()
    .then(connection => {
        console.log('✅ Berhasil terhubung ke database MySQL ');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Gagal terhubung ke database:', err.message);
    });

module.exports = pool;