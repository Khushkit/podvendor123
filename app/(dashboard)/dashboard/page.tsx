'use client';

import { useEffect, useState } from 'react';
import { getJobs } from '@/lib/api';
import Link from 'next/link';
import { Package, Clock, Truck, XCircle, TrendingUp, IndianRupee, ChevronRight, Printer } from 'lucide-react';
import type { PODJob, PODJobStatus } from '@/types';

const STATUS_META = {
  PENDING:  { label: 'Pending',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  PRINTING: { label: 'Printing', color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: Printer },
  SHIPPED:  { label: 'Shipped',  color: 'bg-green-50 text-green-700 border-green-200',    icon: Truck },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
};

const DUMMY_JOBS: PODJob[] = [
  { id: 'job-001', status: 'PENDING', artworkUrl: '', createdAt: '2026-03-22T08:00:00Z', orderItem: { id: 'oi-1', orderId: 'ord-101', quantity: 2, price: 699, product: { title: 'Custom Graphic T-Shirt (Black, L)', type: 'POD' }, variant: { options: { Color: 'Black', Size: 'L' }, sku: 'TSH-BLK-L' }, order: { id: 'ord-101', totalAmount: 1398, currency: 'INR', createdAt: '2026-03-22T08:00:00Z', customer: { id: 'c-1', phone: '+91 98765 43210', user: { firstName: 'Ananya', lastName: 'Gupta', email: 'ananya@email.com' }, addresses: [{ name: 'Ananya Gupta', phone: '+91 98765 43210', line1: '42, Rose Garden Apartments', line2: 'MG Road, Sector 12', city: 'Gurugram', state: 'Haryana', country: 'India', pincode: '122001' }] } } } },
  { id: 'job-002', status: 'PENDING', artworkUrl: '', createdAt: '2026-03-22T07:30:00Z', orderItem: { id: 'oi-2', orderId: 'ord-102', quantity: 1, price: 399, product: { title: 'Classic Coffee Mug (11oz)', type: 'POD' }, variant: { options: { Color: 'White' }, sku: 'MUG-WHT-11' } } },
  { id: 'job-003', status: 'PRINTING', artworkUrl: '', createdAt: '2026-03-21T14:00:00Z', orderItem: { id: 'oi-3', orderId: 'ord-098', quantity: 1, price: 1499, product: { title: 'Premium Hoodie (Navy, XL)', type: 'POD' }, variant: { options: { Color: 'Navy', Size: 'XL' }, sku: 'HOD-NAV-XL' } } },
  { id: 'job-004', status: 'PRINTING', artworkUrl: '', createdAt: '2026-03-21T10:00:00Z', orderItem: { id: 'oi-4', orderId: 'ord-097', quantity: 3, price: 499, product: { title: 'Canvas Poster (A3, Matte)', type: 'POD' }, variant: { options: { Finish: 'Matte' }, sku: 'POS-MAT-A3' } } },
  { id: 'job-005', status: 'SHIPPED', artworkUrl: '', createdAt: '2026-03-20T09:00:00Z', orderItem: { id: 'oi-5', orderId: 'ord-090', quantity: 5, price: 549, product: { title: 'Organic Tote Bag (Natural)', type: 'POD' }, variant: { options: { Color: 'Natural' }, sku: 'TOT-NAT' } }, shipment: { carrier: 'Shiprocket', tracking: 'SR789456123', shippedAt: '2026-03-21T16:00:00Z' } },
  { id: 'job-006', status: 'SHIPPED', artworkUrl: '', createdAt: '2026-03-19T11:00:00Z', orderItem: { id: 'oi-6', orderId: 'ord-085', quantity: 1, price: 599, product: { title: 'Phone Case (iPhone 15, Clear)', type: 'POD' }, variant: { options: { Color: 'Clear', Model: 'iPhone 15' }, sku: 'CSE-CLR-IP15' } }, shipment: { carrier: 'Delhivery', tracking: 'DL456789012', shippedAt: '2026-03-20T14:00:00Z' } },
  { id: 'job-007', status: 'SHIPPED', artworkUrl: '', createdAt: '2026-03-18T15:00:00Z', orderItem: { id: 'oi-7', orderId: 'ord-080', quantity: 2, price: 699, product: { title: 'Throw Pillow (18×18)', type: 'POD' }, variant: { options: { Size: '18×18' }, sku: 'PIL-18' } }, shipment: { carrier: 'BlueDart', tracking: 'BD112233445', shippedAt: '2026-03-19T10:00:00Z' } },
  { id: 'job-008', status: 'REJECTED', artworkUrl: '', rejectReason: 'Design resolution too low (72 DPI). Minimum 150 DPI required.', createdAt: '2026-03-17T09:00:00Z', orderItem: { id: 'oi-8', orderId: 'ord-075', quantity: 1, price: 899, product: { title: 'Oversized Drop Shoulder Tee (White, M)', type: 'POD' }, variant: { options: { Color: 'White', Size: 'M' }, sku: 'OVR-WHT-M' } } },
];

export default function DashboardPage() {
  const [jobs, setJobs] = useState<PODJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDummy, setUsingDummy] = useState(false);

  useEffect(() => {
    getJobs({ limit: 100 })
      .then(r => setJobs(r.data))
      .catch(() => { setJobs(DUMMY_JOBS); setUsingDummy(true); })
      .finally(() => setLoading(false));
  }, []);

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

      {usingDummy && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          ⚠ Showing demo data — API not connected. Set <code className="font-mono bg-amber-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> in environment variables.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map(status => {
              const { label, color, icon: Icon } = STATUS_META[status];
              return (
                <div key={status} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
                    <Icon className="h-3 w-3" />{label}
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">{counts[status]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">jobs</p>
                </div>
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
            <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
              {jobs.slice(0, 5).map(job => {
                const meta = STATUS_META[job.status];
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
                          <><span>·</span><span>{Object.values(job.orderItem.variant.options).join(' / ')}</span></>
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
          </div>
        </>
      )}
    </div>
  );
}
