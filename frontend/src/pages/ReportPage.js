import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SuccessMessage from '../components/SuccessMessage'; // <-- Import komponen sukses

export default function ReportPage() {
    const [reportType, setReportType] = useState('kehilangan');

    // State untuk form data
    const initialFormState = {
        itemName: '',
        description: '',
        location: '',
        dateTime: '',
        reporterName: '',
        contact: '',
    };
    const [formData, setFormData] = useState(initialFormState);

    // State untuk file upload
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // State untuk pesan sukses & loading/error submit
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // <-- State loading
    const [submitError, setSubmitError] = useState(null); // <-- State error submit

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        // Reset input file
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = null;
    };

    // Cleanup URL.createObjectURL
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

// Fungsi Submit yang mengirim FormData
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSubmitError(null);
        setShowSuccess(false);

        // --- Buat objek FormData ---
        const dataToSend = new FormData();
        
        // Tambahkan semua data teks ke FormData
        dataToSend.append('type', reportType);
        dataToSend.append('itemName', formData.itemName);
        dataToSend.append('description', formData.description);
        dataToSend.append('location', formData.location);
        dataToSend.append('dateTime', formData.dateTime);
        dataToSend.append('reporterName', formData.reporterName);
        dataToSend.append('contact', formData.contact);
        
        // Tambahkan file gambar JIKA ada
        if (imageFile) {
            // Nama field 'imageFile' HARUS SAMA dengan yang di backend (upload.single('imageFile'))
            dataToSend.append('imageFile', imageFile); 
        }
        // --- Akhir FormData ---

        console.log('Mengirim data FormData...');
        // (Anda tidak bisa console.log FormData secara langsung, tapi bisa lihat isinya di Network tab DevTools)

        try {
            // --- Kirim FormData ke Backend ---
            const response = await fetch(`${API_URL}/api/reports`, {
                method: 'POST',
                // PENTING: JANGAN set 'Content-Type' header saat mengirim FormData
                // Browser akan otomatis mengaturnya ke 'multipart/form-data' dengan boundary yang benar
                body: dataToSend, // Kirim objek FormData
            });
            // --- Akhir Pengiriman ---

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Gagal mengirim laporan: Status ${response.status}`);
            }

            const result = await response.json();
            console.log('Respons dari server:', result);

            setShowSuccess(true);
            setFormData({ /* ... reset form ... */ });
            removeImage();
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('Error saat submit:', error);
            setSubmitError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Buat Laporan Barang</h2>

                        {/* Tampilkan pesan sukses */}
                        {showSuccess && (
                            <SuccessMessage
                                message="Laporan Anda telah berhasil dikirim dan akan segera diverifikasi."
                                onClose={() => setShowSuccess(false)}
                            />
                        )}

                        {/* Tampilkan pesan error submit */}
                        {submitError && (
                            <div className="rounded-md bg-red-50 p-4 my-4 border border-red-300 shadow-sm">
                                <p className="text-sm font-medium text-red-800">Gagal mengirim laporan: {submitError}</p>
                            </div>
                        )}

                        {/* Pilihan Tipe Laporan */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setReportType('kehilangan')}
                                className={`py-3 px-4 rounded-md font-medium text-sm ${
                                reportType === 'kehilangan'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Saya Kehilangan
                            </button>
                            <button
                                onClick={() => setReportType('penemuan')}
                                className={`py-3 px-4 rounded-md font-medium text-sm ${
                                reportType === 'penemuan'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Saya Menemukan
                            </button>
                        </div>

                        {/* Formulir */}
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Input Nama Barang */}
                            <div>
                                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Nama Barang</label>
                                <input
                                    type="text" name="itemName" id="itemName"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="cth: iPhone 12 Pro Max"
                                    value={formData.itemName} onChange={handleInputChange} required
                                />
                            </div>

                            {/* Input Deskripsi */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</label>
                                <textarea
                                    id="description" name="description" rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Detail barang, ciri-ciri, dll."
                                    value={formData.description} onChange={handleInputChange} required
                                />
                            </div>

                            {/* Input Lokasi & Waktu */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                        Lokasi {reportType === 'kehilangan' ? 'Kehilangan' : 'Penemuan'}
                                    </label>
                                    <input
                                        type="text" name="location" id="location"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="cth: Perpustakaan Kampus"
                                        value={formData.location} onChange={handleInputChange} required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">Waktu Kejadian</label>
                                    <input
                                        type="datetime-local" name="dateTime" id="dateTime"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        value={formData.dateTime} onChange={handleInputChange} required
                                    />
                                </div>
                            </div>

                            {/* Area Upload Foto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Foto Barang</label>
                                {imagePreview ? (
                                    <div className="mt-2 relative">
                                        <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-64 object-contain rounded-md border border-gray-300" />
                                        <button
                                            type="button" onClick={removeImage}
                                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                                            aria-label="Hapus gambar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                                        <div className="space-y-1 text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4V12a4 4 0 014-4h12l4-4h8a4 4 0 014 4v4m-4-4v8m0 0H20" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500">
                                                    <span>Upload file</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                                </label>
                                                <p className="pl-1">atau tarik dan lepas</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF hingga 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Data Pelapor */}
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Informasi Pelapor</h3>
                                <p className="text-sm text-gray-500 mb-4">Data ini diperlukan agar Anda bisa dihubungi.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="reporterName" className="block text-sm font-medium text-gray-700">Nama Anda</label>
                                        <input
                                            type="text" name="reporterName" id="reporterName"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={formData.reporterName} onChange={handleInputChange} required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Email / No. WhatsApp</label>
                                        <input
                                            type="text" name="contact" id="contact"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={formData.contact} onChange={handleInputChange} required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Submit */}
                            <div className="text-right">
                                <button
                                    type="submit"
                                    disabled={isLoading} // <-- Disable saat loading
                                    className={`inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? 'Mengirim...' : 'Kirim Laporan'} {/* <-- Ganti teks tombol */}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}