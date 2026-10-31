import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export interface SecuritySetting {
  id: number;
  web_2fa_enabled: boolean;
}

export function getSecuritySetting() {
  return jsonFetchWithSession<SecuritySetting>(API_ROOT + "/security_setting");
}

export function updateSecuritySetting(data: { web_2fa_enabled: boolean }) {
  return jsonFetchWithSession<SecuritySetting>(
    API_ROOT + "/security_setting",
    { method: "PUT" },
    data,
  );
}
