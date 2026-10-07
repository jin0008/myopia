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
