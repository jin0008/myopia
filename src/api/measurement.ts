import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

type RegisterMeasurementData = {
  patient_id: string;
  date: string;
  instrument_id: string;
  od: number;
  os: number;
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
