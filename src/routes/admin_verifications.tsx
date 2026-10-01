import { useContext, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getHospitalList, type HospitalListItem } from "../api/hospital";

import {
  downloadVerificationDoc,
  listVerifications,
  reviewVerification,
  type AdminVerification,
} from "../api/partnerAccount";
import { UserContext } from "../App";

/**
 * 업체 인증 심사.
 *
 * 하는 일은 하나다 — 서류의 상호·주소가 신청자가 고른 명부의 가게와
 * 같은지 본다. 같으면 승인, 다르면 사유를 적어 반려.
 *
 * 승인하면 그 자리에서 계정과 업체가 묶인다. 승인과 연결이 따로면
 * 운영자가 승인만 하고 손을 떼고, 파트너는 승인된 줄 알고 들어와
 * 프리미엄 화면에서 막힌다.
 */
export default function AdminVerifications() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();
  const [note, setNote] = useState<Record<string, string>>({});
  // 승인할 때 함께 정한다. 비워 두면 "아이로그 안 씀"이다.
  const [eyelog, setEyelog] = useState<Record<string, string>>({});

  const hospitalsQuery = useQuery<HospitalListItem[]>({
    queryKey: ["hospitalList"],
    queryFn: getHospitalList,
  });

  const listQuery = useQuery({
    queryKey: ["admin", "verifications"],
    queryFn: listVerifications,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      action,
      reviewNote,
      eyelogHospitalId,
    }: {
      id: string;
      action: "approve" | "reject";
      reviewNote?: string;
      eyelogHospitalId?: string | null;
    }) => reviewVerification(id, action, reviewNote, eyelogHospitalId),
    onSuccess: () => {
      // 승인은 계정의 연결까지 바꾼다. 계정 목록도 같이 새로 받지 않으면
      // 옆 화면에는 아직 "연결 없음"으로 남는다.
      qc.invalidateQueries({ queryKey: ["admin", "verifications"] });
      qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] });
      qc.invalidateQueries({ queryKey: ["admin", "hospitalProfiles"] });
    },
    onError: (e: any) => alert(e?.message ?? "처리하지 못했습니다."),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  const rows = listQuery.data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");

  return (
    <div style={{ padding: 24, maxWidth: 940, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={backLink}>
        ← 마이오닥 관리
      </a>
      <h1 style={{ margin: "0 0 4px" }}>업체 인증 심사</h1>
      <p style={desc}>
        신청자가 올린 서류의 <b>상호와 주소</b>가 신청자가 고른 명부의 업체와
        같은지 봅니다. 같으면 승인하고, 그 순간 계정과 업체가 묶입니다 —
        따로 연결하실 필요가 없습니다.
        <br />
        서류에는 사업자등록번호와 대표자 성명이 들어 있습니다. 확인이 끝나면
        받아 둔 파일은 지워 주세요.
      </p>

      {listQuery.isLoading ? (
        <div>Loading…</div>
      ) : (
        <>
          <h2 style={h2}>기다리는 신청 {pending.length}건</h2>
          {pending.length === 0 ? (
            <p style={desc}>처리할 신청이 없습니다.</p>
          ) : (
            pending.map((v) => (
              <Card
                key={v.id}
                v={v}
                note={note[v.id] ?? ""}
                onNote={(t) => setNote((p) => ({ ...p, [v.id]: t }))}
                hospitals={hospitalsQuery.data ?? []}
                eyelog={eyelog[v.id] ?? ""}
                onEyelog={(t) => setEyelog((p) => ({ ...p, [v.id]: t }))}
                busy={reviewMutation.isPending}
                onReview={(action) =>
                  reviewMutation.mutate({
                    id: v.id,
                    action,
                    reviewNote: note[v.id],
                    eyelogHospitalId: eyelog[v.id] || null,
                  })
                }
              />
            ))
          )}

          <h2 style={h2}>처리된 신청</h2>
          {done.length === 0 ? (
            <p style={desc}>아직 없습니다.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={th}>업체</th>
                  <th style={th}>계정</th>
                  <th style={th}>결과</th>
                  <th style={th}>사유</th>
                  <th style={th}>처리일</th>
                </tr>
              </thead>
              <tbody>
                {done.map((v) => (
                  <tr key={v.id}>
                    <td style={td}>{v.facilityName}</td>
                    <td style={td}>{v.account.hospitalName}</td>
                    <td style={td}>
                      <span style={badge(v.status)}>
                        {v.status === "approved" ? "승인" : "반려"}
                      </span>
                    </td>
                    <td style={{ ...td, color: "#666", fontSize: 13 }}>
                      {v.reviewNote ?? "—"}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap", color: "#666" }}>
                      {v.reviewedAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

function Card({
  v,
  note,
  onNote,
  hospitals,
  eyelog,
  onEyelog,
  busy,
  onReview,
}: {
  v: AdminVerification;
  note: string;
  onNote: (t: string) => void;
  hospitals: HospitalListItem[];
  eyelog: string;
  onEyelog: (t: string) => void;
  busy: boolean;
  onReview: (action: "approve" | "reject") => void;
}) {
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <span style={kindTag}>{v.kind === "eye" ? "안과" : "안경원"}</span>{" "}
          <b style={{ fontSize: 16 }}>{v.facilityName}</b>
          <div style={{ color: "#8a93a1", fontSize: 12, marginTop: 2 }}>{v.key}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 13, color: "#555" }}>
          <div>
            <b>{v.account.hospitalName}</b>
          </div>
          <div>
            {v.account.contactName} · {v.account.email}
          </div>
          <div style={{ color: "#8a93a1" }}>{v.createdAt.slice(0, 10)} 신청</div>
        </div>
      </div>

      {/* 가입할 때 적은 상호와 고른 업체가 다르면 먼저 눈에 띄어야 한다.
          같은 곳인데 표기만 다를 수도 있어 막지는 않고 표시만 한다. */}
      {v.account.hospitalName.replace(/\s/g, "") !==
        v.facilityName.replace(/\s/g, "") && (
        <div style={mismatch}>
          가입할 때 적은 상호(<b>{v.account.hospitalName}</b>)와 고른 업체 이름이
          다릅니다. 서류로 같은 곳인지 확인해 주세요.
        </div>
      )}

      {v.note && (
        <div style={{ marginTop: 10, fontSize: 13.5 }}>
          <b>남긴 말</b>
          <div style={{ color: "#444", marginTop: 2 }}>{v.note}</div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <b style={{ fontSize: 13.5 }}>제출 서류 {v.docFiles.length}건</b>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
          {v.docFiles.map((f) => (
            <button key={f} style={docBtn} onClick={() => downloadVerificationDoc(v.id, f)}>
              내려받기 ({f.slice(-4)})
            </button>
          ))}
        </div>
      </div>

      {/* 아이로그 연동은 서류를 보는 이 자리에서 함께 정한다. 예전에는
          "병원 프로필 관리 → 관리자 설정"에 따로 있었는데, 떨어져 있어
          운영자가 빼먹었고 병원은 후기가 왜 안 되는지 알 수 없었다.
          안경원에는 임상 병원이라는 것이 없다. */}
      {v.kind === "eye" && (
        <div style={{ marginTop: 12 }}>
          <b style={{ fontSize: 13.5 }}>마이오피아 연동</b>
          <div style={{ color: "#6b7280", fontSize: 12.5, margin: "2px 0 6px" }}>
            고르면 앱에서 병원 이름 옆에 체크가 붙고, 이 병원 환자의 보호자가
            후기를 쓸 수 있습니다.
            {v.eyelogCode ? (
              <>
                {" "}
                신청자가 적은 병원 코드: <b>{v.eyelogCode}</b>
              </>
            ) : (
              " 신청자는 사용한다고 적지 않았습니다."
            )}
          </div>
          <select
            value={eyelog}
            onChange={(e) => onEyelog(e.target.value)}
            style={{ ...docBtn, padding: "7px 10px", minWidth: 260 }}
          >
            <option value="">연동 안 함</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <textarea
        style={noteInput}
        placeholder="반려 사유 (반려할 때는 반드시 적어 주세요. 파트너에게 그대로 보입니다)"
        value={note}
        onChange={(e) => onNote(e.target.value)}
        maxLength={500}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button style={approveBtn} disabled={busy} onClick={() => onReview("approve")}>
          승인 · 업체 연결
        </button>
        <button style={rejectBtn} disabled={busy} onClick={() => onReview("reject")}>
          반려
        </button>
      </div>
    </div>
  );
}

const backLink: CSSProperties = {
  display: "inline-block",
  marginBottom: 12,
  color: "#6b7280",
};
const desc: CSSProperties = { color: "#555", fontSize: 13.5, lineHeight: 1.7, margin: "8px 0" };
const h2: CSSProperties = { fontSize: 16, margin: "24px 0 4px" };
const card: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginTop: 12,
  background: "#fff",
};
const kindTag: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "#5b6472",
  background: "#eef1f6",
  borderRadius: 4,
  padding: "2px 7px",
};
const mismatch: CSSProperties = {
  marginTop: 10,
  border: "1px solid #f0d9a8",
  background: "#fdf6e3",
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 13,
  color: "#6b5613",
};
const docBtn: CSSProperties = {
  border: "1px solid #ddd",
  background: "#fff",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
};
const noteInput: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 56,
  margin: "12px 0 10px",
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 13.5,
};
const approveBtn: CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "#0d47a1",
  color: "#fff",
  padding: "9px 18px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
const rejectBtn: CSSProperties = {
  ...approveBtn,
  background: "#fff",
  color: "#b3261e",
  border: "1px solid #e6b4ae",
};
const th: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 10px",
  fontSize: 13,
  color: "#6b7280",
};
const td: CSSProperties = {
  borderBottom: "1px solid #f1f3f5",
  padding: "8px 10px",
  fontSize: 14,
};
function badge(status: string): CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 6,
    padding: "2px 8px",
    color: status === "approved" ? "#0d7d6f" : "#b3261e",
    background: status === "approved" ? "#e7f5f3" : "#fdecea",
  };
}
