const express = require('express');
const fs = require('fs/promises'); // Import modul file system/promises
const fsSync = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const db = require('./db');
const app = express();
const port = process.env.PORT || 8000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware
// CORS_ORIGIN: alamat frontend (mis. https://nama.vercel.app). Kosong = izinkan semua.
const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim().replace(/\/+$/, ''))
    : '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// --- Middleware untuk menyajikan file statis ---
const uploadDir = path.join(__dirname, 'public/uploads');
fsSync.mkdirSync(uploadDir, { recursive: true }); // buat folder otomatis jika belum ada
app.use('/uploads', express.static(uploadDir));

// --- Konfigurasi Multer ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diizinkan!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});
// --- Akhir Konfigurasi Multer ---

// --- Middleware Verifikasi Token JWT ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Akses ditolak: Token tidak disediakan' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak: Format token tidak valid' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || 'rahasia-banget-jangan-disebar';
        const decoded = jwt.verify(token, jwtSecret);
        
        req.admin = decoded; 
        next();

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
             return res.status(401).json({ message: 'Sesi berakhir: Token kadaluarsa' });
        }
        console.error('Error verifikasi token:', err);
        return res.status(403).json({ message: 'Akses ditolak: Token tidak valid' });
    }
};
// --- AKHIR Middleware Verifikasi Token ---


// === API Endpoints ===

// --- RUTE PUBLIK ---
app.get('/api/reports', async (req, res) => {
    try {
        const [rows] = await db.query(
            // Menggunakan 'published' (huruf kecil)
            "SELECT * FROM reports WHERE verification_status = 'published' ORDER BY created_at DESC" 
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error mengambil reports:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            "SELECT * FROM reports WHERE id = ? AND verification_status = 'published'",
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }
        
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error mengambil report by id:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/reports', upload.single('imageFile'), async (req, res) => {
    const { type, itemName, description, location, dateTime, reporterName, contact } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; 

    if (!type || !itemName || !description || !dateTime || !reporterName || !contact) {
        return res.status(400).json({ message: 'Semua field teks wajib diisi' });
    }

    try {
        const formattedDateTime = dateTime.replace('T', ' '); 
        let dbReportType;
        if (type === 'kehilangan') dbReportType = 'Hilang'; 
        else if (type === 'penemuan') dbReportType = 'Ditemukan';
        else return res.status(400).json({ message: 'Nilai tipe laporan tidak valid' });

        const query = `
            INSERT INTO reports 
            (title, description, report_type, location, event_date, reporter_name, reporter_contact, verification_status, image_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            itemName, description, dbReportType, location, 
            formattedDateTime, reporterName, contact, 
            'Pending', 
            imageUrl
        ];

        const [result] = await db.query(query, values);

        res.status(201).json({ message: 'Laporan berhasil dibuat (dengan gambar jika ada)', insertedId: result.insertId, imageUrl: imageUrl });

    } catch (err) {
        console.error('Error saat menyimpan laporan (upload):', err);
        if (err instanceof multer.MulterError) {
             return res.status(400).json({ message: `Error Multer: ${err.message}` });
        } else if (err.message === 'Hanya file gambar yang diizinkan!') {
             return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Gagal menyimpan laporan ke database' });
    }
});


// === RUTE ADMIN ===
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { return res.status(400).json({ message: 'Username dan password wajib diisi' }); }

    try {
        const query = "SELECT * FROM admins WHERE username = ?";
        const [rows] = await db.query(query, [username]);

        if (rows.length === 0) { return res.status(401).json({ message: 'Username atau password salah' }); }
        const admin = rows[0];
        const isPasswordMatch = await bcrypt.compare(password, admin.password_hash);

        if (!isPasswordMatch) { return res.status(401).json({ message: 'Username atau password salah' }); }

        const jwtSecret = process.env.JWT_SECRET || 'rahasia-banget-jangan-disebar';
        const tokenPayload = { adminId: admin.id, username: admin.username };
        const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' }); 

        res.status(200).json({ message: 'Login berhasil', token: token });

    } catch (err) {
        console.error('Error saat login admin:', err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat login' });
    }
});

app.get('/api/admin/reports/pending', verifyToken, async (req, res) => { 
    try {
        const [rows] = await db.query(
            "SELECT id, report_type, title AS item, reporter_name AS reporter FROM reports WHERE verification_status = 'Pending' ORDER BY created_at ASC" 
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error mengambil laporan pending:', err);
        res.status(500).json({ message: 'Server error saat mengambil laporan pending' });
    }
});

// BARU: Mengambil semua laporan yang sudah diproses (published atau rejected)
app.get('/api/admin/reports/processed', verifyToken, async (req, res) => { 
    try {
        const [rows] = await db.query(
            "SELECT id, report_type, title AS item, verification_status, reporter_name AS reporter FROM reports WHERE verification_status != 'Pending' ORDER BY created_at DESC"
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error mengambil laporan processed:', err);
        res.status(500).json({ message: 'Server error saat mengambil laporan processed' });
    }
});

// Admin: lihat detail laporan dengan status apa pun
app.get('/api/admin/reports/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM reports WHERE id = ?", [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error mengambil detail laporan (admin):', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.patch('/api/admin/reports/:id/approve', verifyToken, async (req, res) => { 
    try {
        const { id } = req.params;
        const query = "UPDATE reports SET verification_status = 'published' WHERE id = ?";
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) { return res.status(404).json({ message: `Laporan dengan ID ${id} tidak ditemukan.` }); }
        res.status(200).json({ message: `Laporan ID ${id} berhasil disetujui.` });
    } catch (err) {
        console.error(`Error saat menyetujui laporan ID ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error saat menyetujui laporan' });
    }
});

app.patch('/api/admin/reports/:id/reject', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const query = "UPDATE reports SET verification_status = 'Rejected' WHERE id = ?";
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) { return res.status(404).json({ message: `Laporan dengan ID ${id} tidak ditemukan.` }); }
        res.status(200).json({ message: `Laporan ID ${id} berhasil ditolak.` });
    } catch (err) {
        console.error(`Error saat menolak laporan ID ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error saat menolak laporan' });
    }
});

/**
 * BARU: [PATCH] /api/admin/reports/:id/mark-found
 * Mengubah tipe laporan dari 'Hilang' menjadi 'Ditemukan'
 */
app.patch('/api/admin/reports/:id/mark-found', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [checkRows] = await db.query("SELECT report_type FROM reports WHERE id = ?", [id]);

        if (checkRows.length === 0) {
            return res.status(404).json({ message: `Laporan ID ${id} tidak ditemukan.` });
        }
        
        if (checkRows[0].report_type !== 'Hilang') {
            return res.status(400).json({ message: 'Laporan ini bukan berstatus "Hilang" dan tidak dapat diubah.' });
        }

        const query = "UPDATE reports SET report_type = 'Ditemukan' WHERE id = ?";
        await db.query(query, [id]);

        res.status(200).json({ message: `Laporan ID ${id} berhasil diubah statusnya menjadi Ditemukan.` });

    } catch (err) {
        console.error(`Error saat mengubah status laporan ID ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error saat mengubah status laporan' });
    }
});

