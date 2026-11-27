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

/** 도수가 하나라도 있는가(SPH·CYL 칸, ADD). REMARKS 만 있는 처방은 막는다 - 앱에 빈 처방으로 뜬다.
 *  서버(patientPrescription postSchema)와 같은 규칙이다. */
export function hasPower(rows: { sph: string; cyl: string }[], add = ""): boolean {
  return rows.some((r) => r.sph.trim() !== "" || r.cyl.trim() !== "") || add.trim() !== "";
}

/** 처방일 기준 나이(만). 3세 미만은 개월까지. */
export function ageAt(dob: string, ref: string): { y: number; m: number } | null {
  // 치는 중인 "2015" 같은 값으로 나이를 내면 "NaN세" 가 찍힌다.
  if (!isRealDate(dob) || (ref && !isRealDate(ref))) return null;
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

/** 숫자만 받아 YYYY-MM-DD 로 끊는다. 연도 4자리(월 2자리)를 치는 순간 "-" 를 붙여
 *  다음 칸으로 넘어간 것처럼 보인다. 지울 때(prev 보다 짧아질 때)는 붙이지 않는다 -
 *  붙이면 "-" 를 지워도 바로 다시 생겨 못 지운다.
 *  (브라우저 날짜 칸은 연도를 6자리까지 받아 넘어가지 않는다.) */
export function maskDate(raw: string, prev = ""): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  const typing = raw.length > prev.length;
  let out = d.slice(0, 4);
  if (d.length > 4 || (typing && d.length === 4)) out += "-" + d.slice(4, 6);
  if (d.length > 6 || (typing && d.length === 6)) out += "-" + d.slice(6, 8);
  return out;
}

/** 실제로 있는 날짜인가(2015-02-30 은 아니다). */
export function isRealDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** EMR 차트 한 눈의 칸. 종이에 찍을 글자 그대로(+1.25, 180). */
export interface EmrEye { sph: string; cyl: string; axis: string; prism: string; base: string }

/**
 * EMR 차트 글을 처방 칸으로. 교수님 차트 예:
 *   MR pd=54 ****처방
 *   R: +1.25 -1.50 180 2Δ BI (x1.0)
 *   L:       -2.00 180
 * - 부호나 소수점이 있는 수는 도수, 없는 정수는 축(0~180, 0 은 180).
 * - 도수 둘이면 SPH·CYL, 하나에 축이 있으면 CYL 만(SPH 없는 난시), 축이 없으면 SPH 만.
 * - "숫자Δ BI/BO/BU/BD" 는 프리즘, 괄호 (x1.0) 은 시력이라 버린다.
 * - 덩어리(MR·CR …)가 여럿이면 머리줄에 "처방"이 있는 첫 덩어리, 없으면 첫 덩어리.
 * 0.25 단위가 아니거나 범위를 벗어난 값은 칸을 비우고 warn 에 적는다.
 */
export function parseEmrRx(text: string): { od: EmrEye | null; os: EmrEye | null; pd: string; warn: string[] } {
  type Block = { head: string; eyes: { side: "od" | "os"; body: string }[] };
  const blocks: Block[] = [];
  let cur: Block = { head: "", eyes: [] };
  for (const line of text.split(/\r?\n/)) {
    // \b: "Refraction", "Remarks", "Lens…" 같은 줄을 눈 줄로 읽지 않는다.
    const m = /^\s*(R|L|OD|OS)\b\s*[:.]?\s*(.*)$/i.exec(line);
    if (m) {
      cur.eyes.push({ side: /^(R|OD)$/i.test(m[1]) ? "od" : "os", body: m[2] });
    } else if (line.trim()) {
      if (cur.head || cur.eyes.length) blocks.push(cur);
      cur = { head: line, eyes: [] };
    }
  }
  blocks.push(cur);
  const withEyes = blocks.filter((b) => b.eyes.length);
  const pick = withEyes.find((b) => b.head.includes("처방")) ?? withEyes[0];
  const warn: string[] = [];
  const pdOf = (s: string) => /pd\s*[=:]?\s*(\d+(?:\.\d+)?)/i.exec(s)?.[1];
  const pd = (pick && pdOf(pick.head)) ?? pdOf(text) ?? "";

  const eye = (side: "od" | "os", body: string): EmrEye => {
    const tag = side === "od" ? "R" : "L";
    const out: EmrEye = { sph: "", cyl: "", axis: "", prism: "", base: "" };
    let rest = body.replace(/\([^)]*\)/g, " ");
    const pr = /(\d+(?:\.\d+)?)\s*(?:Δ|△)?\s*(BI|BO|BU|BD)\b/i.exec(rest);
    if (pr) {
      const p = Number(pr[1]);
      if (p > 0 && p <= 30) { out.prism = String(p); out.base = pr[2].toUpperCase(); } else warn.push(`${tag} 프리즘 ${pr[1]}Δ 는 0~30 사이여야 합니다.`);
      rest = rest.replace(pr[0], " ");
    }
    const toks = rest.match(/[+-]?\d+(?:\.\d+)?/g) ?? [];
    const pows = toks.filter((x) => /[+-]|\./.test(x));
    const axes = toks.filter((x) => !/[+-]|\./.test(x));
    if (pows.length > 2 || axes.length > 1) warn.push(`${tag}: 숫자가 많아 일부만 읽었습니다 - "${body.trim()}"`);
    const [sphRaw, cylRaw] = pows.length >= 2 ? pows : axes.length ? [undefined, pows[0]] : [pows[0], undefined];
    const pow = (raw: string | undefined, max: number, label: string) => {
      if (raw == null) return "";
      const n = Number(raw);
      if (!isQuarter(n) || Math.abs(n) > max) { warn.push(`${tag} ${label} ${raw} 는 0.25 단위, ±${max} 안이어야 합니다.`); return ""; }
      return fmtD(n);
    };
    out.sph = pow(sphRaw, 30, "SPH");
    out.cyl = pow(cylRaw, 10, "CYL");
    if (axes[0] != null) {
      const a = Number(axes[0]);
      if (Number.isInteger(a) && a >= 0 && a <= 180) out.axis = String(a === 0 ? 180 : a);
      else warn.push(`${tag} 축 ${axes[0]} 는 0~180 정수여야 합니다.`);
    }
    return out;
  };
  const find = (side: "od" | "os") => pick?.eyes.find((e) => e.side === side);
  const r = find("od"), l = find("os");
  return { od: r ? eye("od", r.body) : null, os: l ? eye("os", l.body) : null, pd, warn };
}
