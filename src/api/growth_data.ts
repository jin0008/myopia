import { jsonFetch } from "../lib/fetch";
import { API_ROOT } from "./root";

export function getGrowthData() {
  return jsonFetch(API_ROOT + "/growth_data");
}
