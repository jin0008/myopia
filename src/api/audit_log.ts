import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "READ" | "EXPORT";
export type AuditStatus = "SUCCESS" | "FAILURE" | "REVERTED";

export interface AuditLogFilters {
  from?: string;
  to?: string;
  action?: AuditAction;
  status?: AuditStatus;
  actor_id?: string;
  patient_id?: string;
  table_name?: string;
}

export interface AuditLogRow {
  id: string;
  table_name: string;
  record_id: string | null;
  action: AuditAction;
  status: AuditStatus;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  actor_hospital_id: string | null;
  patient_id: string | null;
  hospital_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  changed_fields: string[];
  error_message: string | null;
  created_at: string;
  actor: { email: string | null } | null;
}

export interface AuditLogPage {
  page: number;
  pageSize: number;
  total: number;
  rows: AuditLogRow[];
}

function toQuery(
  filters: AuditLogFilters,
  extra: Record<string, string | number> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...extra })) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function getAuditLogs(
  filters: AuditLogFilters,
  page: number,
  pageSize: number,
): Promise<AuditLogPage> {
  const query = toQuery(filters, { page, pageSize });
  return jsonFetchWithSession<AuditLogPage>(
    API_ROOT + "/audit_log?" + query,
  );
}

// Downloads the filtered audit logs via the backend export endpoint. Using the
// server endpoint (instead of building the file client-side) ensures the export
// itself is recorded as an audit_log EXPORT action.
export async function downloadAuditLogExport(
  filters: AuditLogFilters,
  format: "csv" | "xlsx",
): Promise<void> {
  const session_key = localStorage.getItem("session_key");
  const query = toQuery(filters, { format });
  const result = await fetch(API_ROOT + "/audit_log/export?" + query, {
    headers: { Authorization: `Bearer ${session_key}` },
  });
  if (!result.ok) {
    throw new Error(`Export failed (${result.status})`);
  }

  const blob = await result.blob();
  const disposition = result.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = match?.[1] ?? `audit_log_${stamp}.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
