import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export interface AlertSetting {
  id: number;
  axial_min: number;
  axial_max: number;
  axial_decrease_mm: number;
  axial_increase_mm_per_year: number;
  se_min: number;
  se_progression_d_per_year: number;
}

export type AlertSettingInput = Omit<AlertSetting, "id">;

export function getAlertSetting() {
  return jsonFetchWithSession<AlertSetting>(API_ROOT + "/alert_setting");
}

export function updateAlertSetting(data: AlertSettingInput) {
  return jsonFetchWithSession<AlertSetting>(
    API_ROOT + "/alert_setting",
    { method: "PUT" },
    data,
  );
}
