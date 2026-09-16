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
  /** 광고가 쓰는 가게. 운영자가 묶어 준다. 없으면 프리미엄 신청 불가. */
  facilityKind: "eye" | "optical" | null;
  facilityKey: string | null;
  facilityName: string | null;
  facilityAddress: string | null;
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

/* ---- 유료 노출 ------------------------------------------------------- *
 *                                                                        *
 * 등급은 사이트 관리자만 켠다. 파트너가 스스로 올릴 수 있으면 돈을 내지     *
 * 않고도 프리미엄이 된다.                                                 *
 * ---------------------------------------------------------------------- */

export interface FacilityPromotion {
  id: string;
  /** "eye" 면 심평원 요양기호, "optical" 이면 지자체 인허가번호로 잇는다. */
  kind: "eye" | "optical";
  key: string;
  /** 명부에서 찾은 상호. null 이면 그 번호로 붙는 업체가 없다는 뜻이다 -
   *  번호를 잘못 넣은 광고는 여기가 비어 나온다. */
  facilityName: string | null;
  facilityAddress: string | null;
  tier: "premium";
  startsOn: string;
  endsOn: string;
  /** 오늘이 기간 안인지. 화면이 다시 재지 않아도 되게 서버가 답한다. */
  active: boolean;
  accountId: string | null;
  accountName: string | null;
  accountEmail: string | null;
  note: string | null;
  /** 지난 30일 성적. 파트너가 보는 숫자와 같은 곳에서 만든다. */
  impressions30d: number;
  clicks30d: number;
}

export interface FacilityHit {
  kind: "eye" | "optical";
  key: string;
  name: string;
  address: string;
}

/** 광고 걸 업체를 이름으로 찾는다. 번호를 손으로 옮겨 적지 않게 하려는
 *  것이다 - 25자짜리 인허가번호는 한 글자만 빠져도 아무 데도 안 붙는다. */
export function searchFacilities(q: string): Promise<FacilityHit[]> {
  return jsonFetchWithSession(
    API_ROOT + "/partner/facilities?q=" + encodeURIComponent(q),
  );
}

export function listPromotions(): Promise<FacilityPromotion[]> {
  return jsonFetchWithSession(API_ROOT + "/partner/promotions");
}

/** 상호·주소는 명부에서 읽어 오는 값이라 보내지 않는다. */
export function savePromotion(body: {
  kind: "eye" | "optical";
  key: string;
  tier: "premium";
  startsOn: string;
  endsOn: string;
  accountId?: string;
  note?: string;
}): Promise<{ id: string }> {
  return jsonFetchWithSession(
    API_ROOT + "/partner/promotions",
    { method: "PUT" },
    body,
  );
}

export function deletePromotion(id: string) {
  return jsonFetchWithSession(
    API_ROOT + "/partner/promotions/" + id,
    { method: "DELETE" },
    undefined,
    false,
  );
}

/* ---- 프리미엄 신청 (운영자) --------------------------------------------- */

export interface AdminPromotionRequest {
  id: string;
  kind: "eye" | "optical";
  key: string;
  facilityName: string;
  startsOn: string;
  months: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  note: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  accountId: string;
  accountName: string;
  accountEmail: string;
  contactName: string;
}

export function listPromotionRequests(
  status?: string,
): Promise<AdminPromotionRequest[]> {
  return jsonFetchWithSession(
    API_ROOT + "/partner/promotion-requests" + (status ? `?status=${status}` : ""),
  );
}

/** 허락한다. 여기서 광고가 걸린다. 결제가 붙으면 이 자리가 입금 확인이 된다. */
export function approvePromotionRequest(id: string, note?: string) {
  // 네 번째 인자가 false 여야 한다. 서버가 204 로 답하는데 기본값(true)은
  // 빈 본문에 대고 json() 을 불러 터진다 - 승인은 됐는데 화면에는 실패로
  // 뜨고, 목록도 갱신되지 않아 여전히 '확인 중'으로 남는다.
  return jsonFetchWithSession(
    API_ROOT + `/partner/promotion-requests/${id}/approve`,
    { method: "POST" },
    { note },
    false,
  );
}

/** 거절한다. 사유는 신청한 업체 화면에 그대로 보인다. */
export function rejectPromotionRequest(id: string, note: string) {
  return jsonFetchWithSession(
    API_ROOT + `/partner/promotion-requests/${id}/reject`,
    { method: "POST" },
    { note },
    false,
  );
}

/** 계정에 가게를 묶는다. key 를 비우면 푼다.
 *
 *  프로필은 카카오 장소로, 광고는 심평원 번호로 식별된다. 그 둘을 잇는
 *  일이라 사람이 한 번 해야 한다 - 계정이 정말 그 가게인지는 서류나
 *  통화로 확인할 수밖에 없다. */
export function setAccountFacility(
  id: string,
  facility: { kind: "eye" | "optical"; key: string } | null,
) {
  return jsonFetchWithSession(
    API_ROOT + `/partner/accounts/${id}/facility`,
    { method: "PUT" },
    facility ?? { key: "" },
    false,
  );
}
