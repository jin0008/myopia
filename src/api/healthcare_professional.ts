import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type RegisterData = {
  name: string;
  country_id: string;
  hospital:
    | {
        id: string;
      }
    | {
        name: string;
        country_id: string;
        code: string;
      };
  default_ethnicity_id: string | null;
  default_instrument_id: string | null;
};

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

export type UpdateData = {
  default_ethnicity_id?: string | null;
  default_instrument_id?: string | null;
};

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
