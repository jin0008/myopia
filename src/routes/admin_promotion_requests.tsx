import { useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approvePromotionRequest,
  listPromotionRequests,
  rejectPromotionRequest,
  type AdminPromotionRequest,
} from "../api/partnerAccount";

/**
 * 프리미엄 신청 — 허락하거나 거절한다.
 *
 * 승인하면 그 자리에서 광고가 걸린다. 지금은 결제가 없어 승인이 곧 입금
 * 확인 자리다. 결제창이 들어와도 이 화면의 뜻은 바뀌지 않는다.
 *
 * 처리할 것(확인 중)을 먼저 보인다. 이 화면에 오는 이유가 그것뿐이다.
 */
export default function AdminPromotionRequests() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const listQuery = useQuery({
    queryKey: ["admin", "promotion-requests", tab],
    queryFn: () => listPromotionRequests(tab === "pending" ? "pending" : undefined),
  });

  const done = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "promotion-requests"] });
    // 승인하면 광고가 새로 생긴다. 광고 목록을 다시 읽지 않으면 방금
    // 건 것이 안 보여, 승인이 안 된 줄 알고 또 누르게 된다.
    void qc.invalidateQueries({ queryKey: ["admin", "promotions"] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => approvePromotionRequest(id),
    onSuccess: done,
    onError: () => alert("승인하지 못했습니다. 이미 처리된 신청일 수 있습니다."),
  });
  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      rejectPromotionRequest(id, note),
    onSuccess: done,
    onError: () => alert("거절하지 못했습니다. 이미 처리된 신청일 수 있습니다."),
  });

  if (listQuery.isLoading) return <p style={{ padding: 24 }}>불러오는 중…</p>;
  if (listQuery.isError) return <p style={{ padding: 24 }}>불러오지 못했습니다.</p>;

  const rows = listQuery.data ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>프리미엄 신청</h2>
      <p style={hint}>
        승인하면 그 자리에서 광고가 걸립니다. 이미 나가고 있는 곳이면 기간이
        이어 붙습니다.
      </p>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button type="button" style={tabBtn(tab === "pending")} onClick={() => setTab("pending")}>
          확인 중
        </button>
        <button type="button" style={tabBtn(tab === "all")} onClick={() => setTab("all")}>
          전체
        </button>
      </div>

      {rows.length === 0 ? (
        <p style={hint}>
          {tab === "pending" ? "처리할 신청이 없습니다." : "신청이 없습니다."}
        </p>
      ) : (
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>가게</th>
              <th style={th}>신청한 곳</th>
              <th style={th}>기간</th>
              <th style={th}>남긴 말</th>
              <th style={th}>상태</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Row
                key={r.id}
                r={r}
                busy={approve.isPending || reject.isPending}
                onApprove={() => approve.mutate(r.id)}
                onReject={(note) => reject.mutate({ id: r.id, note })}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Row({
  r,
  busy,
  onApprove,
  onReject,
}: {
  r: AdminPromotionRequest;
  busy: boolean;
  onApprove: () => void;
  onReject: (note: string) => void;
}) {
  return (
    <tr>
      <td style={td}>
        <span style={kindTag}>{r.kind === "eye" ? "안과" : "안경점"}</span>{" "}
        <b>{r.facilityName}</b>
        {/* 번호를 그대로 보인다. 승인이 곧 "이 번호가 맞나"를 사람이
            확인하는 자리다 - 여기서 틀린 것을 놓치면 광고가 아무 데도
            안 붙고, 업체는 돈을 내고 안 나가는 것을 나중에 안다. */}
        <div style={mono}>{r.key}</div>
      </td>
      <td style={td}>
        {r.accountName}
        <div style={{ color: "#666", fontSize: 12 }}>
          {r.contactName} · {r.accountEmail}
        </div>
      </td>
      <td style={td}>
        {r.startsOn}부터
        <div style={{ color: "#666", fontSize: 12 }}>{r.months}개월</div>
      </td>
      <td style={{ ...td, color: "#555" }}>{r.note ?? "—"}</td>
      <td style={td}>
        <span style={statusTag(r.status)}>{STATUS_LABEL[r.status]}</span>
        {r.reviewNote && (
          <div style={{ color: "#a33", fontSize: 12, marginTop: 3 }}>{r.reviewNote}</div>
        )}
      </td>
      <td style={td}>
        {r.status === "pending" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              style={{ ...btn, ...btnPrimary }}
              disabled={busy}
              onClick={() => {
                if (confirm(`${r.facilityName} — ${r.months}개월 승인할까요?`)) onApprove();
              }}
            >
              승인
            </button>
            <button
              type="button"
              style={btn}
              disabled={busy}
              onClick={() => {
                // 사유 없이 거절하면 업체는 무엇을 고쳐 다시 내야 할지
                // 알 수 없다. 서버도 빈 사유는 받지 않는다.
                const note = prompt("거절 사유를 적어 주세요. 신청한 업체에게 그대로 보입니다.");
                if (note && note.trim()) onReject(note.trim());
              }}
            >
              거절
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

const STATUS_LABEL: Record<AdminPromotionRequest["status"], string> = {
  pending: "확인 중",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소됨",
};

function statusTag(s: AdminPromotionRequest["status"]): CSSProperties {
  const color =
    s === "approved" ? "#1c7c4a" : s === "rejected" ? "#a33" : s === "pending" ? "#8a6d1f" : "#666";
  const bg =
    s === "approved" ? "#eaf6ef" : s === "rejected" ? "#fbeeee" : s === "pending" ? "#fdf6e3" : "#f1f1f1";
  return { fontSize: 11.5, fontWeight: 700, color, background: bg, borderRadius: 4, padding: "2px 7px" };
}

function tabBtn(active: boolean): CSSProperties {
  return {
    border: active ? 0 : "1px solid #ddd",
    background: active ? "#1a73e8" : "#fff",
    color: active ? "#fff" : "#333",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  };
}

const hint: CSSProperties = { color: "#666", fontSize: 13, margin: "6px 0" };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5 };
const th: CSSProperties = {
  textAlign: "left",
  color: "#8a93a1",
  fontSize: 12,
  borderBottom: "1px solid #eee",
  padding: "8px 6px",
};
const td: CSSProperties = {
  borderBottom: "1px solid #f4f4f4",
  padding: "10px 6px",
  verticalAlign: "top",
};
const mono: CSSProperties = {
  fontFamily: "monospace",
  fontSize: 11.5,
  color: "#8a93a1",
  wordBreak: "break-all",
};
const kindTag: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "#5b6472",
  background: "#eef1f6",
  borderRadius: 4,
  padding: "1px 6px",
};
const btn: CSSProperties = {
  border: "1px solid #ddd",
  background: "#fff",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
const btnPrimary: CSSProperties = { border: 0, background: "#1a73e8", color: "#fff" };
