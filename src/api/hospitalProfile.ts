import { AuthorizationError, HttpError, jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type HospitalProfileStatus = "draft" | "pending" | "published";

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
  created_at: string;
  updated_at: string;
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
