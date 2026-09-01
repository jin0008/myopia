// Treatment-finder categories, kept in sync with the myodoc app
// (src/features/treatmentFinder/TreatmentCategoryScreen.tsx). A profile's
// treatment_items are tagged with one of these keys so the app can surface the
// right item when a user browses by category.
// Childhood myopia only — the app's whole subject. This list used to carry
// general adult ophthalmology (라식·백내장·노안수술) borrowed from a competitor
// while prototyping, which put the hospital finder at odds with every other
// part of the product. `dreamLens` keeps its old key so profiles already
// tagged with it stay valid.
export const TREATMENT_CATEGORIES = [
  { key: "dreamLens", label: "드림렌즈" },
  { key: "misight", label: "마이사이트" },
  { key: "myopiaGlasses", label: "근시조절안경" },
  { key: "atropine", label: "저농도 아트로핀" },
  { key: "checkup", label: "근시 검진·상담" },
] as const;

export type TreatmentCategoryKey = (typeof TREATMENT_CATEGORIES)[number]["key"];

export function categoryLabel(key: string): string {
  return TREATMENT_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/** 이벤트·프로모션 한 줄.
 *  category 는 상세에서 묶어 보여줄 때만 쓴다. 병원이 어떤 치료를 하는지는
 *  프로필의 treatment_categories 가 답하므로 여기서는 비워도 된다. */
export interface TreatmentItem {
  category?: string;
  name: string;
  normalPrice?: number | null;
  eventPrice?: number | null;
  description?: string;
}
