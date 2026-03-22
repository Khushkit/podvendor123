import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY  = 'vp_access_token';
const REFRESH_TOKEN_KEY = 'vp_refresh_token';
const VENDOR_KEY        = 'vp_vendor';

export function saveSession(payload: {
  accessToken: string;
  refreshToken: string;
  vendor: { id: string; name: string };
}) {
  Cookies.set(ACCESS_TOKEN_KEY,  payload.accessToken,  { expires: 1 });   // 1 day
  Cookies.set(REFRESH_TOKEN_KEY, payload.refreshToken, { expires: 7 });   // 7 days
  Cookies.set(VENDOR_KEY, JSON.stringify(payload.vendor), { expires: 7 });
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getVendor() {
  const raw = Cookies.get(VENDOR_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearSession() {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove(VENDOR_KEY);
}

export function isLoggedIn(): boolean {
  return !!Cookies.get(ACCESS_TOKEN_KEY);
}