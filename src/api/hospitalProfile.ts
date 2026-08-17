import { AuthorizationError, HttpError, jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import type { TreatmentItem } from "../constants/treatmentCategories";

export type HospitalProfileStatus = "draft" | "pending" | "published";

/** 병원 상세 '의사 정보'에 노출되는 의사 한 명. 이름만 필수. */
export interface Doctor {
  name: string;
  title?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
}

/** Blog-style body block: a paragraph or a picture, in order. */
export type DetailBlock =
  | { type: "text"; text: string }
  | { type: "image"; url: string };

export interface HospitalProfile {
  id: string;
  kakao_place_id: string;
  name: string;
  description: string | null;
  banner_image_url: string | null;
  images: string[];
  phone: string | null;
  address: string | null;
  status: HospitalProfileStatus;
  hospital_id: string | null;
  thumbnail_url: string | null;
  keywords: string[];
  treatment_items: TreatmentItem[] | null;
  verified: boolean;
  booking_url: string | null;
  created_at: string;
  updated_at: string;
  opening_hours?: unknown | null;
  tagline?: string | null;
  detail_blocks?: DetailBlock[] | null;
  doctors?: Doctor[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface HospitalProfileInput {
  kakao_place_id: string;
  name: string;
  description?: string;
  banner_image_url?: string | null;
  images?: string[];
  phone?: string;
  address?: string;
  status?: HospitalProfileStatus;
  hospital_id?: string | null;
  thumbnail_url?: string | null;
  keywords?: string[];
  treatment_items?: TreatmentItem[];
  verified?: boolean;
  booking_url?: string | null;
  opening_hours?: unknown | null;
  tagline?: string | null;
  detail_blocks?: DetailBlock[] | null;
  doctors?: Doctor[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface HospitalReview {
  id: string;
  kakao_place_id: string;
  user_id: string;
  hospital_id: string;
  rating: number;
  content: string;
  images: string[];
  status: "visible" | "hidden";
  created_at: string;
  updated_at: string;
}

export function listHospitalReviews(kakaoPlaceId: string): Promise<HospitalReview[]> {
  return jsonFetchWithSession(
    API_ROOT + "/hospital-profile/moderation/" + encodeURIComponent(kakaoPlaceId) + "/reviews",
  );
}

export function setReviewStatus(
  id: string,
  status: "visible" | "hidden",
): Promise<{ id: string; status: string }> {
  return jsonFetchWithSession(
    API_ROOT + "/hospital-profile/moderation/reviews/" + id,
    { method: "PATCH" },
    { status },
  );
}

export function listHospitalProfiles(): Promise<HospitalProfile[]> {
  return jsonFetchWithSession(API_ROOT + "/hospital-profile");
}

export function createHospitalProfile(
  data: HospitalProfileInput,
): Promise<HospitalProfile> {
  return jsonFetchWithSession(API_ROOT + "/hospital-profile", { method: "POST" }, data);
}

export function updateHospitalProfile(
  id: string,
  data: Partial<HospitalProfileInput>,
): Promise<HospitalProfile> {
  return jsonFetchWithSession(
    API_ROOT + "/hospital-profile/" + id,
    { method: "PATCH" },
    data,
  );
}

export function deleteHospitalProfile(id: string): Promise<void> {
  return jsonFetchWithSession(
    API_ROOT + "/hospital-profile/" + id,
    { method: "DELETE" },
    undefined,
    false,
  );
}

// multipart upload — not jsonFetchWithSession (that forces JSON).
export async function uploadHospitalImage(file: File): Promise<{ url: string }> {
  const session_key = localStorage.getItem("session_key");
  if (!session_key) throw new AuthorizationError("Authorization error");

  const body = new FormData();
  body.append("image", file);

  const result = await fetch(API_ROOT + "/hospital-profile/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${session_key}` },
    body,
  });
  if (result.status === 401 || result.status === 403) {
    throw new AuthorizationError("Authorization error");
  }
  if (!result.ok) {
    const respBody = await result.json().catch(() => ({}));
    throw new HttpError(result.status, respBody?.message);
  }
  return result.json();
}

/** Several images in one request — picking banner photos one at a time is the
 *  slowest part of setting a profile up. */
export async function uploadHospitalImages(files: File[]): Promise<{ urls: string[] }> {
  const session_key = localStorage.getItem("session_key");
  if (!session_key) throw new AuthorizationError("Authorization error");

  const body = new FormData();
  for (const f of files) body.append("images", f);

  const result = await fetch(API_ROOT + "/hospital-profile/upload-many", {
    method: "POST",
    headers: { Authorization: `Bearer ${session_key}` },
    body,
  });
  if (result.status === 401 || result.status === 403) {
    throw new AuthorizationError("Authorization error");
  }
  if (!result.ok) {
    const respBody = await result.json().catch(() => ({}));
    throw new HttpError(result.status, respBody?.message);
  }
  return result.json();
}

/* ---- 소식 (clinic notices) --------------------------------------------- */

export interface HospitalNotice {
  id: string;
  title: string;
  body: string;
  kind: "notice" | "event";
  pinned: boolean;
  published: boolean;
  createdAt: string;
}

export interface HospitalNoticeInput {
  title: string;
  body: string;
  kind?: "notice" | "event";
  pinned?: boolean;
  published?: boolean;
}

export function listHospitalNotices(profileId: string): Promise<HospitalNotice[]> {
  return jsonFetchWithSession(`${API_ROOT}/hospital-profile/${profileId}/notices`);
}

export function createHospitalNotice(
  profileId: string,
  data: HospitalNoticeInput,
): Promise<{ id: string }> {
  return jsonFetchWithSession(
    `${API_ROOT}/hospital-profile/${profileId}/notices`,
    { method: "POST" },
    data,
  );
}

export function updateHospitalNotice(
  noticeId: string,
  data: Partial<HospitalNoticeInput>,
): Promise<{ ok: boolean }> {
  return jsonFetchWithSession(
    `${API_ROOT}/hospital-profile/notices/${noticeId}`,
    { method: "PATCH" },
    data,
  );
}

export function deleteHospitalNotice(noticeId: string): Promise<void> {
  return jsonFetchWithSession(`${API_ROOT}/hospital-profile/notices/${noticeId}`, {
    method: "DELETE",
  });
}

/**
 * Blank URL inputs mean "not set", but the API validates them as URLs and
 * rejects `""` outright. Forms keep empty strings because that's what an empty
 * text input holds, so normalise on the way out rather than scattering
 * `|| null` across every field.
 */
export function normaliseProfileUrls<T extends object>(form: T): T {
  const URL_FIELDS = ["banner_image_url", "thumbnail_url", "booking_url"];
  const out = { ...form } as Record<string, unknown>;
  for (const k of URL_FIELDS) {
    if (typeof out[k] === "string" && (out[k] as string).trim() === "") out[k] = null;
  }
  return out as T;
}

/** Kakao place search for the admin profile form. */
export function searchAdminPlaces(q: string): Promise<{
  places: import("../components/PlacePicker").PlaceResult[];
}> {
  return jsonFetchWithSession(
    `${API_ROOT}/hospital-profile/place-search?q=${encodeURIComponent(q)}`,
  );
}
