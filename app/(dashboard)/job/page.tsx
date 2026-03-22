'use client';

import { useEffect, useState } from 'react';
import { getJobs, updateJobStatus } from '@/lib/api';
import type { PODJob, PODJobStatus } from '@/types';

const STATUS_BADGE: Record<PODJobStatus, string> = {
  PENDING:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  PRINTING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED:  'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const NEXT_STATUS: Partial<Record<PODJobStatus, PODJobStatus>> = {
  PENDING:  'PRINTING',
  PRINTING: 'SHIPPED',
};

export default function JobsPage() {
  const [jobs, setJobs]       = useState<PODJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    getJobs().then(r => setJobs(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleAdvance = async (job: PODJob) => {
    const next = NEXT_STATUS[job.status];
    if (!next) return;
    setUpdating(job.id);
    try {
      await updateJobStatus(job.id, next);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: next } : j));
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (job: PODJob) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    setUpdating(job.id);
    try {
      await updateJobStatus(job.id, 'REJECTED', reason);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'REJECTED', rejectReason: reason } : j));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Print jobs assigned to you</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No jobs yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Job ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Qty</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{job.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-900">{job.orderItem?.product?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{job.orderItem?.quantity ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[job.status]}`}>
                      {job.status}
                    </span>
                    {job.rejectReason && (
                      <p className="text-xs text-red-500 mt-0.5">{job.rejectReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {NEXT_STATUS[job.status] && (
                        <button
                          onClick={() => handleAdvance(job)}
                          disabled={updating === job.id}
                          className="text-xs px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
                        >
                          {updating === job.id ? '...' : `Mark ${NEXT_STATUS[job.status]}`}
                        </button>
                      )}
                      {(job.status === 'PENDING' || job.status === 'PRINTING') && (
                        <button
                          onClick={() => handleReject(job)}
                          disabled={updating === job.id}
                          className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}