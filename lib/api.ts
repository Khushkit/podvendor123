import { getAccessToken } from './auth';
import type { AuthPayload, PaginatedResult, PODJob, PODCatalogItem } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL;

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

  // Unwrap TransformInterceptor envelope: { success, data: T }
  return (json.data ?? json) as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export function login(email: string, password: string) {
  return request<AuthPayload>('/pod/vendor-portal/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Profile ─────────────────────────────────────────────────────────────────

export function getProfile() {
  return request<{ user: { id: string; email: string }; vendor: { id: string; name: string } }>(
    '/pod/vendor-portal/me',
  );
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export function getJobs(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams({
    page:  String(params.page  ?? 1),
    limit: String(params.limit ?? 20),
  });
  return request<PaginatedResult<PODJob>>(`/pod/vendor-portal/jobs?${qs}`);
}

export function updateJobStatus(jobId: string, status: string, rejectReason?: string) {
  return request<PODJob>(`/pod/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(rejectReason && { rejectReason }) }),
  });
}

// ── Catalog ─────────────────────────────────────────────────────────────────

export function getCatalog(params: { page?: number; limit?: number } = {}) {
  const qs = new URLSearchParams({
    page:  String(params.page  ?? 1),
    limit: String(params.limit ?? 20),
  });
  return request<PaginatedResult<PODCatalogItem>>(`/pod/catalog?${qs}`);
}