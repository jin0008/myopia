import { useContext, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import {
  cancelPayment,
  listPayments,
  syncPayment,
} from "../api/partnerAccount";

/**
 * 결제 내역.
 *
 * 돈 이야기가 나오면 여기부터 본다. 성공만 보여 주지 않는다 - "결제했는데
 * 광고가 안 나가요"에 답하려면 실패한 줄이 보여야 한다.
 */
export default function AdminPayments() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();
  const [tid, setTid] = useState("");

  const listQuery = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: listPayments,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelPayment(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payments"] }),
    onError: (e: any) => alert(e?.message ?? "취소하지 못했습니다."),
  });

  const syncMutation = useMutation({
    mutationFn: (t: string) => syncPayment(t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "payments"] });
      setTid("");
      alert("결제사에 다시 물어 맞췄습니다.");
    },
    onError: (e: any) => alert(e?.message ?? "맞추지 못했습니다."),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  const rows = listQuery.data ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={backLink}>
        ← 마이오닥 관리
      </a>
      <h1 style={{ marginBottom: 4 }}>결제 내역</h1>
      {/* 웹훅을 놓치는 일은 생긴다 - 배포 중이었거나 네트워크가 끊겼거나.
          그때 DB 를 직접 고치지 않고 여기서 바로잡는다. */}
      <div style={syncBox}>
        <b style={{ fontSize: 13.5 }}>결과가 안 들어왔을 때</b>
        <div style={{ color: "#6b7280", fontSize: 12.5, margin: "2px 0 8px" }}>
          거래번호(tid)를 넣으면 결제사에 다시 물어 상태를 맞춥니다.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={tid}
            onChange={(e) => setTid(e.target.value)}
            placeholder="거래번호 (tid)"
            style={{ ...inp, flex: 1, maxWidth: 360 }}
          />
          <button
            style={btn}
            disabled={tid.trim() === "" || syncMutation.isPending}
            onClick={() => syncMutation.mutate(tid.trim())}
          >
            다시 맞추기
          </button>
        </div>
      </div>

      {listQuery.isLoading ? (
        <div style={{ marginTop: 16 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <p style={desc}>아직 결제가 없습니다.</p>
      ) : (
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>업체</th>
              <th style={th}>금액</th>
              <th style={th}>상태</th>
              <th style={th}>수단</th>
              <th style={th}>일시</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td style={td}>
                  <b>{p.account.hospitalName}</b>
                  <div style={sub}>{p.account.email}</div>
                  <div style={{ ...sub, fontFamily: "monospace" }}>{p.orderId}</div>
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {p.amount.toLocaleString("ko-KR")}원
                </td>
                <td style={td}>
                  <span style={badge(p.status)}>{STATUS[p.status] ?? p.status}</span>
                  {p.failedReason ? <div style={sub}>{p.failedReason}</div> : null}
                </td>
                <td style={td}>{p.payMethod ?? "—"}</td>
                <td style={{ ...td, whiteSpace: "nowrap", color: "#6b7280" }}>
                  {(p.paidAt ?? p.createdAt).slice(0, 16).replace("T", " ")}
                </td>
                <td style={td}>
                  {p.status === "paid" ? (
                    <button
                      style={dangerBtn}
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        const reason = prompt(
                          `${p.account.hospitalName} · ${p.amount.toLocaleString("ko-KR")}원\n\n` +
                            "취소 사유를 적어 주세요. 결제사에 그대로 전달됩니다.",
                          "테스트 결제",
                        );
                        if (reason == null || reason.trim() === "") return;
                        cancelMutation.mutate({ id: p.id, reason: reason.trim() });
                      }}
                    >
                      승인 취소
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** 모르는 값이 오면 그대로 쓴다. */
const STATUS: Record<string, string> = {
  pending: "결제 전",
  paid: "완료",
  failed: "실패",
  canceled: "취소됨",
};

const backLink: CSSProperties = {
  display: "inline-block",
  marginBottom: 12,
  color: "#6b7280",
};
const desc: CSSProperties = {
  color: "#555",
  fontSize: 13.5,
  lineHeight: 1.7,
  margin: "4px 0 12px",
};
const syncBox: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 14,
  background: "#fff",
  marginBottom: 16,
};
const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  marginTop: 8,
};
const th: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 10px",
  fontSize: 13,
  color: "#6b7280",
  whiteSpace: "nowrap",
};
const td: CSSProperties = {
  borderBottom: "1px solid #f1f3f5",
  padding: "10px",
  fontSize: 14,
  verticalAlign: "top",
};
const sub: CSSProperties = { color: "#9ca3af", fontSize: 12, marginTop: 2 };
const inp: CSSProperties = {
  padding: 9,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
};
const btn: CSSProperties = {
  border: "1px solid #ddd",
  background: "#fff",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};
const dangerBtn: CSSProperties = {
  ...btn,
  border: "1px solid #e6b4ae",
  color: "#b3261e",
};
function badge(status: string): CSSProperties {
  const color =
    status === "paid"
      ? "#0d7d6f"
      : status === "failed"
        ? "#b3261e"
        : status === "canceled"
          ? "#6b7280"
          : "#a2610a";
  const bg =
    status === "paid"
      ? "#e7f5f3"
      : status === "failed"
        ? "#fdecea"
        : status === "canceled"
          ? "#f1f3f5"
          : "#fdf4e3";
  return {
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 6,
    padding: "2px 8px",
    color,
    background: bg,
    whiteSpace: "nowrap",
  };
}
