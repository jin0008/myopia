import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

type RegisterMeasurementData = {
  patient_id: string;
  date: string;
  instrument_id: string;
  od: number | null;
  os: number | null;
};

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
