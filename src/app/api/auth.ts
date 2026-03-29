// ─────────────────────────────────────────────────────────
// api/auth.ts — Couche d'accès à l'API Laravel Auth
// ─────────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api";

const headers = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
});

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: { id: number; name: string } | null;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  status: "success" | "error";
  message: string;
  data?: {
    user: AuthUser;
    token: string;
    token_type: string;
  };
  errors?: Record<string, string[]>;
}

// ── Register ────────────────────────────────────────────
export async function apiRegister(payload: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Login ───────────────────────────────────────────────
export async function apiLogin(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Logout ──────────────────────────────────────────────
export async function apiLogout(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { ...headers(), Authorization: `Bearer ${token}` },
  });
}

// ── Me ──────────────────────────────────────────────────
export async function apiMe(token: string): Promise<AuthUser | null> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...headers(), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.user ?? null;
}
