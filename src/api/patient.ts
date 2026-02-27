import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export function getPatients(
  orderBy:
    | "created_at"
    | "registration_number"
    | "date_of_birth"
    | "sex" = "created_at",
  orderByDirection: "asc" | "desc" = "desc",
) {
  return jsonFetchWithSession(
    API_ROOT +
      `/patient?orderBy=${orderBy}&orderByDirection=${orderByDirection}`,
  );
}

export function getPatientDetail(id: string) {
  return jsonFetchWithSession(API_ROOT + `/patient/${id}`);
}

type NewPatientInput = {
  registration_number: string;
  date_of_birth: string;
  sex: "male" | "female";
  ethnicity_id: string;
  email?: string;
};

export function registerPatient(data: NewPatientInput) {
  return jsonFetchWithSession(
    API_ROOT + "/patient",
    {
      method: "POST",
    },
    data,
    false,
  );
}

export type UpdatePatientInput = {
  id: string;
  date_of_birth?: string;
  sex?: "male" | "female";
};

export function updatePatient(data: UpdatePatientInput) {
  return jsonFetchWithSession(
    API_ROOT + "/patient/" + data.id,
    {
      method: "PATCH",
    },
    data,
    false,
  );
}

export function deletePatient(id: string) {
  return jsonFetchWithSession(
    API_ROOT + "/patient/" + id,
    {
      method: "DELETE",
    },
    undefined,
    false,
  );
}

export function createPatientDeletionRequest(patientId: string) {
  return jsonFetchWithSession(
    API_ROOT + "/patient/deleteRequest",
    {
      method: "POST",
    },
    {
      patient_id: patientId,
    },
    false,
  );
}

export function getPatientDeleteRequests() {
  return jsonFetchWithSession(API_ROOT + "/patient/deleteRequest");
}

export function approvePatientDeletionRequest(patientId: string) {
  return jsonFetchWithSession(
    API_ROOT + "/patient/deleteRequest/" + patientId + "/approve",
    {
      method: "POST",
    },
    undefined,
    false,
  );
}

export function rejectPatientDeletionRequest(patientId: string) {
  return jsonFetchWithSession(
    API_ROOT + "/patient/deleteRequest/" + patientId + "/reject",
    {
      method: "POST",
    },
    undefined,
    false,
  );
}
