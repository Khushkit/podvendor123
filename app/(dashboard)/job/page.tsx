'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getJobs } from '@/lib/api';
import type { PODJob, PODJobStatus } from '@/types';
import {
  Clock, Printer, Truck, XCircle, Package,
  ChevronRight, RefreshCw, Loader2, AlertCircle,
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

export default function JobsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || 'all';
  const [jobs, setJobs] = useState<PODJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(initialStatus);

  const fetchJobs = () => {
    setLoading(true);
    setError(null);
    getJobs({ limit: 100, status: filter !== 'all' ? filter : undefined })
      .then(r => setJobs(r.data || []))
      .catch((err) => setError(err.message || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, [filter]);

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

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={fetchJobs} className="flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-900 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Loading jobs...</p>
          </div>
        ) : !error && jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">No {filter !== 'all' ? filter.toLowerCase() : ''} jobs found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter !== 'all' ? 'Try a different filter' : 'When stores place POD orders, they will appear here'}
            </p>
          </div>
        ) : !error && (
          <div className="divide-y divide-gray-50">
            {jobs.map(job => {
              const meta = STATUS_META[job.status as PODJobStatus] || STATUS_META.PENDING;
              const StatusIcon = meta.icon;
              return (
                <Link
                  key={job.id}
                  href={`/job/${job.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${meta.bg}`}>
                    <StatusIcon className={`h-4 w-4 ${meta.color}`} />
                  </div>
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
                          <span>{Object.values(job.orderItem.variant.options || {}).join(' / ')}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    {job.rejectReason && <p className="text-xs text-red-500 mt-1">Reason: {job.rejectReason}</p>}
                  </div>
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
