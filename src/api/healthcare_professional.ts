import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

type RegisterData = {
  name: string;
  country_id: string;
  hospital:
    | {
        id: string;
      }
    | {
        name: string;
        country_id: string;
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
