import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import type { Treatment, TreatmentEdit } from "../types/treatment";

export function registerPatientTreatment(data: Treatment) {
  return jsonFetchWithSession(
    API_ROOT + "/patient_treatment",
    {
      method: "POST",
    },
    data,
    false
  );
}

export function editPatientTreatment(id: string, data: Partial<TreatmentEdit>) {
  return jsonFetchWithSession(
    API_ROOT + "/patient_treatment/" + id,
    {
      method: "PATCH",
    },
    data,
    false
  );
}

export function deletePatientTreatment(id: string) {
  return jsonFetchWithSession(
    API_ROOT + "/patient_treatment/" + id,
    {
      method: "DELETE",
    },
    undefined,
    false
  );
}
