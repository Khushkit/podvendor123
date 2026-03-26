'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getJob, updateJobStatus, shipJob, getFileUrl, downloadFile } from '@/lib/api';
import type { PODJob, PODJobStatus } from '@/types';
import {
  ArrowLeft, Download, Printer, Truck, Package, Clock, XCircle,
  CheckCircle, AlertTriangle, ExternalLink, Image, FileDown,
  Copy, Eye, ZoomIn, Loader2, Send, MapPin, Phone, Mail,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   JOB DETAIL PAGE — POD Vendor Portal
   Shows: design preview + download, product specs, variant info,
   status workflow, shipping/tracking entry, timeline.
   ═══════════════════════════════════════════════════════════════════════ */

const STATUS_META: Record<PODJobStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING:  { label: 'Pending',  color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Clock },
  PRINTING: { label: 'Printing', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: Printer },
  SHIPPED:  { label: 'Shipped',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: Truck },
  REJECTED: { label: 'Rejected', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: XCircle },
};

const WORKFLOW: PODJobStatus[] = ['PENDING', 'PRINTING', 'SHIPPED'];

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<PODJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Shipping form
  const [showShipForm, setShowShipForm] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [useShiprocket, setUseShiprocket] = useState(false);
  const [pkgWeight, setPkgWeight] = useState('');
  const [pkgLength, setPkgLength] = useState('');
  const [pkgBreadth, setPkgBreadth] = useState('');
  const [pkgHeight, setPkgHeight] = useState('');

  // Reject form
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getJob(jobId)
      .then(setJob)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleAdvanceStatus = async (nextStatus: PODJobStatus) => {
    if (!job) return;
    setUpdating(true);
    try {
      const updated = await updateJobStatus(job.id, nextStatus);
      setJob(updated);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleShip = async () => {
    if (!job) return;
    if (!useShiprocket && !trackingNumber.trim()) return;
    setUpdating(true);
    try {
      const result = await shipJob(job.id, {
        ...(carrier.trim() && { carrier }),
        ...(trackingNumber.trim() && { trackingNumber }),
        ...(trackingUrl.trim() && { trackingUrl }),
        useShiprocket,
        ...(pkgWeight && { weight: parseFloat(pkgWeight) }),
        ...(pkgLength && { length: parseFloat(pkgLength) }),
        ...(pkgBreadth && { breadth: parseFloat(pkgBreadth) }),
        ...(pkgHeight && { height: parseFloat(pkgHeight) }),
      });
      // Reload job to get updated status + shipment record
      const updated = await getJob(job.id);
      setJob(updated);
      setShowShipForm(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!job || !rejectReason.trim()) return;
    setUpdating(true);
    try {
      const updated = await updateJobStatus(job.id, 'REJECTED', rejectReason);
      setJob(updated);
      setShowRejectForm(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadDesign = async () => {
    if (!job?.artworkUrl) return;
    setDownloading(true);
    try {
      const url = getFileUrl(job.artworkUrl);
      const ext = job.artworkUrl.split('.').pop() || 'png';
      await downloadFile(url, `design-${job.id.slice(0, 8)}.${ext}`);
    } catch {
      alert('Download failed. Try right-clicking the image and "Save As".');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="py-20 text-center">
        <XCircle className="h-10 w-10 text-red-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{error || 'Job not found'}</p>
        <Link href="/job" className="text-sm text-blue-600 hover:underline mt-2 inline-block">← Back to jobs</Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[job.status];
  const StatusIcon = statusMeta.icon;
  const currentStepIndex = WORKFLOW.indexOf(job.status);
  const artworkUrl = getFileUrl(job.artworkUrl);
  const mockupUrl = job.mockupUrl ? getFileUrl(job.mockupUrl) : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/job" className="text-gray-400 hover:text-gray-600 transition"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">Job #{job.id.slice(0, 8)}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}>
                <StatusIcon className="h-3 w-3" /> {statusMeta.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Created {new Date(job.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <button onClick={() => copyToClipboard(job.id)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition">
          <Copy className="h-3 w-3" /> Copy ID
        </button>
      </div>

      {/* Status Workflow */}
      {job.status !== 'REJECTED' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 mb-3">Job Progress</p>
          <div className="flex items-center gap-2">
            {WORKFLOW.map((step, i) => {
              const meta = STATUS_META[step];
              const StepIcon = meta.icon;
              const isDone = currentStepIndex >= i;
              const isCurrent = currentStepIndex === i;
              return (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${isDone ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'} ${isCurrent ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`}>
                    {isDone && i < currentStepIndex ? <CheckCircle className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className={`text-xs font-medium ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{meta.label}</span>
                  {i < WORKFLOW.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${isDone && i < currentStepIndex ? 'bg-gray-900' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected banner */}
      {job.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Job Rejected</p>
            <p className="text-sm text-red-600 mt-1">{job.rejectReason || 'No reason provided'}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Design & Product Info */}
        <div className="space-y-5">
          {/* Design Preview */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Image className="h-4 w-4 text-gray-400" /> Design Artwork</h2>
              <div className="flex gap-2">
                <button onClick={() => setPreviewOpen(!previewOpen)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition">
                  <ZoomIn className="h-3.5 w-3.5" /> {previewOpen ? 'Close' : 'Full View'}
                </button>
                <button onClick={handleDownloadDesign} disabled={downloading} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1 transition">
                  {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Download
                </button>
              </div>
            </div>
            <div className={`bg-gray-50 flex items-center justify-center ${previewOpen ? 'p-4' : 'p-8'}`}>
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt="Design artwork"
                  className={`object-contain rounded-lg border border-gray-200 bg-white ${previewOpen ? 'max-h-[600px] w-full' : 'max-h-80'}`}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="text-center py-12">
                  <Image className="h-12 w-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No artwork uploaded</p>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Production file — print at original resolution</span>
              <a href={artworkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gray-600"><ExternalLink className="h-3 w-3" /> Open in new tab</a>
            </div>
          </div>

          {/* Mockup Preview (if available) */}
          {mockupUrl && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Eye className="h-4 w-4 text-gray-400" /> Mockup Preview</h2>
              </div>
              <div className="bg-gray-50 p-8 flex items-center justify-center">
                <img src={mockupUrl} alt="Mockup" className="max-h-60 object-contain rounded-lg" />
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Package className="h-4 w-4 text-gray-400" /> Product Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Product</p>
                <p className="font-medium text-gray-900 mt-0.5">{job.orderItem?.product?.title ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Quantity</p>
                <p className="font-medium text-gray-900 mt-0.5">{job.orderItem?.quantity ?? '—'} unit(s)</p>
              </div>
              {job.orderItem?.variant && (
                <>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Variant</p>
                    <p className="font-medium text-gray-900 mt-0.5">
                      {Object.entries(job.orderItem.variant.options).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">SKU</p>
                    <p className="font-medium font-mono text-gray-900 mt-0.5">{job.orderItem.variant.sku}</p>
                  </div>
                </>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Order ID</p>
                <p className="font-medium font-mono text-gray-900 mt-0.5">{job.orderItem?.orderId?.slice(0, 8) ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Unit Price</p>
                <p className="font-medium text-gray-900 mt-0.5">₹{job.orderItem?.price ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400" /> Shipping Address</h2>
            {job.orderItem?.order?.customer?.addresses?.[0] ? (
              <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                <p className="font-semibold text-gray-900">{job.orderItem.order.customer.addresses[0].name}</p>
                <p className="text-gray-600">{job.orderItem.order.customer.addresses[0].line1}</p>
                {job.orderItem.order.customer.addresses[0].line2 && <p className="text-gray-600">{job.orderItem.order.customer.addresses[0].line2}</p>}
                <p className="text-gray-600">{job.orderItem.order.customer.addresses[0].city}, {job.orderItem.order.customer.addresses[0].state} — {job.orderItem.order.customer.addresses[0].pincode}</p>
                <p className="text-gray-600">{job.orderItem.order.customer.addresses[0].country}</p>
                <div className="pt-2 mt-2 border-t border-gray-200 space-y-1">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="h-3 w-3" /> {job.orderItem.order.customer.addresses[0].phone}</p>
                  {job.orderItem.order.customer.user?.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5"><Mail className="h-3 w-3" /> {job.orderItem.order.customer.user.email}</p>
                  )}
                </div>
              </div>
            ) : job.orderItem?.order?.customer ? (
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-900">
                  {job.orderItem.order.customer.user?.firstName} {job.orderItem.order.customer.user?.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-1">{job.orderItem.order.customer.user?.email}</p>
                {job.orderItem.order.customer.phone && <p className="text-xs text-gray-500">{job.orderItem.order.customer.phone}</p>}
                <p className="text-xs text-amber-600 mt-2">⚠ No default address set. Contact customer for shipping details.</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <MapPin className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Address will be available once order data is loaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions & Shipping */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Actions</h2>

            {job.status === 'PENDING' && (
              <>
                <button onClick={() => handleAdvanceStatus('PRINTING')} disabled={updating} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  Start Printing
                </button>
                <button onClick={() => setShowRejectForm(true)} className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                  <XCircle className="h-4 w-4" /> Reject Job
                </button>
              </>
            )}

            {job.status === 'PRINTING' && (
              <>
                <button onClick={() => setShowShipForm(true)} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  <Send className="h-4 w-4" /> Mark as Shipped
                </button>
                <button onClick={() => setShowRejectForm(true)} className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                  <XCircle className="h-4 w-4" /> Reject Job
                </button>
              </>
            )}

            {job.status === 'SHIPPED' && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700">Job completed & shipped</p>
              </div>
            )}

            {job.status === 'REJECTED' && (
              <div className="text-center py-4">
                <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-red-600">Job was rejected</p>
              </div>
            )}
          </div>

          {/* Shipping Form */}
          {showShipForm && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Truck className="h-4 w-4 text-gray-400" /> Enter Shipping Details</h2>

              {/* Shiprocket toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useShiprocket}
                  onChange={e => setUseShiprocket(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-gray-900"
                />
                <span className="text-xs font-medium text-gray-700">Use Shiprocket (auto-create shipment)</span>
              </label>

              {!useShiprocket && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Carrier</label>
                    <select value={carrier} onChange={e => setCarrier(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                      <option value="">Select carrier</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="BlueDart">BlueDart</option>
                      <option value="DTDC">DTDC</option>
                      <option value="Ecom Express">Ecom Express</option>
                      <option value="India Post">India Post</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Tracking Number *</label>
                    <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g., DL12345678901" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Tracking URL <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </>
              )}

              {/* Package dimensions (optional, used by Shiprocket) */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Package Dimensions <span className="text-gray-400 font-normal">(optional)</span></p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Weight (kg)</label>
                    <input type="number" min="0" step="0.1" value={pkgWeight} onChange={e => setPkgWeight(e.target.value)} placeholder="0.5" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Length (cm)</label>
                    <input type="number" min="0" value={pkgLength} onChange={e => setPkgLength(e.target.value)} placeholder="20" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Breadth (cm)</label>
                    <input type="number" min="0" value={pkgBreadth} onChange={e => setPkgBreadth(e.target.value)} placeholder="15" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Height (cm)</label>
                    <input type="number" min="0" value={pkgHeight} onChange={e => setPkgHeight(e.target.value)} placeholder="5" className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleShip}
                  disabled={(!useShiprocket && !trackingNumber.trim()) || updating}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition"
                >
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Confirm Shipment
                </button>
                <button onClick={() => setShowShipForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="bg-white border border-red-100 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-red-800 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Reject Job</h2>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Reason *</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Why is this job being rejected?" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleReject} disabled={!rejectReason.trim() || updating} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition">
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Confirm Rejection
                </button>
                <button onClick={() => setShowRejectForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              </div>
            </div>
          )}

          {/* Tracking Info (if shipped) */}
          {job.shipment && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-2">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Truck className="h-4 w-4 text-gray-400" /> Shipping Info</h2>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Carrier</span><span className="font-medium">{job.shipment.carrier}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Tracking #</span>
                  <span className="font-mono font-medium flex items-center gap-1">
                    {job.shipment.tracking}
                    <button onClick={() => copyToClipboard(job.shipment!.tracking)} className="text-gray-400 hover:text-gray-600"><Copy className="h-3 w-3" /></button>
                  </span>
                </div>
                {job.shipment.shippedAt && (
                  <div className="flex justify-between"><span className="text-gray-400">Shipped on</span><span>{new Date(job.shipment.shippedAt).toLocaleDateString()}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Download Section */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><FileDown className="h-4 w-4 text-gray-400" /> Production Files</h2>
            <button onClick={handleDownloadDesign} disabled={downloading || !job.artworkUrl} className="w-full flex items-center gap-3 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 disabled:opacity-50 transition text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Design Artwork</p>
                <p className="text-xs text-gray-400">High-resolution print file</p>
              </div>
            </button>
            {mockupUrl && (
              <a href={mockupUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Mockup Preview</p>
                  <p className="text-xs text-gray-400">Customer-facing mockup image</p>
                </div>
              </a>
            )}
          </div>

          {/* Help */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-800 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Important</p>
            <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
              <li>Download the design file at full resolution for printing</li>
              <li>Print at the specified DPI for best quality</li>
              <li>Enter tracking info immediately after shipping</li>
              <li>Reject only if there&apos;s a genuine issue with the design/order</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
