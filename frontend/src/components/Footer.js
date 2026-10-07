import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">&copy; 2025 Lost&Found. All rights reserved.</p>
          <a
            href="#" // Nanti bisa diganti link 'mailto:'
            className="text-sm font-medium hover:text-white"
          >
            Beri Feedback
          </a>
        </div>
      </div>
    </footer>
  );
}