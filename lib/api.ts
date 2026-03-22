import { getAccessToken } from './auth';
import type { AuthPayload, PaginatedResult, PODJob, PODCatalogItem } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? '';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? 'Request failed');
  }

  const json = await res.json();
  return (json.data ?? json) as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export function login(email: string, password: string) {
  return request<AuthPayload>('/pod/vendor-portal/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Profile ───────────────────────────────────────────────────────────────

export function getProfile() {
  return request<{ user: { id: string; email: string }; vendor: { id: string; name: string } }>(
    '/pod/vendor-portal/me',
  );
}

// ── Jobs ──────────────────────────────────────────────────────────────────

export function getJobs(params: { page?: number; limit?: number; status?: string } = {}) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
    ...(params.status && params.status !== 'all' ? { status: params.status } : {}),
  });
  return request<PaginatedResult<PODJob>>(`/pod/vendor-portal/jobs?${qs}`);
}

export function getJob(jobId: string) {
  return request<PODJob>(`/pod/jobs/${jobId}`);
}

export function updateJobStatus(jobId: string, status: string, rejectReason?: string) {
  return request<PODJob>(`/pod/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(rejectReason && { rejectReason }) }),
  });
}

export function updateJobTracking(jobId: string, carrier: string, tracking: string) {
  return request<PODJob>(`/pod/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'SHIPPED', carrier, tracking }),
  });
}

// ── Catalog ───────────────────────────────────────────────────────────────

export function getCatalog(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  return request<PaginatedResult<PODCatalogItem>>(`/pod/catalog?${qs}`);
}

// ── File URLs ─────────────────────────────────────────────────────────────

/** Get the full public URL for a stored file */
export function getFileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return STORAGE_URL ? `${STORAGE_URL}/${path}` : path;
}

/** Trigger download of a file */
export async function downloadFile(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
