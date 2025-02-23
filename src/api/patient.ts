import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export function getPatients() {
  return jsonFetchWithSession(API_ROOT + "/patient");
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
    false
  );
}

export function deletePatient(id: string) {
  return jsonFetchWithSession(
    API_ROOT + "/patient/" + id,
    {
      method: "DELETE",
    },
    undefined,
    false
  );
}
