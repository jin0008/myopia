/**
 * 저장에 실패했을 때 "어느 탭 어느 칸이 문제인지"를 한국어로 짚어주기 위한 표.
 *
 * 서버는 `banner_image_url: Invalid url` 같은 필드 경로를 돌려준다. 병원 담당자
 * 입장에서 그건 아무 정보도 아니고, 탭이 일곱 개라 어디를 열어야 할지도 모른다.
 * 경로를 탭 이름과 칸 이름으로 옮겨 적는다.
 */
export const FIELD_LABELS: Record<string, { tab: string; label: string }> = {
  kakao_place_id: { tab: "기본 정보", label: "병원 찾기" },
  name: { tab: "기본 정보", label: "병원명" },
  tagline: { tab: "기본 정보", label: "한 줄 소개" },
  keywords: { tab: "기본 정보", label: "키워드 태그" },
  phone: { tab: "기본 정보", label: "전화" },
  address: { tab: "기본 정보", label: "주소" },
  booking_url: { tab: "기본 정보", label: "예약 링크" },
  images: { tab: "배너 사진", label: "배너 사진" },
  banner_image_url: { tab: "배너 사진", label: "배너 이미지" },
  thumbnail_url: { tab: "배너 사진", label: "대표 사진" },
  detail_blocks: { tab: "상세 설명", label: "상세 설명" },
  doctors: { tab: "의사 정보", label: "의사 정보" },
  opening_hours: { tab: "진료시간", label: "진료시간" },
  treatment_items: { tab: "치료항목", label: "치료항목" },
  description: { tab: "상세 설명", label: "소개 글" },
  latitude: { tab: "기본 정보", label: "위치 좌표" },
  longitude: { tab: "기본 정보", label: "위치 좌표" },
};

/** zod 메시지를 병원 담당자가 읽을 수 있는 말로. */
function humanReason(message: string): string {
  if (/url/i.test(message)) return "주소 형식이 올바르지 않습니다 (http로 시작해야 합니다)";
  if (/required|expected/i.test(message)) return "값이 비어 있습니다";
  if (/at most|too big|max/i.test(message)) return "너무 깁니다";
  if (/at least|too small|min/i.test(message)) return "값이 비어 있습니다";
  return message;
}

/**
 * 서버가 돌려준 필드 오류를 "탭 · 항목 — 이유" 줄로 바꾼다.
 * 배열 필드는 인덱스를 사람이 세는 번호(1부터)로 바꿔 붙인다.
 */
export function describeFieldErrors(
  fields: { path: string; message: string }[] | undefined,
): string[] {
  if (!fields || fields.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of fields) {
    const [root, index] = f.path.split(".");
    const meta = FIELD_LABELS[root];
    if (!meta) continue;
    const nth = index != null && /^\d+$/.test(index) ? ` ${Number(index) + 1}번째` : "";
    const line = `[${meta.tab}] ${meta.label}${nth} — ${humanReason(f.message)}`;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}
