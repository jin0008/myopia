/**
 * 안경처방전 값 다루기. 화면과 인쇄가 같은 규칙을 쓴다.
 * 교수님 처방전 양식(안경처방전.html)의 규칙을 그대로 옮겼다.
 * 검증: npx tsx scripts/rx.check.ts
 */

/** 입력칸 글자 → 숫자. 비었으면 null, 숫자가 아니면 NaN. */
export function parseNum(raw: string): number | null {
  const t = raw.trim().replace(/^\+/, "");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** 0.25D 단위인가. 부동소수 오차를 견딘다. */
export const isQuarter = (n: number) => Math.abs(n * 4 - Math.round(n * 4)) < 1e-6;

/** 도수 표기: 부호와 소수 둘째 자리(+1.25, -0.50, 0.00). */
export function fmtD(n: number | null | undefined): string {
  if (n == null) return "";
  if (n === 0) return "0.00";
  return (n > 0 ? "+" : "") + n.toFixed(2);
}

/** 입력칸을 벗어날 때 정리: 0.25 단위로 맞추고 부호·둘째 자리. 숫자가 아니면 그대로. */
export function fmtPow(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  const n = parseFloat(v.replace(/[^\d.+-]/g, ""));
  if (Number.isNaN(n)) return v;
  return fmtD(Math.round(n * 4) / 4);
}

/** 도수 칸이 맞는가: 비었거나, 0.25 단위이고 ±30 안. */
export function okPow(v: string): boolean {
  if (!v.trim()) return true;
  const n = parseFloat(v);
  return !Number.isNaN(n) && isQuarter(n) && Math.abs(n) <= 30;
}

/** AXIS: CYL 이 있으면 1~180 정수가 있어야 한다. */
export function okAxis(v: string, cyl: string): boolean {
  if (!v.trim()) return !cyl.trim() || parseFloat(cyl) === 0;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 180;
}

/** 축을 1~180 으로. 0 은 180. */
export function normAxis(a: number): number {
  const r = Math.round(a) % 180;
  return r <= 0 ? r + 180 : r;
}

/** ±Cyl 변환: SPH+CYL, -CYL, AXIS+90. */
export function transpose(sph: string, cyl: string, axis: string): { sph: string; cyl: string; axis: string } | null {
  const c = parseFloat(cyl);
  if (!c) return null;
  const s = parseFloat(sph) || 0;
  return { sph: fmtD(Math.round((s + c) * 4) / 4), cyl: fmtD(-c), axis: String(normAxis((Number(axis) || 180) + 90)) };
}

/** 처방일 기준 나이(만). 3세 미만은 개월까지. */
export function ageAt(dob: string, ref: string): { y: number; m: number } | null {
  if (!dob) return null;
  const [by, bm, bd] = dob.split("-").map(Number);
  const [ry, rm, rd] = (ref || new Date().toISOString().slice(0, 10)).split("-").map(Number);
  if (!by || !ry) return null;
  let m = (ry - by) * 12 + (rm - bm);
  if (rd < bd) m--;
  if (m < 0) return null;
  return { y: Math.floor(m / 12), m: m % 12 };
}
export function ageStr(a: { y: number; m: number } | null): string {
  if (!a) return "";
  if (a.y >= 3) return `${a.y}세`;
  if (a.y === 0) return `${a.m}개월`;
  return `${a.y}세 ${a.m}개월`;
}

export function dateKo(d: string): string {
  if (!d) return "20  년  월  일";
  const [y, m, dd] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(dd)}일`;
}

/** REMARKS 칩: 쉼표로 나뉜 토큰으로 넣고 뺀다. */
const reEsc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokRe = (w: string) => new RegExp(`(^|,)[ \\t]*${reEsc(w)}[ \\t]*(?=,|$)`, "m");
export const hasTok = (text: string, w: string) => tokRe(w).test(text);
export function toggleTok(text: string, w: string): string {
  if (hasTok(text, w)) {
    return text
      .replace(tokRe(w), "$1")
      .replace(/,[ \t]*,/g, ",")
      .replace(/^[ \t]*,[ \t]*/gm, "")
      .replace(/[ \t]*,[ \t]*$/gm, "")
      .replace(/,(?=\S)/g, ", ");
  }
  return text.trim() ? text.replace(/\s+$/, "") + ", " + w : w;
}
