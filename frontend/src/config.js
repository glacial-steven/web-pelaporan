// Alamat backend. Di lokal memakai localhost:8000,
// di Vercel isi lewat Environment Variable REACT_APP_API_URL.
const raw = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Hilangkan "/" di akhir supaya tidak jadi "//api/..."
export const API_URL = raw.replace(/\/+$/, '');
