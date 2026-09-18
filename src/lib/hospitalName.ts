/**
 * 병원 이름 두 칸.
 *
 * - `name`    : 가입 때 입력한 원래 이름(영문 또는 한글). 항상 있다.
 * - `name_ko` : 한글 표시 이름. 선택. 비어 있으면 `name` 을 그대로 쓴다.
 *
 * 한국어 화면에서는 한글 이름을 먼저, 영어 화면에서는 원래 이름을 보인다.
 */
export type HospitalNames = { name: string; name_ko?: string | null };

export function hospitalDisplayName(
  h: HospitalNames,
  language: "ko" | "en" = "ko",
): string {
  if (language === "ko") {
    const ko = h.name_ko?.trim();
    if (ko) return ko;
  }
  return h.name;
}

/** 한글 이름이 따로 있으면 원래 이름을 돌려준다(관리 화면 보조 표기용). */
export function hospitalOriginalNameIfDifferent(h: HospitalNames): string | null {
  const ko = h.name_ko?.trim();
  return ko && ko !== h.name ? h.name : null;
}

/** 원래 이름·한글 이름·코드 어느 것으로든 찾는다. */
export function hospitalMatches(
  h: HospitalNames & { code?: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    h.name.toLowerCase().includes(q) ||
    (h.name_ko ?? "").toLowerCase().includes(q) ||
    (h.code ?? "").toLowerCase().includes(q)
  );
}
