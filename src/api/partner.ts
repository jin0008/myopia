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
  /** 400일 때 서버가 실어 보내는 필드별 사유. */
  fields?: { path: string; message: string }[];
  constructor(code: number, message?: string, fields?: { path: string; message: string }[]) {
    super(message);
    this.code = code;
    this.fields = fields;
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
    throw new PartnerError(res.status, b?.message, b?.fields);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export type PartnerStatus = "pending" | "approved" | "rejected";

export interface PartnerMe {
  id: string;
  email: string;
  contactName: string;
  hospitalName: string;
  /** 병원인지 안경점인지. 가입할 때 정해진다. 화면을 가르는 데 쓴다. */
  businessKind: PartnerBusinessKind;
  status: PartnerStatus;
  /** 운영자가 묶어 준 가게. 없으면 프리미엄을 신청할 수 없다. */
  facility: LinkedFacility | null;
}

/** 계정에 묶인 가게. 운영자가 정한다. */
export interface LinkedFacility {
  kind: "eye" | "optical";
  key: string;
  name: string;
  address: string;
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
  treatment_categories: string[];
  treatment_items: TreatmentItem[] | null;
  booking_url: string | null;
  status: string;
  opening_hours?: unknown | null;
  tagline?: string | null;
  detail_blocks?: import("./hospitalProfile").DetailBlock[] | null;
  doctors?: import("./hospitalProfile").Doctor[] | null;
  latitude?: number | null;
  longitude?: number | null;
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
  treatment_categories?: string[];
  treatment_items?: TreatmentItem[];
  booking_url?: string | null;
  opening_hours?: unknown | null;
  tagline?: string | null;
  detail_blocks?: import("./hospitalProfile").DetailBlock[] | null;
  doctors?: import("./hospitalProfile").Doctor[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

export type PartnerBusinessKind = "hospital" | "optical";

export function partnerSignup(data: {
  email: string;
  password: string;
  contact_name: string;
  hospital_name: string;
  business_kind: PartnerBusinessKind;
}): Promise<{ id: string; status: PartnerStatus }> {
  return partnerFetch("/partner/signup", { method: "POST" }, data, false);
}

export async function partnerLogin(
  email: string,
  password: string,
): Promise<{ status: PartnerStatus; businessKind: PartnerBusinessKind }> {
  const r = await partnerFetch<{
    token: string;
    status: PartnerStatus;
    businessKind: PartnerBusinessKind;
  }>("/partner/login", { method: "POST" }, { email, password }, false);
  setPartnerToken(r.token);
  // 예전 서버는 업종을 내지 않는다. 배포 사이에 걸친 사용자가 화면도 없이
  // 떨어지지 않도록 병원으로 본다 - 지금까지 전부 병원이었다.
  return { status: r.status, businessKind: r.businessKind ?? "hospital" };
}

/* ---- 비밀번호 재설정 ---------------------------------------------- *
 * 로그인 전에 쓰는 것이라 토큰을 붙이지 않는다(auth=false).
 * -------------------------------------------------------------------- */

export function partnerSendResetCode(email: string): Promise<{ ok: true }> {
  return partnerFetch("/partner/password/send-code", { method: "POST" }, { email }, false);
}

export function partnerVerifyResetCode(
  email: string,
  code: string,
): Promise<{ verificationTicket: string }> {
  return partnerFetch(
    "/partner/password/verify-code",
    { method: "POST" },
    { email, code },
    false,
  );
}

export function partnerResetPassword(
  email: string,
  verificationTicket: string,
  password: string,
): Promise<{ ok: true }> {
  return partnerFetch(
    "/partner/password/reset",
    { method: "POST" },
    { email, verificationTicket, password },
    false,
  );
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

export async function uploadPartnerImages(files: File[]): Promise<{ urls: string[] }> {
  const token = getPartnerToken();
  if (!token) throw new PartnerError(401, "not logged in");
  const fd = new FormData();
  for (const f of files) fd.append("images", f);
  const res = await fetch(API_ROOT + "/partner/profile/upload-many", {
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

/* ---- 소식 (clinic notices) --------------------------------------------- */

export interface PartnerNotice {
  id: string;
  title: string;
  body: string;
  kind: "notice" | "event";
  pinned: boolean;
  published: boolean;
  createdAt: string;
}

export interface PartnerNoticeInput {
  title: string;
  body: string;
  kind?: "notice" | "event";
  pinned?: boolean;
  published?: boolean;
}

export function listPartnerNotices(): Promise<{ notices: PartnerNotice[] }> {
  return partnerFetch("/partner/notices");
}

export function createPartnerNotice(data: PartnerNoticeInput): Promise<{ id: string }> {
  return partnerFetch("/partner/notices", { method: "POST" }, data);
}

export function updatePartnerNotice(
  id: string,
  data: Partial<PartnerNoticeInput>,
): Promise<{ ok: boolean }> {
  return partnerFetch(`/partner/notices/${id}`, { method: "PATCH" }, data);
}

export function deletePartnerNotice(id: string): Promise<void> {
  return partnerFetch(`/partner/notices/${id}`, { method: "DELETE" });
}

/** Kakao place search, so a clinic picks itself instead of typing an id. */
export function searchPartnerPlaces(q: string): Promise<{
  places: import("../components/PlacePicker").PlaceResult[];
}> {
  return partnerFetch(`/partner/place-search?q=${encodeURIComponent(q)}`);
}

/* ---- 프리미엄 신청 ------------------------------------------------------ */

export type PromotionRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface PromotionRequest {
  id: string;
  kind: "eye" | "optical";
  key: string;
  facilityName: string;
  startsOn: string;
  months: number;
  status: PromotionRequestStatus;
  note: string | null;
  /** 거절 사유. 운영자가 적는다. */
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

/** 내 광고 하나와 그 성적. days 는 일자별 줄이다. */
export interface MyPromotion {
  id: string;
  kind: "eye" | "optical";
  key: string;
  name: string | null;
  address: string | null;
  tier: string;
  startsAt: string;
  endsAt: string;
  live: boolean;
  impressions: number;
  clicks: number;
  days: { day: string; impressions: number; clicks: number }[];
}

/** 가게는 보내지 않는다. 운영자가 계정에 묶어 둔 것을 서버가 쓴다. */
export function createPromotionRequest(body: {
  startsOn: string;
  months: number;
  note?: string;
}): Promise<PromotionRequest> {
  return partnerFetch("/partner/promotion-requests", { method: "POST" }, body);
}

export function listMyPromotionRequests(): Promise<PromotionRequest[]> {
  return partnerFetch("/partner/promotion-requests/mine");
}

export function cancelPromotionRequest(id: string): Promise<void> {
  return partnerFetch(`/partner/promotion-requests/${id}`, { method: "DELETE" });
}

export function listMyPromotions(days = 30): Promise<MyPromotion[]> {
  return partnerFetch(`/partner/promotions/mine?days=${days}`);
}

/* ---- 업체 인증 ---------------------------------------------------------
 *
 * 가게는 파트너가 명부에서 직접 고른다. 25자 인허가번호를 운영자가
 * 뒤지는 것보다 본인이 고르는 쪽이 정확하고, 서류로 검증하므로 남의
 * 가게를 골라도 반려된다.
 */

export interface DirectoryFacility {
  kind: "eye" | "optical";
  key: string;
  name: string;
  address: string;
}

/** 받아 주는 브랜드. 자유 입력이 아니다 - 상표라 표기가 흔들리면 같은
 *  브랜드가 여러 개로 갈린다. */
export const OPTICAL_BRANDS = [
  { key: "miyosmart", label: "MiYOSMART" },
  { key: "stellest", label: "Stellest" },
] as const;
export type OpticalBrand = (typeof OPTICAL_BRANDS)[number]["key"];

export type VerificationStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface VerificationRequest {
  id: string;
  kind: "eye" | "optical";
  key: string;
  facilityName: string;
  docCount: number;
  /** 신청자가 적어 낸 임상 플랫폼 병원코드. 아이로그를 쓰는 병원만 적는다. */
  eyelogCode: string | null;
  /** 신청자가 고른 취급 브랜드. */
  brands: string[];
  status: VerificationStatus;
  note: string | null;
  /** 반려 사유. 파트너에게 그대로 보인다. */
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface VerificationState {
  businessKind: PartnerBusinessKind;
  /** 업체가 묶였는지. 묶여야 프리미엄을 신청할 수 있다. */
  verified: boolean;
  request: VerificationRequest | null;
}

/** 내 업종의 명부만 돌려준다. */
export function searchMyFacilities(q: string): Promise<DirectoryFacility[]> {
  return partnerFetch(`/partner/my-facilities?q=${encodeURIComponent(q)}`);
}

export function getVerification(): Promise<VerificationState> {
  return partnerFetch("/partner/verification");
}

/** 서류와 함께 신청한다. JSON 이 아니라 multipart 라 partnerFetch 를 쓰지
 *  않는다 - Content-Type 을 직접 정하면 경계 문자열이 빠져 서버가 못 읽는다. */
export async function submitVerification(
  key: string,
  docs: File[],
  note?: string,
  eyelogCode?: string,
  brands?: string[],
): Promise<VerificationRequest> {
  const token = getPartnerToken();
  if (!token) throw new PartnerError(401, "not logged in");
  const fd = new FormData();
  fd.append("key", key);
  if (note) fd.append("note", note);
  if (eyelogCode) fd.append("eyelogCode", eyelogCode);
  // FormData 에는 배열이 없다. 같은 이름으로 여러 번 붙이면 서버가 배열로 받는다.
  for (const b of brands ?? []) fd.append("brands", b);
  for (const f of docs) fd.append("docs", f);
  const res = await fetch(API_ROOT + "/partner/verification", {
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

/* ---- 결제 -------------------------------------------------------------
 *
 * 금액은 서버가 정한다. 화면은 몇 달치인지만 말한다 - 금액을 보내면
 * 개발자 도구로 100원이라 적어 보내는 것을 막을 수 없다.
 */

export interface Checkout {
  clientId: string;
  orderId: string;
  amount: number;
  goodsName: string;
  returnUrl: string;
}

export function startCheckout(months: number): Promise<Checkout> {
  return partnerFetch("/payment/checkout", { method: "POST" }, { months });
}

export interface MySubscription {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  amount: number;
  canceledAt: string | null;
}
export interface MyPayment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  payMethod: string | null;
  paidAt: string | null;
  failedReason: string | null;
  createdAt: string;
}
export interface PaymentState {
  /** 결제 설정이 서버에 되어 있나. 아니면 버튼을 눌러도 아무 일이 없다. */
  available: boolean;
  subscription: MySubscription | null;
  payments: MyPayment[];
}

export function getPaymentState(): Promise<PaymentState> {
  return partnerFetch("/payment/me");
}
