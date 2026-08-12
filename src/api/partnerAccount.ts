import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type PartnerAccountStatus = "pending" | "approved" | "rejected";

export interface PartnerAccount {
  id: string;
  email: string;
  contactName: string;
  hospitalName: string;
  status: PartnerAccountStatus;
  createdAt: string;
  claimedPlaceId: string | null;
  claimedName: string | null;
}

export function listPartnerAccounts(): Promise<PartnerAccount[]> {
  return jsonFetchWithSession(API_ROOT + "/partner/accounts");
}

export function setPartnerAccountStatus(
  id: string,
  status: PartnerAccountStatus,
): Promise<{ id: string; status: PartnerAccountStatus }> {
  return jsonFetchWithSession(
    API_ROOT + "/partner/accounts/" + id,
    { method: "PATCH" },
    { status },
  );
}
