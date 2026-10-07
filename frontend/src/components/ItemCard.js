import React from 'react';
import { Link } from 'react-router-dom';

export default function ItemCard({ id, title, status, location, imageUrl, date }) {
  const isLost = status === 'Hilang';
  
  const statusBgColor = isLost ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  
  return (
    <Link 
      to={`/detail/${id}`} 
      className="block bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
    >
      <img className="h-48 w-full object-cover" src={imageUrl} alt={title} />
      <div className="p-4">
        <span 
          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusBgColor} mb-2`}
        >
          {status}
        </span>
        
        <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{location}</p>
        <p className="text-xs text-gray-500 mt-2">{date}</p>
        
         <div className="mt-4 text-center text-indigo-600 font-medium text-sm">
          Lihat Detail &rarr;
        </div>
      </div>
    </Link>
  );
}