import { API_ROOT } from "./root";
import type { TreatmentData } from "../types/treatment";

/**
 * Treatment comparison content.
 *
 * ★ SINGLE SOURCE OF TRUTH lives in the BACKEND:
 *     myopiaBackend/src/routes/mobile.ts  →  `const TREATMENTS`
 *     served at  GET /api/mobile/treatments
 *
 * Both this web portal and the mobile app (MyoDoc) read from that one
 * endpoint, so the content never drifts between the two. To change copy or add
 * a treatment, edit the backend `TREATMENTS` array — do NOT edit per-surface
 * copies. (The old static file src/data/treatments.ts is no longer used here.)
 */

interface TreatmentText {
  title: string;
  shortDescription: string;
  longDescription: string;
  mechanism: string;
  efficacy: string;
}

interface TreatmentItem {
  id: string;
  emoji: string;
  imageUrl: string;
  ko: TreatmentText;
  en: TreatmentText;
}

/** Fetch treatment content and flatten it to the current language. */
export async function getTreatmentContent(
  language: string,
): Promise<TreatmentData[]> {
  const res = await fetch(`${API_ROOT}/mobile/treatments`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`treatments request failed: ${res.status}`);
  }
  const data = (await res.json()) as { items?: TreatmentItem[] };
  const items = data.items ?? [];
  const lang: "ko" | "en" = language === "ko" ? "ko" : "en";
  return items.map((it) => ({
    id: it.id,
    imageUrl: it.imageUrl,
    ...it[lang],
  }));
}
