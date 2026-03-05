import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import type { RegisterMeasurementData } from "../types/measurement";

export function registerMeasurement(data: RegisterMeasurementData) {
  return jsonFetchWithSession(
    API_ROOT + "/measurement",
    {
      method: "POST",
    },
    data,
    false
  );
}

export function deleteMeasurement(id: string) {
  return jsonFetchWithSession(
    API_ROOT + "/measurement/" + id,
    {
      method: "DELETE",
    },
    undefined,
    false
  );
}
