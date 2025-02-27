import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

type Treatment = {
  patient_id: string;
  treatment_id: string;
  start_date: string;
  end_date: string | null;
};

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

type TreatmentEdit = {
  treatment_id: string;
  start_date: string;
  end_date: string | null;
};

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
