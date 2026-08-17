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

/** 주인이 없는 프로필 — 어드민이 온보딩용으로 미리 만들어 둔 것들. */
export interface UnclaimedProfile {
  id: string;
  name: string;
  address: string | null;
  kakao_place_id: string;
}

export function listUnclaimedProfiles(): Promise<{ profiles: UnclaimedProfile[] }> {
  return jsonFetchWithSession(API_ROOT + "/partner/unclaimed-profiles");
}

/**
 * 미리 만들어 둔 프로필을 병원 계정에 넘긴다.
 *
 * 온보딩을 어드민이 시작하기 때문에 필요하다 — 넘겨주지 않으면 그 병원은
 * 가입해도 자기 프로필을 수정할 수 없고, 공지 하나 올리려고 계속 우리에게
 * 연락해야 한다.
 */
export function claimProfileForAccount(
  accountId: string,
  profileId: string,
): Promise<{ id: string; owner_account_id: string }> {
  return jsonFetchWithSession(
    API_ROOT + "/partner/accounts/" + accountId + "/claim-profile",
    { method: "POST" },
    { profile_id: profileId },
  );
}
