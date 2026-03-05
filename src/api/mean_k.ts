import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import type { PatientKInput } from "../types/patient_k";

export function upsertPatientK(data: PatientKInput) {
  return jsonFetchWithSession(
    API_ROOT + "/patient_k",
    {
      method: "PUT",
    },
    data,
    false
  );
}
