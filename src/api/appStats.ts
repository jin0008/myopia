import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

/** 마이오닥 앱 보호자 가입 현황(GET /app-stats). 숫자만 온다. */
export interface AppStats {
  total: number;
  today: number;
  last7: number;
  thisMonth: number;
  /** 최근 30일, 오래된 날부터. 가입이 없는 날도 0 으로 있다. */
  daily: { day: string; count: number }[];
  methods: { email: number; kakao: number; naver: number; google: number; apple: number };
  children: number;
  linkedChildren: number;
  active7: number;
  active30: number;
}

export function getAppStats(): Promise<AppStats> {
  return jsonFetchWithSession(API_ROOT + "/app-stats");
}

/** 보호자 목록 한 줄. 계정을 알아보는 데 필요한 것만 - 자녀 민감정보는 없다. */
export interface GuardianRow {
  id: string;
  /** "YYYY-MM-DD HH:MM" (한국 시간) */
  joined: string;
  email: string | null;
  username: string | null;
  /** email · kakao · naver · google · apple */
  methods: string[];
  children: number;
  linkedChildren: number;
  /** "YYYY-MM-DD" 최근 앱을 연 날(어림). 없으면 null. */
  lastSeen: string | null;
  /** 정지된 날(한국 시간). 정상이면 null. */
  suspendedOn: string | null;
  suspendedReason: string | null;
}

/** 보호자 목록. 서버가 볼 때마다 감사 기록을 남긴다. */
export function listGuardians(q: string, page: number): Promise<{
  page: number;
  pageSize: number;
  total: number;
  guardians: GuardianRow[];
}> {
  const qs = new URLSearchParams({ q, page: String(page) });
  return jsonFetchWithSession(API_ROOT + "/app-stats/guardians?" + qs.toString());
}

/** 앱 이용을 막는다. 사유는 본인이 다시 로그인할 때 보인다. */
export function suspendGuardian(id: string, reason: string): Promise<{ ok: true }> {
  return jsonFetchWithSession(API_ROOT + `/app-stats/guardians/${id}/suspend`, { method: "POST" }, { reason });
}

export function unsuspendGuardian(id: string): Promise<{ ok: true }> {
  return jsonFetchWithSession(API_ROOT + `/app-stats/guardians/${id}/unsuspend`, { method: "POST" });
}

/** 계정을 지운다. 앱의 회원 탈퇴와 같다. 되돌릴 수 없다. */
export function deleteGuardian(id: string): Promise<{ ok: true }> {
  return jsonFetchWithSession(API_ROOT + `/app-stats/guardians/${id}`, { method: "DELETE" });
}
