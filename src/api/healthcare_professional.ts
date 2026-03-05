import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import type {
  RegisterData,
  UpdateData,
  EditMemberAdminData,
} from "../types/healthcare_professional";

export function registerProfessional(data: RegisterData) {
  return jsonFetchWithSession(
    API_ROOT + "/healthcare_professional",
    {
      method: "POST",
    },
    data,
    false
  );
}

export function updateProfessional(data: UpdateData) {
  return jsonFetchWithSession(
    API_ROOT + "/healthcare_professional",
    {
      method: "PATCH",
    },
    data,
    false
  );
}

export function updateProfessionalHospital(
  data:
    | {
        id: string;
      }
    | {
        name: string;
        country_id: string;
      }
) {
  return jsonFetchWithSession(
    API_ROOT + "/healthcare_professional/hospital",
    {
      method: "PATCH",
    },
    data,
    false
  );
}

export function updateProfessionalStatus(
  id: string,
  data: EditMemberAdminData
) {
  return jsonFetchWithSession(
    API_ROOT + `/healthcare_professional/${id}`,
    {
      method: "PATCH",
    },
    data,
    false
  );
}

export function deleteProfessional(id: string) {
  return jsonFetchWithSession(
    API_ROOT + `/healthcare_professional/${id}`,
    {
      method: "DELETE",
    },
    undefined,
    false
  );
}
