import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DetailPage() {
  const { itemId } = useParams();
  const [itemDetail, setItemDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setItemDetail(null);
    
    const token = localStorage.getItem('adminToken');
    const publicUrl = `${API_URL}/api/reports/${itemId}`;

    // Jika admin sedang login, pakai endpoint admin; jika gagal, kembali ke endpoint publik
    (token
      ? fetch(`${API_URL}/api/admin/reports/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => (res.ok ? res : fetch(publicUrl)))
      : fetch(publicUrl)
    )
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Item dengan ID "${itemId}" tidak ditemukan.`);
          }
          throw new Error('Gagal mengambil detail item dari server');
        }
        return res.json();
      })
      .then(data => {
        setItemDetail(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal mengambil detail item:", err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [itemId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">Memuat detail item...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/cari" className="text-indigo-600 hover:underline">Kembali ke Daftar Barang</Link>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!itemDetail) {
     return (
       <div className="min-h-screen bg-gray-100">
         <Navbar />
         <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
           <h1 className="text-2xl font-bold text-red-600 mb-4">Item Tidak Ditemukan</h1>
           <p className="text-gray-600 mb-6">Data item tidak tersedia.</p>
           <Link to="/cari" className="text-indigo-600 hover:underline">Kembali ke Daftar Barang</Link>
         </main>
         <Footer />
       </div>
     );
  }

  const isLost = itemDetail.report_type === 'Hilang';
  const statusBgColor = isLost ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
            <Link to="/cari" className="text-sm text-indigo-600 hover:underline">
                &larr; Kembali ke Daftar Barang
            </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          
          {/* --- PERBAIKAN: HANYA TAMPILKAN GAMBAR JIKA image_url ADA --- */}
          {itemDetail.image_url && (
             <img 
              className="h-64 w-full object-cover lg:h-96" 
              src={`${API_URL}${itemDetail.image_url}`} 
              alt={itemDetail.title} 
            />
          )}
          {/* ------------------------------------------------------------- */}

          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-0">
                {itemDetail.title}
              </h1>
              <span
                className={`flex-shrink-0 inline-block px-4 py-1.5 text-sm font-semibold rounded-full ${statusBgColor} mt-2 sm:mt-0`}
              >
                Status: {itemDetail.report_type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-sm text-gray-600">
              <div>
                <strong className="block text-gray-800">Lokasi:</strong>
                <span>{itemDetail.location || '-'}</span>
              </div>
              <div>
                <strong className="block text-gray-800">Waktu Kejadian:</strong>
                <span>{itemDetail.event_date ? new Date(itemDetail.event_date).toLocaleString('id-ID') : '-'}</span>
              </div>
              <div>
                <strong className="block text-gray-800">Tanggal Laporan:</strong>
                <span>{itemDetail.created_at ? new Date(itemDetail.created_at).toLocaleDateString('id-ID') : '-'}</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Deskripsi</h2>
              <p className="text-gray-700 leading-relaxed">{itemDetail.description}</p>
            </div>

            {/* Informasi Pelapor */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Informasi Pelapor</h2>
              <div className="flex items-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                <span className="text-gray-700">{itemDetail.reporter_name}</span>
              </div>
               <div className="flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span className="text-gray-700">{itemDetail.reporter_contact}</span>
              </div>
            </div>

             {/* PERBAIKAN: GANTI TOMBOL AKSI MENJADI TEKS INSTRUKSI */}
             <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-lg font-semibold text-gray-800 mb-1">
                    {isLost ? 'Hubungi Jika Menemukan Barang:' : 'Hubungi Penemu Barang:'}
                </p>
                <p className="text-xl font-bold text-indigo-600">
                    {itemDetail.reporter_contact}
                </p>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}