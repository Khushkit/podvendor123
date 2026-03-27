import { getAccessToken, getRefreshToken, saveAccessToken, clearSession } from './auth';
import type { AuthPayload, PaginatedResult, PODJob, PODCatalogItem } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? '';

// Shared refresh promise — all concurrent 401s await the same refresh attempt
let refreshPromise: Promise<string> | null = null;

function doRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token'));
  }
  refreshPromise = fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(r => {
      if (!r.ok) throw new Error('Refresh failed');
      return r.json();
    })
    .then(json => {
      const newToken = ((json.data ?? json).accessToken) as string;
      saveAccessToken(newToken);
      return newToken;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

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

  // On 401, attempt to refresh the access token then retry
  if (res.status === 401) {
    try {
      const newToken = await doRefresh();

      // Retry original request with new token
      const retryRes = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message ?? 'Request failed');
      }
      const retryJson = await retryRes.json();
      return (retryJson.data ?? retryJson) as T;
    } catch {
      // Refresh failed — clear session and redirect
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
  }

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
  // Uses vendor-portal route — resolves by vendorId from JWT, not tenantId
  return request<PODJob>(`/pod/vendor-portal/jobs/${jobId}`);
}

export function updateJobStatus(jobId: string, status: string, rejectReason?: string) {
  return request<PODJob>(`/pod/vendor-portal/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(rejectReason && { rejectReason }) }),
  });
}

export function shipJob(
  jobId: string,
  data: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    useShiprocket?: boolean;
    weight?: number;
    length?: number;
    breadth?: number;
    height?: number;
  },
) {
  return request<{ shipment: Record<string, unknown>; shiprocket?: Record<string, unknown> }>(
    `/pod/vendor-portal/jobs/${jobId}/ship`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
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
  // Fallback to R2 public URL pattern
  const storageBase = STORAGE_URL || 'https://pub-ramio.r2.dev';
  return `${storageBase}/${path}`;
}

/** Trigger download of a file (with auth for protected endpoints) */
export async function downloadFile(url: string, filename: string) {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Download failed');

  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
