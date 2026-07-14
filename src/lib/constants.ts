export const professionalRoleList = [
  "Medical Doctor (M.D.)",
  "Doctor of Osteopathic Medicine (D.O.)",
  "Optometrist",
  "Nurse or Nurse Practitioner",
  "Others",
] as const;

export const MOBILE_MEDIA = "(max-aspect-ratio: 1/1)";

// Collapse to the compact/mobile layout on portrait screens OR whenever the
// viewport is too narrow to fit the full desktop nav (prevents header overflow
// on narrow landscape windows).
export const COMPACT_MEDIA = "(max-aspect-ratio: 1/1), (max-width: 1100px)";
