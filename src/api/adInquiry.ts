import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type AdInquiryStatus = "new" | "contacted" | "closed" | "spam";
export type AdInquiryKind = "optical" | "eye" | "company";

export interface AdInquiry {
  id: string;
  kind: AdInquiryKind;
  org: string;
  contactName: string;
  phone: string;
  email: string;
  memo: string | null;
  status: AdInquiryStatus;
  note: string | null;
  createdAt: string;
}

export function listAdInquiries(status?: AdInquiryStatus): Promise<{ inquiries: AdInquiry[] }> {
  const qs = status ? "?status=" + encodeURIComponent(status) : "";
  return jsonFetchWithSession(API_ROOT + "/ad-inquiry" + qs);
}

export function updateAdInquiry(
  id: string,
  patch: { status?: AdInquiryStatus; note?: string | null },
): Promise<{ id: string; status: AdInquiryStatus; note: string | null }> {
  return jsonFetchWithSession(API_ROOT + "/ad-inquiry/" + id, { method: "PATCH" }, patch);
}
