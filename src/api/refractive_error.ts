import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import { RegisterRefractiveErrorData } from "../types/measurement";

export function registerRefractiveError(data: RegisterRefractiveErrorData) {
  return jsonFetchWithSession(
    API_ROOT + "/refractive_error",
    {
      method: "POST",
    },
    data,
    false,
  );
}

export function updateRefractiveError(
  id: string,
  data: Omit<RegisterRefractiveErrorData, "patient_id">,
) {
  return jsonFetchWithSession(
    API_ROOT + "/refractive_error/" + id,
    {
      method: "PATCH",
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
