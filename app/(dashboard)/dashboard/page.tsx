'use client';

import { useEffect, useState } from 'react';
import { getJobs } from '@/lib/api';
import { Package, Clock, Truck, XCircle } from 'lucide-react';
import type { PODJob } from '@/types';

const STATUS_META = {
  PENDING:  { label: 'Pending',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  PRINTING: { label: 'Printing', color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: Package },
  SHIPPED:  { label: 'Shipped',  color: 'bg-green-50 text-green-700 border-green-200',    icon: Truck },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
};

export default function DashboardPage() {
  const [jobs, setJobs]       = useState<PODJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobs({ limit: 100 })
      .then(r => setJobs(r.data))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    PENDING:  jobs.filter(j => j.status === 'PENDING').length,
    PRINTING: jobs.filter(j => j.status === 'PRINTING').length,
    SHIPPED:  jobs.filter(j => j.status === 'SHIPPED').length,
    REJECTED: jobs.filter(j => j.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your current job summary</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map(status => {
            const { label, color, icon: Icon } = STATUS_META[status];
            return (
              <div key={status} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <p className="mt-3 text-3xl font-semibold text-gray-900">{counts[status]}</p>
                <p className="text-xs text-gray-400 mt-0.5">jobs</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}