import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.css';

// Import halaman-halaman
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import BrowsePage from './pages/BrowsePage';
import DetailPage from './pages/DetailPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage'; // <-- 1. Import LoginPage

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/lapor" element={<ReportPage />} />
      <Route path="/cari" element={<BrowsePage />} />
      <Route path="/detail/:itemId" element={<DetailPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/login" element={<LoginPage />} /> {/* <-- 2. Tambahkan rute ini */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;