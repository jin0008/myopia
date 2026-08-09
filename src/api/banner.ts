import { jsonFetchWithSession } from "../lib/fetch";
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

export function deleteBanner(id: string): Promise<void> {
  return jsonFetchWithSession(
    API_ROOT + "/banner/" + id,
    { method: "DELETE" },
    undefined,
    false,
  );
}
