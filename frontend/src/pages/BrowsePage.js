import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ItemCard from '../components/ItemCard';

export default function BrowsePage() {
  const [allItems, setAllItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(`${API_URL}/api/reports`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Gagal mengambil data dari server');
        }
        return res.json();
      })
      .then(data => {
        setAllItems(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal mengambil data:", err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // Logika Filter
  const filteredItems = useMemo(() => {
    if (!allItems || allItems.length === 0) {
        return [];
    }
    
    // 1. Filter Status
    let itemsToFilter = allItems.filter(item => {
        if (statusFilter === 'Semua Status') {
            return true;
        }
        return item.report_type === statusFilter;
    });

    // 2. Filter Pencarian
    if (searchTerm) {
        itemsToFilter = itemsToFilter.filter(item => {
            return item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }
    
    return itemsToFilter;

  }, [allItems, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Cari Barang Hilang atau Ditemukan
        </h1>

        {/* Kontrol Pencarian dan Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8 flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-grow">
            <input
              type="text"
              name="search" id="search"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Cari berdasarkan nama barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Filter Status */}
          <div className="flex-shrink-0">
            <select
              id="status-filter" name="status-filter"
              className="block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Semua Status</option>
              <option>Hilang</option>
              <option>Ditemukan</option>
            </select>
          </div>
           {/* Placeholder untuk menjaga alignment (Tombol Cari Dihapus) */}
           <div className="flex-shrink-0 w-16 h-10 sm:h-auto"> 
           </div>
        </div>

        {/* Tampilkan Loading atau Error */}
        {isLoading && <p className="text-center text-gray-500 py-8">Memuat data...</p>}
        {error && <p className="text-center text-red-600 py-8">Error: {error}</p>}

        {/* Grid Daftar Barang */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  status={item.report_type}
                  location={item.location}
                  date={new Date(item.event_date).toLocaleString('id-ID')} 
                  imageUrl={item.image_url ? `${API_URL}${item.image_url}` : 'https://via.placeholder.com/300x200?text=No+Image'}
                />
              ))}
            </div>

            {/* Tampilkan pesan jika tidak ada hasil */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-700">Tidak ada barang yang ditemukan</h3>
                <p className="text-sm text-gray-500">Coba ubah kata kunci pencarian atau filter Anda.</p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}