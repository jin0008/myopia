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
  /** "hospital" | "optical". 가입할 때 정해진다. */
  businessKind: "hospital" | "optical";
  claimedPlaceId: string | null;
  claimedName: string | null;
  /** 광고가 쓰는 가게. 운영자가 묶어 준다. 없으면 프리미엄 신청 불가. */
  facilityKind: "eye" | "optical" | null;
  facilityKey: string | null;
  facilityName: string | null;
  facilityAddress: string | null;
  /** 운영자가 확인한 취급 브랜드. */
  brands: string[];
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
  /** 운영자가 확인한 취급 브랜드. */
  brands: string[];
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

/**
 * 취급 브랜드를 고친다.
 *
 * 인증 심사에서 한 번 정하면 그만이었는데, 안경원이 나중에 다른 렌즈를
 * 들여오거나 그만 취급할 수 있다. 파트너가 아니라 운영자가 고친다 -
 * 상표라 스스로 켤 수 있으면 안 된다.
 */
export function setAccountBrands(id: string, brands: string[]) {
  return jsonFetchWithSession(
    API_ROOT + `/partner/accounts/${id}/brands`,
    { method: "PATCH" },
    { brands },
    false,
  );
}

/**
 * 계정을 지운다.
 *
 * 프로필은 지워지지 않는다 - 주인만 비워져 운영자가 다른 계정에 넘겨줄 수
 * 있게 된다. 진행 중인 광고도 기간이 끝날 때까지 그대로 나간다.
 */
export function deletePartnerAccount(id: string) {
  return jsonFetchWithSession(
    API_ROOT + `/partner/accounts/${id}`,
    { method: "DELETE" },
    undefined,
    false,
  );
}

/* ---- 업체 인증 심사 ----------------------------------------------------- */

export interface AdminVerification {
  id: string;
  kind: "eye" | "optical";
  key: string;
  facilityName: string;
  /** 제출 서류의 파일명. 열람은 관리자 인증이 걸린 별도 주소로 한다. */
  docFiles: string[];
  /** 신청자가 적어 낸 임상 플랫폼 병원코드. 운영자가 맞춰 보는 값이다. */
  eyelogCode: string | null;
  /** 신청자가 고른 취급 브랜드. 운영자가 서류와 맞춰 본다. */
  brands: string[];
  status: "pending" | "approved" | "rejected" | "cancelled";
  note: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  account: {
    id: string;
    hospitalName: string;
    contactName: string;
    email: string;
    businessKind: "hospital" | "optical";
  };
}

export function listVerifications(): Promise<AdminVerification[]> {
  return jsonFetchWithSession(API_ROOT + "/partner/verifications");
}

export function reviewVerification(
  id: string,
  action: "approve" | "reject",
  reviewNote?: string,
  /** 승인할 때 함께 정한다. null 이면 "아이로그 안 씀". */
  eyelogHospitalId?: string | null,
  /** 운영자가 확인한 취급 브랜드. */
  brands?: string[],
): Promise<{ id: string; status: string }> {
  return jsonFetchWithSession(
    API_ROOT + `/partner/verifications/${id}/review`,
    { method: "POST" },
    { action, reviewNote, eyelogHospitalId, brands },
  );
}

/**
 * 제출 서류를 받는다.
 *
 * <a href> 로 걸 수 없다 - 이 주소는 관리자 인증이 걸려 있고, 브라우저가
 * 링크를 따라갈 때는 Authorization 헤더를 붙이지 않는다. 받아서 blob 으로
 * 내려준다.
 */
export async function downloadVerificationDoc(id: string, name: string): Promise<void> {
  const res = await fetch(
    API_ROOT + `/partner/verifications/${id}/docs/${encodeURIComponent(name)}`,
    { headers: { Authorization: `Bearer ${localStorage.getItem("session_key") ?? ""}` } },
  );
  if (!res.ok) {
    alert("서류를 열지 못했습니다.");
    return;
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  // 바로 지우면 크롬이 받기 전에 사라진다.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ---- 결제 내역 (운영자) ------------------------------------------------ */

export interface AdminPayment {
  id: string;
  orderId: string;
  tid: string | null;
  amount: number;
  /** "pending" | "paid" | "failed" | "canceled" */
  status: string;
  payMethod: string | null;
  paidAt: string | null;
  failedReason: string | null;
  createdAt: string;
  account: { id: string; hospitalName: string; email: string };
}

export function listPayments(): Promise<AdminPayment[]> {
  return jsonFetchWithSession(API_ROOT + "/payment");
}

/**
 * 승인을 취소한다.
 *
 * 당일 취소면 카드사가 매입을 올리지 않아 실제로 청구되지 않는다.
 * 구독은 자동으로 되돌리지 않는다 - 어느 달 몫을 빼야 하는지는 사람이
 * 보고 정할 일이다.
 */
export function cancelPayment(id: string, reason: string) {
  return jsonFetchWithSession(
    API_ROOT + `/payment/${id}/cancel`,
    { method: "POST" },
    { reason },
    false,
  );
}

/** 웹훅을 놓쳤을 때 거래번호로 다시 맞춘다. */
export function syncPayment(tid: string) {
  return jsonFetchWithSession(
    API_ROOT + "/payment/sync",
    { method: "POST" },
    { tid },
    false,
  );
}
