// 환자 설명 화면의 계산. 화면과 떼어 둔 것은 scripts/explain.check.ts 로 검사하려고.

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export type Pt = { date: string; v: number };

const t = (d: string) => new Date(d).getTime();

/** 진료 차트의 치료 이름(영문)을 보호자가 아는 말로. 모르는 이름은 그대로 둔다. */
export function treatmentKo(name: string): string {
  const atr = /^([\d.]+)%\s*atropine$/i.exec(name.trim());
  if (atr) return `${Number(atr[1]) < 0.5 ? "저농도 " : ""}아트로핀 ${atr[1]}%`;
  if (/^ortho-?k$/i.test(name.trim())) return "드림렌즈";
  if (/^(dims|halt)$/i.test(name.trim())) return `근시 억제 안경렌즈(${name.trim()})`;
  if (/^none$/i.test(name.trim())) return "치료 없음";
  return name;
}

/**
 * 1년 성장 속도(mm/년). 두 점만 쓰면 한 번의 측정 오차가 그대로 속도가 되니
 * 기간 안의 점 전부로 최소제곱 기울기를 낸다. 점이 둘 미만이거나 기간이
 * 3개월 미만이면 null - 며칠 간격 두 점으로 낸 연 환산은 숫자가 터진다.
 */
export function yearlyRate(pts: Pt[]): number | null {
  if (pts.length < 2) return null;
  const xs = pts.map((p) => t(p.date) / MS_PER_YEAR);
  const span = Math.max(...xs) - Math.min(...xs);
  if (span < 0.25) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = pts.reduce((a, p) => a + p.v, 0) / pts.length;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (pts[i].v - my);
    den += (x - mx) ** 2;
  });
  return den === 0 ? null : num / den;
}

/**
 * 치료 시작 전후의 성장 속도. 시작 직전 측정은 양쪽에 다 넣는다 - 치료 전의
 * 마지막 값이자 치료 후의 출발점이라, 빼면 치료 후 속도가 첫 방문 하나를
 * 잃고 점 둘을 못 채우는 일이 흔하다.
 */
export function beforeAfter(pts: Pt[], start: string): { before: number | null; after: number | null } {
  const s = t(start);
  const sorted = [...pts].sort((a, b) => t(a.date) - t(b.date));
  const before = sorted.filter((p) => t(p.date) <= s);
  const after = sorted.filter((p) => t(p.date) > s);
  const anchor = before[before.length - 1];
  return {
    before: yearlyRate(before),
    after: yearlyRate(anchor ? [anchor, ...after] : after),
  };
}

/** 가장 최근 값과 그 직전 값의 차이. */
export function lastChange(pts: Pt[]): { delta: number; months: number } | null {
  const sorted = [...pts].sort((a, b) => t(b.date) - t(a.date));
  if (sorted.length < 2) return null;
  const [a, b] = sorted;
  return {
    delta: Math.round((a.v - b.v) * 100) / 100,
    months: Math.max(1, Math.round((t(a.date) - t(b.date)) / (MS_PER_YEAR / 12))),
  };
}

/** 만 나이 "9세 4개월". */
export function ageKo(dob: string, at: string = new Date().toISOString()): string {
  const months = Math.floor((t(at) - t(dob)) / (MS_PER_YEAR / 12));
  if (!(months >= 0)) return "";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y ? `${y}세${m ? ` ${m}개월` : ""}` : `${m}개월`;
}

/** "2025.03" */
export function ym(d: string): string {
  const x = new Date(d);
  return `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, "0")}`;
}
