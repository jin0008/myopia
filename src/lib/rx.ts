/**
 * 안경처방전 값 다루기. 화면과 인쇄가 같은 규칙을 쓴다.
 * 검증: npx tsx scripts/rx.check.ts
 */

/** 입력칸 글자 → 숫자. 비었으면 null, 숫자가 아니면 NaN(빨간 칸). */
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

/** 처방일 기준 만 나이. */
export function ageOn(dob: string, on: string): number | null {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [y, m, d] = on.split("-").map(Number);
  if (!by || !y) return null;
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

/** 근용 SPH = 원용 SPH + ADD. 원용 SPH 가 비었으면 ADD 만으로(평광 원용). */
export const nearSph = (farSph: number | null, add: number | null) =>
  add == null ? null : Math.round(((farSph ?? 0) + add) * 100) / 100;

/** 한 칸의 문제. 없으면 null. 서버 검증과 같은 범위. */
export function cellProblem(key: "sph" | "cyl" | "axis" | "prism" | "pd" | "add", n: number | null): string | null {
  if (n == null) return null;
  if (Number.isNaN(n)) return "숫자가 아닙니다";
  switch (key) {
    case "sph":
      return Math.abs(n) > 30 ? "±30 안" : isQuarter(n) ? null : "0.25 단위";
    case "cyl":
      return Math.abs(n) > 10 ? "±10 안" : isQuarter(n) ? null : "0.25 단위";
    case "add":
      return n < 0 || n > 4 ? "0~4" : isQuarter(n) ? null : "0.25 단위";
    case "axis":
      return Number.isInteger(n) && n >= 0 && n <= 180 ? null : "0~180 정수";
    case "prism":
      return n < 0 || n > 30 ? "0~30" : null;
    case "pd":
      return n < 40 || n > 80 ? "40~80mm" : null;
  }
}
