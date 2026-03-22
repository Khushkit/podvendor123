'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getJobs, updateJobStatus } from '@/lib/api';
import type { PODJob, PODJobStatus } from '@/types';
import {
  Clock, Printer, Truck, XCircle, Eye, Package,
  ChevronRight, RefreshCw, Loader2,
} from 'lucide-react';

const STATUS_META: Record<PODJobStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING:  { label: 'Pending',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Clock },
  PRINTING: { label: 'Printing', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: Printer },
  SHIPPED:  { label: 'Shipped',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: Truck },
  REJECTED: { label: 'Rejected', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: XCircle },
};

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Jobs' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PRINTING', label: 'Printing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'REJECTED', label: 'Rejected' },
];

const DUMMY_JOBS: PODJob[] = [
  { id: 'job-001', status: 'PENDING', artworkUrl: '', createdAt: '2026-03-22T08:00:00Z', orderItem: { id: 'oi-1', orderId: 'ord-101', quantity: 2, price: 699, product: { title: 'Custom Graphic T-Shirt (Black, L)', type: 'POD' }, variant: { options: { Color: 'Black', Size: 'L' }, sku: 'TSH-BLK-L' } } },
  { id: 'job-002', status: 'PENDING', artworkUrl: '', createdAt: '2026-03-22T07:30:00Z', orderItem: { id: 'oi-2', orderId: 'ord-102', quantity: 1, price: 399, product: { title: 'Classic Coffee Mug (11oz)', type: 'POD' }, variant: { options: { Color: 'White' }, sku: 'MUG-WHT-11' } } },
  { id: 'job-003', status: 'PRINTING', artworkUrl: '', createdAt: '2026-03-21T14:00:00Z', orderItem: { id: 'oi-3', orderId: 'ord-098', quantity: 1, price: 1499, product: { title: 'Premium Hoodie (Navy, XL)', type: 'POD' }, variant: { options: { Color: 'Navy', Size: 'XL' }, sku: 'HOD-NAV-XL' } } },
  { id: 'job-004', status: 'PRINTING', artworkUrl: '', createdAt: '2026-03-21T10:00:00Z', orderItem: { id: 'oi-4', orderId: 'ord-097', quantity: 3, price: 499, product: { title: 'Canvas Poster (A3, Matte)', type: 'POD' }, variant: { options: { Finish: 'Matte' }, sku: 'POS-MAT-A3' } } },
  { id: 'job-005', status: 'SHIPPED', artworkUrl: '', createdAt: '2026-03-20T09:00:00Z', orderItem: { id: 'oi-5', orderId: 'ord-090', quantity: 5, price: 549, product: { title: 'Organic Tote Bag (Natural)', type: 'POD' }, variant: { options: { Color: 'Natural' }, sku: 'TOT-NAT' } }, shipment: { carrier: 'Shiprocket', tracking: 'SR789456123', shippedAt: '2026-03-21T16:00:00Z' } },
  { id: 'job-006', status: 'SHIPPED', artworkUrl: '', createdAt: '2026-03-19T11:00:00Z', orderItem: { id: 'oi-6', orderId: 'ord-085', quantity: 1, price: 599, product: { title: 'Phone Case (iPhone 15, Clear)', type: 'POD' }, variant: { options: { Color: 'Clear', Model: 'iPhone 15' }, sku: 'CSE-CLR-IP15' } }, shipment: { carrier: 'Delhivery', tracking: 'DL456789012', shippedAt: '2026-03-20T14:00:00Z' } },
  { id: 'job-007', status: 'REJECTED', artworkUrl: '', rejectReason: 'Design resolution too low (72 DPI). Minimum 150 DPI required.', createdAt: '2026-03-17T09:00:00Z', orderItem: { id: 'oi-7', orderId: 'ord-075', quantity: 1, price: 899, product: { title: 'Oversized Drop Shoulder Tee (White, M)', type: 'POD' }, variant: { options: { Color: 'White', Size: 'M' }, sku: 'OVR-WHT-M' } } },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<PODJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchJobs = () => {
    setLoading(true);
    getJobs({ limit: 100, status: filter !== 'all' ? filter : undefined })
      .then(r => setJobs(r.data))
      .catch(() => setJobs(DUMMY_JOBS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, [filter]);

  const counts = {
    all: jobs.length,
    PENDING: jobs.filter(j => j.status === 'PENDING').length,
    PRINTING: jobs.filter(j => j.status === 'PRINTING').length,
    SHIPPED: jobs.filter(j => j.status === 'SHIPPED').length,
    REJECTED: jobs.filter(j => j.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Print Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all assigned print jobs</p>
        </div>
        <button onClick={fetchJobs} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition ${
              filter === f.value
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No jobs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.map(job => {
              const meta = STATUS_META[job.status];
              const StatusIcon = meta.icon;
              return (
                <Link
                  key={job.id}
                  href={`/job/${job.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group"
                >
                  {/* Status Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${meta.bg}`}>
                    <StatusIcon className={`h-4 w-4 ${meta.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{job.orderItem?.product?.title ?? 'Unknown Product'}</p>
                      <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span className="font-mono">#{job.id.slice(0, 8)}</span>
                      <span>·</span>
                      <span>Qty: {job.orderItem?.quantity ?? '—'}</span>
                      {job.orderItem?.variant && (
                        <>
                          <span>·</span>
                          <span>{Object.values(job.orderItem.variant.options).join(' / ')}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    {job.rejectReason && <p className="text-xs text-red-500 mt-1">Reason: {job.rejectReason}</p>}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
