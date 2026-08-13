import { useContext, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  REASON_LABEL,
  TARGET_LABEL,
  listReports,
  resolveReport,
  type ContentReport,
  type ReportStatus,
} from "../api/moderation";

const FILTERS: { key: ReportStatus | "all"; label: string }[] = [
  { key: "pending", label: "처리 대기" },
  { key: "resolved", label: "처리됨" },
  { key: "dismissed", label: "반려됨" },
  { key: "all", label: "전체" },
];

export default function AdminReports() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReportStatus | "all">("pending");

  const listQuery = useQuery({
    queryKey: ["admin", "reports", filter],
    queryFn: () => listReports(filter),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      status,
      hideContent,
    }: {
      id: string;
      status: ReportStatus;
      hideContent?: boolean;
    }) => resolveReport(id, { status, hideContent }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
    onError: (e: any) => alert(e?.message ?? "처리 실패"),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={{ display: "inline-block", marginBottom: 12, color: "#6b7280" }}>
        ← myodoc 관리
      </a>
      <h1>신고 처리</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>
        앱에서 접수된 콘텐츠 신고입니다. "숨김 처리"를 누르면 해당 글·댓글·리뷰가 앱에서 즉시
        보이지 않게 됩니다.
      </p>

      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              ...chip,
              borderColor: filter === f.key ? "#0d47a1" : "#ddd",
              color: filter === f.key ? "#0d47a1" : "#6b7280",
              fontWeight: filter === f.key ? 700 : 500,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <div>Loading…</div>
      ) : listQuery.data && listQuery.data.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>대상</th>
              <th style={th}>내용</th>
              <th style={th}>사유</th>
              <th style={th}>접수일</th>
              <th style={th}>상태</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {listQuery.data.map((r: ContentReport) => (
              <tr key={r.id}>
                <td style={td}>
                  {TARGET_LABEL[r.targetType] ?? r.targetType}
                  {r.contentGone && (
                    <>
                      <br />
                      <span style={{ color: "#9ca3af", fontSize: 11 }}>이미 삭제/숨김</span>
                    </>
                  )}
                </td>
                <td style={{ ...td, maxWidth: 380 }}>
                  <div style={{ color: r.contentGone ? "#9ca3af" : "#111", lineHeight: 1.45 }}>
                    {r.preview ?? <span style={{ color: "#9ca3af" }}>내용 없음</span>}
                  </div>
                  {r.contentUrl && (
                    <a
                      href={r.contentUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, color: "#0d47a1" }}
                    >
                      원문 보기 ↗
                    </a>
                  )}
                  {r.detail && (
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                      신고자 메모: {r.detail}
                    </div>
                  )}
                </td>
                <td style={td}>{REASON_LABEL[r.reason] ?? r.reason}</td>
                <td style={td}>{r.createdAt.slice(0, 10)}</td>
                <td style={td}>
                  <span style={badge(r.status)}>{STATUS_LABEL[r.status]}</span>
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {r.status === "pending" && (
                    <>
                      <PrimaryNagativeButton
                        onClick={() => {
                          if (confirm("이 콘텐츠를 앱에서 숨기고 처리 완료로 표시할까요?")) {
                            resolveMutation.mutate({
                              id: r.id,
                              status: "resolved",
                              hideContent: true,
                            });
                          }
                        }}
                      >
                        숨김 처리
                      </PrimaryNagativeButton>{" "}
                      <PrimaryButton
                        onClick={() =>
                          resolveMutation.mutate({ id: r.id, status: "dismissed" })
                        }
                      >
                        문제 없음
                      </PrimaryButton>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ color: "#9ca3af", marginTop: 16 }}>해당 상태의 신고가 없습니다.</div>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "처리 대기",
  resolved: "처리됨",
  dismissed: "반려됨",
};

function badge(status: ReportStatus): CSSProperties {
  const color =
    status === "resolved" ? "#0d7d6f" : status === "dismissed" ? "#6b7280" : "#a2610a";
  return {
    color,
    background: color + "18",
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 700,
  };
}

const chip: CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
const th: CSSProperties = { textAlign: "left", borderBottom: "2px solid #eee", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8, verticalAlign: "top" };
