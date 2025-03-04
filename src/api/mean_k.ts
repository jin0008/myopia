import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

type kInput = {
  patient_id: string;
  k_type: "K1" | "K2";
  od: number;
  os: number;
};
export function upsertPatientK(data: kInput) {
  return jsonFetchWithSession(
    API_ROOT + "/patient_k",
    {
      method: "PUT",
    },
    data,
    false
  );
}
