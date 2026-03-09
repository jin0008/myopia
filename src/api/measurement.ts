import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import type { RegisterAxialLengthData } from "../types/measurement";

export function registerMeasurement(data: RegisterAxialLengthData) {
  return jsonFetchWithSession(
    API_ROOT + "/measurement",
    {
      method: "POST",
    },
    data,
    false,
  );
}

export function updateMeasurement(
  id: string,
  data: Omit<RegisterAxialLengthData, "patient_id">,
) {
  return jsonFetchWithSession(
    API_ROOT + "/measurement/" + id,
    {
      method: "PATCH",
    },
    data,
    false,
  );
}

export function deleteMeasurement(id: string) {
  return jsonFetchWithSession(
    API_ROOT + "/measurement/" + id,
    {
      method: "DELETE",
    },
    undefined,
    false,
  );
}
