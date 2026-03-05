import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export function registerRefractiveError(data: {
  patient_id: string;
  method_id: number;
  date: string;
  od_sph: number;
  od_cyl: number;
  os_sph: number;
  os_cyl: number;
}) {
  return jsonFetchWithSession(
    API_ROOT + "/refractive_error",
    {
      method: "POST",
    },
    data,
    false,
  );
}

export function deleteRefractiveError(id: string) {
  return jsonFetchWithSession(
    API_ROOT + "/refractive_error/" + id,
    {
      method: "DELETE",
    },
    undefined,
    false,
  );
}