/**
 * [DELETE] /api/admin/reports/:id
 */
app.delete('/api/admin/reports/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Cari URL Gambar sebelum menghapus record
        const [rows] = await db.query("SELECT image_url FROM reports WHERE id = ?", [id]);
        const report = rows[0];

        // 2. Hapus record dari database
        const [deleteResult] = await db.query("DELETE FROM reports WHERE id = ?", [id]);

        if (deleteResult.affectedRows === 0) { return res.status(404).json({ message: `Laporan dengan ID ${id} tidak ditemukan.` }); }
        
        // 3. Hapus file fisik dari server (jika ada)
        if (report && report.image_url) {
            const filePath = path.join(__dirname, report.image_url);
            try {
                await fs.unlink(filePath);
                console.log(`File gambar berhasil dihapus: ${report.image_url}`);
            } catch (fileErr) {
                if (fileErr.code !== 'ENOENT') { console.error('Gagal menghapus file fisik:', fileErr.message); }
            }
        }

        res.status(200).json({ message: `Laporan ID ${id} berhasil dihapus permanen.` });

    } catch (err) {
        console.error(`Error saat menghapus laporan ID ${id}:`, err);
        res.status(500).json({ message: 'Server error saat menghapus laporan permanen' });
    }
});


// --- Jalankan Server ---
app.listen(port, () => {
    console.log(`🚀 Server backend berjalan di http://localhost:${port}`);
});