'use client';

import { useEffect, useState } from 'react';
import { getCatalog } from '@/lib/api';
import type { PODCatalogItem } from '@/types';

export default function CatalogPage() {
  const [items, setItems]     = useState<PODCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCatalog().then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Catalog</h1>
        <p className="text-sm text-gray-500 mt-0.5">Products you offer for print</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-400">
          No catalog items yet
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gray-50 flex items-center justify-center text-gray-300 text-xs">
                  No image
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">₹{item.baseCost.toFixed(2)} base cost</p>
                <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${
                  item.isActive
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}