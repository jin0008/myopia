import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export interface AlertRecipient {
  id: string;
  hospital_id: string;
  email: string;
  created_at: string;
}

export function getAlertRecipients(): Promise<AlertRecipient[]> {
  return jsonFetchWithSession<AlertRecipient[]>(API_ROOT + "/alert_recipient");
}

export function addAlertRecipient(email: string): Promise<AlertRecipient> {
  return jsonFetchWithSession<AlertRecipient>(
    API_ROOT + "/alert_recipient",
    { method: "POST" },
    { email },
  );
}

export function deleteAlertRecipient(id: string): Promise<void> {
  return jsonFetchWithSession(
    API_ROOT + "/alert_recipient/" + id,
    { method: "DELETE" },
    undefined,
    false,
  );
}
