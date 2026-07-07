import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { getAuditLogs, type AuditAction } from "../api/audit_log";
import { PrimaryButton } from "../components/button";
import { TextInput } from "../components/input";

// All study-related audit tables, pulled together via the comma-separated
// table_name filter (backend supports `in`).
const STUDY_TABLES = "study,study_hospital,study_enrollment,study_visit";
const PAGE_SIZE = 20;
const ACTIONS: AuditAction[] = ["CREATE", "UPDATE", "DELETE", "READ", "EXPORT"];

const TABLE_LABEL: Record<string, string> = {
  study: "연구",
  study_hospital: "참여병원",
  study_enrollment: "환자등록",
  study_visit: "방문데이터",
};

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  padding: 20px;
`;

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const Scroll = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  & th,
  & td {
    padding: 8px 10px;
    text-align: left;
    white-space: nowrap;
  }
  & thead th {
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
  }
  & tbody td {
    border-bottom: 1px solid #f0f0f0;
    color: #374151;
  }
`;

const Foot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

const fmt = (iso: string) => new Date(iso).toLocaleString();

export default function StudyAuditLog() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<AuditAction | "">("");

  const query = useQuery({
    queryKey: ["study-audit", { page, action }],
    queryFn: () =>
      getAuditLogs(
        { table_name: STUDY_TABLES, action: action || undefined },
        page,
        PAGE_SIZE,
      ),
    placeholderData: keepPreviousData,
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <Head>
        <h2 style={{ margin: 0 }}>스터디 로그</h2>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Action
          <TextInput
            as="select"
            value={action}
            onChange={(e) => {
              setAction(e.target.value as AuditAction | "");
              setPage(1);
            }}
          >
            <option value="">All</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </TextInput>
        </label>
      </Head>

      <Scroll>
        <Table>
          <thead>
            <tr>
              <th>시간</th>
              <th>행위자</th>
              <th>구분</th>
              <th>작업</th>
              <th>대상 ID</th>
              <th>변경 필드</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.rows.map((r) => (
              <tr key={r.id}>
                <td>{fmt(r.created_at)}</td>
                <td>{r.actor_name ?? r.actor?.email ?? "-"}</td>
                <td>{TABLE_LABEL[r.table_name] ?? r.table_name}</td>
                <td>{r.action}</td>
                <td title={r.record_id ?? ""}>
                  {r.record_id ? r.record_id.slice(0, 8) : "-"}
                </td>
                <td>{r.changed_fields.join(", ") || "-"}</td>
              </tr>
            ))}
            {query.isError && (
              <tr>
                <td colSpan={6}>불러오기에 실패했습니다.</td>
              </tr>
            )}
            {query.data && query.data.rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "#6b7280" }}>
                  스터디 로그가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Scroll>

      <Foot>
        <span style={{ color: "#6b7280" }}>
          {page} / {totalPages} · 총 {total}건
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <PrimaryButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            이전
          </PrimaryButton>
          <PrimaryButton
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </PrimaryButton>
        </div>
      </Foot>
    </Card>
  );
}
