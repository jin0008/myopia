import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export function getUserPatients() {
  return jsonFetchWithSession(API_ROOT + "/user/patient");
}

export function addUserPatient({
  hospitalId,
  registration,
  dateOfBirth,
}: {
  hospitalId: string;
  registration: string;
  dateOfBirth: string;
}) {
  return jsonFetchWithSession(
    API_ROOT + "/user/patient",
    {
      method: "POST",
    },
    {
      hospital_id: hospitalId,
      registration_number: registration,
      date_of_birth: dateOfBirth,
    },
    false
  );
}

export function deleteUserPatient(id: string) {
  return jsonFetchWithSession(
    API_ROOT + "/user/patient/" + id,
    {
      method: "DELETE",
    },
    undefined,
    false
  );
}
