'use client';

import { useEffect, useState } from 'react';
import { getJobs } from '@/lib/api';
import Link from 'next/link';
import { Package, Clock, Truck, XCircle, TrendingUp, IndianRupee, ChevronRight, Printer, AlertCircle, RefreshCw } from 'lucide-react';
import type { PODJob } from '@/types';

const STATUS_META = {
  PENDING:  { label: 'Pending',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  PRINTING: { label: 'Printing', color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: Printer },
  SHIPPED:  { label: 'Shipped',  color: 'bg-green-50 text-green-700 border-green-200',    icon: Truck },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
};

export default function DashboardPage() {
  const [jobs, setJobs] = useState<PODJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    setError(null);
    getJobs({ limit: 100 })
      .then(r => setJobs(r.data || []))
      .catch((err) => setError(err.message || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const counts = {
    PENDING: jobs.filter(j => j.status === 'PENDING').length,
    PRINTING: jobs.filter(j => j.status === 'PRINTING').length,
    SHIPPED: jobs.filter(j => j.status === 'SHIPPED').length,
    REJECTED: jobs.filter(j => j.status === 'REJECTED').length,
  };

  const totalEarnings = jobs.filter(j => j.status === 'SHIPPED').reduce((s, j) => s + (j.orderItem?.price || 0) * (j.orderItem?.quantity || 1), 0);
  const totalItems = jobs.reduce((s, j) => s + (j.orderItem?.quantity || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your current job summary</p>
      </div>

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

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !error && (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map(status => {
              const { label, color, icon: Icon } = STATUS_META[status];
              return (
                <Link key={status} href={`/job?status=${status}`} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
                    <Icon className="h-3 w-3" />{label}
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">{counts[status]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">jobs</p>
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500"><Package className="h-4 w-4" /> Total Jobs</div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{jobs.length}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp className="h-4 w-4" /> Items Printed</div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{totalItems}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500"><IndianRupee className="h-4 w-4" /> Earnings (Shipped)</div>
              <p className="mt-2 text-2xl font-semibold text-gray-900">₹{totalEarnings.toLocaleString()}</p>
            </div>
          </div>

          {/* Recent Jobs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Recent Jobs</h2>
              <Link href="/job" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            {jobs.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900">No jobs yet</p>
                <p className="text-xs text-gray-500 mt-1">When stores place POD orders, they will appear here.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                {jobs.slice(0, 5).map(job => {
                  const meta = STATUS_META[job.status as keyof typeof STATUS_META] || STATUS_META.PENDING;
                  const StatusIcon = meta.icon;
                  return (
                    <Link key={job.id} href={`/job/${job.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${meta.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{job.orderItem?.product?.title || 'Unknown'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="font-mono">#{job.id.slice(0, 8)}</span>
                          <span>·</span>
                          <span>Qty: {job.orderItem?.quantity}</span>
                          {job.orderItem?.variant && (
                            <><span>·</span><span>{Object.values(job.orderItem.variant.options || {}).join(' / ')}</span></>
                          )}
                        </div>
                        {job.rejectReason && <p className="text-xs text-red-500 mt-0.5 truncate">Reason: {job.rejectReason}</p>}
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-sm font-medium">₹{((job.orderItem?.price || 0) * (job.orderItem?.quantity || 1)).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
