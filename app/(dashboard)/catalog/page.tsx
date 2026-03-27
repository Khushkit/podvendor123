'use client';

import { useEffect, useState } from 'react';
import { getCatalog, getFileUrl } from '@/lib/api';
import type { PODCatalogItem } from '@/types';
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

const LIMIT = 20;

export default function CatalogPage() {
  const [items, setItems]           = useState<PODCatalogItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCatalog = (p: number) => {
    setLoading(true);
    setError(null);
    getCatalog({ page: p, limit: LIMIT })
      .then(r => {
        setItems(r.data);
        setTotalPages(r.totalPages ?? 1);
      })
      .catch(err => setError(err.message || 'Failed to load catalog'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCatalog(page); }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Catalog</h1>
        <p className="text-sm text-gray-500 mt-0.5">Products you offer for print</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => fetchCatalog(page)} className="flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-900 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !error && items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-400">
          No catalog items yet
        </div>
      ) : !error ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {item.imageUrl ? (
                <img src={getFileUrl(item.imageUrl || '')} alt={item.title} className="w-full h-36 object-cover" />
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

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | '...')[]>((acc, n, i, arr) => {
                if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`min-w-[32px] px-2.5 py-1.5 text-xs rounded-lg border transition ${
                      page === n
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
