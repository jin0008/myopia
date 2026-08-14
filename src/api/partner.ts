import { API_ROOT } from "./root";
import type { TreatmentItem } from "../constants/treatmentCategories";

// Partner portal auth is separate from the doctor/site-admin session
// (different token, its own localStorage key).
const TOKEN_KEY = "partner_token";

export function getPartnerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setPartnerToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearPartnerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class PartnerError extends Error {
  code: number;
  constructor(code: number, message?: string) {
    super(message);
    this.code = code;
  }
}

async function partnerFetch<T>(
  path: string,
  options: RequestInit = {},
  body?: unknown,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (auth) {
    const token = getPartnerToken();
    if (!token) throw new PartnerError(401, "not logged in");
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(API_ROOT + path, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new PartnerError(res.status, b?.message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export type PartnerStatus = "pending" | "approved" | "rejected";

export interface PartnerMe {
  id: string;
  email: string;
  contactName: string;
  hospitalName: string;
  status: PartnerStatus;
}

export interface PartnerProfile {
  id: string;
  kakao_place_id: string;
  name: string;
  description: string | null;
  banner_image_url: string | null;
  images: string[];
  phone: string | null;
  address: string | null;
  thumbnail_url: string | null;
  keywords: string[];
  treatment_items: TreatmentItem[] | null;
  booking_url: string | null;
  status: string;
  opening_hours?: unknown | null;
}

export interface PartnerProfileInput {
  kakao_place_id: string;
  name: string;
  description?: string;
  banner_image_url?: string | null;
  images?: string[];
  phone?: string;
  address?: string;
  thumbnail_url?: string | null;
  keywords?: string[];
  treatment_items?: TreatmentItem[];
  booking_url?: string | null;
  opening_hours?: unknown | null;
}

export function partnerSignup(data: {
  email: string;
  password: string;
  contact_name: string;
  hospital_name: string;
}): Promise<{ id: string; status: PartnerStatus }> {
  return partnerFetch("/partner/signup", { method: "POST" }, data, false);
}

export async function partnerLogin(email: string, password: string): Promise<PartnerStatus> {
  const r = await partnerFetch<{ token: string; status: PartnerStatus }>(
    "/partner/login",
    { method: "POST" },
    { email, password },
    false,
  );
  setPartnerToken(r.token);
  return r.status;
}

export function partnerMe(): Promise<PartnerMe> {
  return partnerFetch("/partner/me");
}

export function getPartnerProfile(): Promise<PartnerProfile | null> {
  return partnerFetch("/partner/profile");
}

export function savePartnerProfile(data: PartnerProfileInput): Promise<PartnerProfile> {
  return partnerFetch("/partner/profile", { method: "PUT" }, data);
}

export async function uploadPartnerImage(file: File): Promise<{ url: string }> {
  const token = getPartnerToken();
  if (!token) throw new PartnerError(401, "not logged in");
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(API_ROOT + "/partner/profile/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new PartnerError(res.status, b?.message);
  }
  return res.json();
}
