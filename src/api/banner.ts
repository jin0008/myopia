import { AuthorizationError, HttpError, jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export interface AdBanner {
  id: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  image_url: string;
  link_url: string;
  placement: string;
  sort_order: number;
  active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BannerInput {
  title: string;
  subtitle?: string;
  badge_text?: string;
  image_url: string;
  link_url: string;
  placement?: string;
  sort_order?: number;
  active?: boolean;
  start_at?: string | null;
  end_at?: string | null;
}

export function listBanners(): Promise<AdBanner[]> {
  return jsonFetchWithSession(API_ROOT + "/banner");
}

export function getBanner(id: string): Promise<AdBanner> {
  return jsonFetchWithSession(API_ROOT + "/banner/" + id);
}

export function createBanner(data: BannerInput): Promise<AdBanner> {
  return jsonFetchWithSession(API_ROOT + "/banner", { method: "POST" }, data);
}

export function updateBanner(
  id: string,
  data: Partial<BannerInput>,
): Promise<AdBanner> {
  return jsonFetchWithSession(API_ROOT + "/banner/" + id, { method: "PATCH" }, data);
}

// Not jsonFetchWithSession — that always JSON.stringifies the body and sets
// Content-Type: application/json, which breaks a multipart file upload.
export async function uploadBannerImage(file: File): Promise<{ url: string }> {
  const session_key = localStorage.getItem("session_key");
  if (!session_key) throw new AuthorizationError("Authorization error");

  const body = new FormData();
  body.append("image", file);

  const result = await fetch(API_ROOT + "/banner/upload", {
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

export function deleteBanner(id: string): Promise<void> {
  return jsonFetchWithSession(
    API_ROOT + "/banner/" + id,
    { method: "DELETE" },
    undefined,
    false,
  );
}
