import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import styled from "styled-components";
import {
  getAuditLogs,
  downloadAuditLogExport,
  AuditLogFilters,
  AuditAction,
  AuditStatus,
} from "../api/audit_log";
import { PrimaryButton, OutlinedButton } from "../components/button";
import { TextInput } from "../components/input";

const PAGE_SIZE = 50;

const ACTIONS: AuditAction[] = ["CREATE", "UPDATE", "DELETE", "READ", "EXPORT"];
const STATUSES: AuditStatus[] = ["SUCCESS", "FAILURE", "REVERTED"];

const ACTION_COLORS: Record<AuditAction, string> = {
  CREATE: "#16a34a",
  UPDATE: "#d97706",
  DELETE: "#dc2626",
  READ: "#64748b",
  EXPORT: "#7c3aed",
};

const STATUS_COLORS: Record<AuditStatus, string> = {
  SUCCESS: "#16a34a",
  FAILURE: "#dc2626",
  REVERTED: "#64748b",
};

const Section = styled.div`
  width: 100%;
`;

const SectionTitle = styled.h2`
  margin: 0 0 16px 0;
`;

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  gap: 4px;
`;

const Spacer = styled.div`
  flex: 1;
`;

const TableScroll = styled.div`
  overflow-x: auto;
`;

const LogTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  & th,
  & td {
    padding: 10px 12px;
    text-align: left;
    white-space: nowrap;
  }
  & thead th {
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
  }
  & tbody tr:nth-child(even) {
    background: #fafafa;
  }
  & tbody tr:hover {
    background: #f0f9ff;
  }
  & tbody td {
    border-bottom: 1px solid #f0f0f0;
    color: #374151;
  }
`;

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: ${(p) => p.$color};
  background: ${(p) => p.$color}1a;
`;

const Mono = styled.span`
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: #6b7280;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  vertical-align: bottom;
`;

const Pager = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
`;

const Empty = styled.td`
  text-align: center;
  color: #9ca3af;
  padding: 32px 12px;
`;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function AdminAuditLog() {
  // Draft filters (the form) vs applied filters (what the query runs with).
  const [draft, setDraft] = useState<AuditLogFilters>({});
  const [applied, setApplied] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const query = useQuery({
    queryKey: ["audit_log", applied, page],
    queryFn: () => getAuditLogs(applied, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const updateDraft = (patch: Partial<AuditLogFilters>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const applyFilters = () => {
    setPage(1);
    setApplied(draft);
  };

  const handleDownload = async (format: "csv" | "xlsx") => {
    try {
      setDownloading(true);
      await downloadAuditLogExport(applied, format);
    } catch (error) {
      alert("Failed to download audit log");
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Section>
      <SectionTitle>Activity Log</SectionTitle>

      <Card>
        <FilterRow>
          <Field>
            From
            <TextInput
              type="date"
              value={draft.from ?? ""}
              onChange={(e) => updateDraft({ from: e.target.value })}
            />
          </Field>
          <Field>
            To
            <TextInput
              type="date"
              value={draft.to ?? ""}
              onChange={(e) => updateDraft({ to: e.target.value })}
            />
          </Field>
          <Field>
            Action
            <TextInput
              as="select"
              value={draft.action ?? ""}
              onChange={(e) =>
                updateDraft({
                  action: (e.target.value || undefined) as AuditAction,
                })
              }
            >
              <option value="">All</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </TextInput>
          </Field>
          <Field>
            Status
            <TextInput
              as="select"
              value={draft.status ?? ""}
              onChange={(e) =>
                updateDraft({
                  status: (e.target.value || undefined) as AuditStatus,
                })
              }
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </TextInput>
          </Field>
          <PrimaryButton onClick={applyFilters}>Search</PrimaryButton>
          <Spacer />
          <OutlinedButton
            disabled={downloading}
            onClick={() => handleDownload("csv")}
          >
            Download CSV
          </OutlinedButton>
          <OutlinedButton
            disabled={downloading}
            onClick={() => handleDownload("xlsx")}
          >
            Download Excel
          </OutlinedButton>
        </FilterRow>

        <TableScroll>
          <LogTable>
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Status</th>
                <th>Table</th>
                <th>Patient</th>
                <th>Changed fields</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatTime(r.created_at)}</td>
                  <td>{r.actor_name ?? r.actor?.email ?? "-"}</td>
                  <td>{r.actor_role ?? "-"}</td>
                  <td>
                    <Badge $color={ACTION_COLORS[r.action]}>{r.action}</Badge>
                  </td>
                  <td>
                    <Badge $color={STATUS_COLORS[r.status]}>{r.status}</Badge>
                  </td>
                  <td>{r.table_name}</td>
                  <td>
                    {r.patient_id ? (
                      <Mono title={r.patient_id}>{r.patient_id}</Mono>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{r.changed_fields.join(", ") || "-"}</td>
                  <td>
                    <Mono title={r.ip_address ?? ""}>
                      {r.ip_address ?? "-"}
                    </Mono>
                  </td>
                </tr>
              ))}
              {query.isError && (
                <tr>
                  <Empty colSpan={9}>Error loading logs.</Empty>
                </tr>
              )}
              {query.data && query.data.rows.length === 0 && (
                <tr>
                  <Empty colSpan={9}>No logs found.</Empty>
                </tr>
              )}
            </tbody>
          </LogTable>
        </TableScroll>

        <Pager>
          <OutlinedButton
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </OutlinedButton>
          <span>
            {page} / {totalPages} · {total} total
          </span>
          <OutlinedButton
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </OutlinedButton>
        </Pager>
      </Card>
    </Section>
  );
}
