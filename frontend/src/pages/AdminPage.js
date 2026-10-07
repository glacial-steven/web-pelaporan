import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminPage() {
    const [pendingReports, setPendingReports] = useState([]);
    const [processedReports, setProcessedReports] = useState([]);
    const [view, setView] = useState('pending'); // 'pending' atau 'processed'
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/login');
    };

    const getToken = () => localStorage.getItem('adminToken');
    
    // --- Utils ---
    const checkAuthAndFetch = async (url, options = {}) => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return null;
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('adminToken');
            alert('Sesi admin berakhir. Silakan login kembali.');
            navigate('/login');
            return null;
        }
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Request gagal: Status ${response.status}`);
        }
        return response;
    };
    // --- Akhir Utils ---

    // --- Fungsi Fetch Data ---
    const fetchPendingReports = async () => {
        try {
            const response = await checkAuthAndFetch(`${API_URL}/api/admin/reports/pending`);
            if (response) {
                const data = await response.json();
                setPendingReports(data);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchProcessedReports = async () => {
        try {
            const response = await checkAuthAndFetch(`${API_URL}/api/admin/reports/processed`);
            if (response) {
                const data = await response.json();
                setProcessedReports(data);
            }
        } catch (err) {
            setError(err.message);
        }
    };
    // --- Akhir Fungsi Fetch Data ---
    
    // --- Fungsi Aksi ---
    const handleAction = async (id, endpoint, successMessage, errorPrefix) => {
        try {
            const response = await checkAuthAndFetch(`${API_URL}/api/admin/reports/${id}/${endpoint}`, {
                method: 'PATCH',
            });
            
            if (response) {
                alert(successMessage);
                // Refresh kedua daftar (atau panggil yang spesifik)
                fetchPendingReports(); 
                fetchProcessedReports(); 
            }
        } catch (err) {
            alert(`${errorPrefix}: ${err.message}`);
        }
    };

    const handleApprove = (id) => handleAction(id, 'approve', `Laporan ID ${id} disetujui.`, 'Gagal menyetujui');
    const handleReject = (id) => handleAction(id, 'reject', `Laporan ID ${id} ditolak.`, 'Gagal menolak');
    const handleMarkFound = (id) => {
        if (window.confirm("Apakah Anda yakin menandai barang ini sudah DITEMUKAN? Status laporan akan diubah.")) {
            handleAction(id, 'mark-found', `Laporan ID ${id} berhasil diubah menjadi Ditemukan.`, 'Gagal menandai ditemukan');
        }
    };
    
    const handleDeletePermanent = async (id) => {
        if (!window.confirm("Yakin hapus permanen? Aksi ini tidak dapat dibatalkan, dan file gambar akan dihapus dari server!")) {
            return;
        }
        try {
             const response = await checkAuthAndFetch(`${API_URL}/api/admin/reports/${id}`, {
                method: 'DELETE',
            });
            if (response) {
                alert(`Laporan ID ${id} berhasil dihapus permanen.`);
                fetchProcessedReports(); // Refresh daftar yang sedang aktif
            }
        } catch (err) {
            alert(`Gagal menghapus permanen: ${err.message}`);
        }
    };
    // --- Akhir Fungsi Aksi ---


    // --- UseEffect untuk Mengambil Data Awal ---
    useEffect(() => {
        if (!getToken()) {
            navigate('/login');
            return;
        }
        
        // Panggil fetch awal untuk mendapatkan hitungan
        Promise.all([fetchPendingReports(), fetchProcessedReports()])
            .finally(() => setIsLoading(false));
        
    }, []); 

    useEffect(() => {
        if (!getToken()) return;
        // Hanya atur loading saat view berubah, bukan saat load awal
        setIsLoading(true); 
        if (view === 'pending') {
            fetchPendingReports().finally(() => setIsLoading(false));
        } else {
            fetchProcessedReports().finally(() => setIsLoading(false));
        }
    }, [view]); // Jalankan ulang saat 'view' berubah


    // --- JSX Render ---
    const reportsToDisplay = view === 'pending' ? pendingReports : processedReports;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navbar Admin */}
            <nav className="bg-white shadow">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <span className="flex items-center font-bold text-xl text-indigo-600">Admin Panel</span>
                        <div className="flex items-center space-x-4">
                            <Link to="/" className="text-sm text-gray-600 hover:text-indigo-600">Situs Utama</Link>
                            <button onClick={handleLogout} className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

                {/* Tombol Toggle View */}
                <div className="flex mb-6 space-x-4">
                    <button 
                        onClick={() => setView('pending')}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                    >
                        Antrian Verifikasi ({pendingReports.length})
                    </button>
                     <button 
                        onClick={() => setView('processed')}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'processed' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
                    >
                        Laporan Selesai ({processedReports.length})
                    </button>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {view === 'pending' ? 'Antrian Verifikasi' : 'Laporan Selesai'}
                </h2>

                {isLoading && <p className="text-center text-gray-500 py-8">Memuat laporan...</p>}
                {error && <p className="text-center text-red-600 py-8">Error: {error}</p>}

                {!isLoading && !error && (
                    <div className="bg-white shadow overflow-hidden rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                                        {view === 'processed' && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelapor</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportsToDisplay.length === 0 && (
                                        <tr>
                                            <td colSpan={view === 'pending' ? "5" : "6"} className="px-6 py-12 text-center text-gray-500">
                                                {view === 'pending' ? 'Tidak ada laporan yang menunggu verifikasi.' : 'Tidak ada laporan yang telah diproses.'}
                                            </td>
                                        </tr>
                                    )}
                                    
                                    {reportsToDisplay.map((report) => (
                                        <tr key={report.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.report_type}</td> 
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.item}</td> 
                                            
                                            {view === 'processed' && 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.verification_status}</td>
                                            }

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.reporter}</td> 
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <Link
                                                    to={`/detail/${report.id}`}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Lihat
                                                </Link>
                                                
                                                {view === 'pending' ? (
                                                    // Tombol untuk View Pending
                                                    <>
                                                        <button onClick={() => handleApprove(report.id)} className="text-green-600 hover:text-green-900">Setujui</button>
                                                        <button onClick={() => handleReject(report.id)} className="text-red-600 hover:text-red-900">Tolak</button>
                                                    </>
                                                ) : (
                                                    // Tombol untuk View Processed
                                                    <>
                                                        {report.report_type === 'Hilang' && report.verification_status === 'published' && (
                                                            <button
                                                                onClick={() => handleMarkFound(report.id)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Tandai Ditemukan
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeletePermanent(report.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Hapus Permanen
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}