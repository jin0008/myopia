// Treatment-finder categories, kept in sync with the myodoc app
// (src/features/treatmentFinder/TreatmentCategoryScreen.tsx). A profile's
// treatment_items are tagged with one of these keys so the app can surface the
// right item when a user browses by category.
export const TREATMENT_CATEGORIES = [
  { key: "visionCorrection", label: "시력교정술" },
  { key: "presbyopia", label: "노안수술" },
  { key: "cataract", label: "백내장수술" },
  { key: "dreamLens", label: "드림렌즈" },
  { key: "dryEyeIpl", label: "안구건조증 IPL" },
  { key: "eyelid", label: "아이링수술" },
  { key: "retina", label: "망막질환" },
  { key: "etc", label: "기타" },
] as const;

export type TreatmentCategoryKey = (typeof TREATMENT_CATEGORIES)[number]["key"];

export function categoryLabel(key: string): string {
  return TREATMENT_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export interface TreatmentItem {
  category: string;
  name: string;
  normalPrice?: number | null;
  eventPrice?: number | null;
  description?: string;
}
