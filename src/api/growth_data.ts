import { jsonFetch } from "../lib/fetch";
import { API_ROOT } from "./root";

export function getGrowthDataEthnicityList() {
  return jsonFetch(API_ROOT + "/growth_data/ethnicity_list");
}

export function getGrowthData(sex: "male" | "female", ethnicity: string) {
  return jsonFetch(
    API_ROOT +
      `/growth_data?sex=${sex}&ethnicity=${encodeURIComponent(ethnicity)}`
  );
}
