import { jsonFetch } from "../lib/fetch";
import { API_ROOT } from "./root";

export function getHospitalList() {
  return jsonFetch(API_ROOT + "/hospital");
}
