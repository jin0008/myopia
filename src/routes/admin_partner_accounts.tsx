import { useContext, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  listPartnerAccounts,
  setPartnerAccountStatus,
  type PartnerAccountStatus,
} from "../api/partnerAccount";

export default function AdminPartnerAccounts() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["admin", "partnerAccounts"],
    queryFn: listPartnerAccounts,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PartnerAccountStatus }) =>
      setPartnerAccountStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] }),
    onError: (e: any) => alert(e?.message ?? "변경 실패"),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={{ display: "inline-block", marginBottom: 12, color: "#6b7280" }}>
        ← myodoc 관리
      </a>
      <h1>병원 파트너 계정 승인</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>
        가입한 병원 계정을 승인하면 해당 병원 프로필이 앱에 노출됩니다.
        ⚠️ 승인 전, "신청 병원명"과 "claim한 병원"이 실제로 일치하는지 꼭
        확인하세요 (아무 병원이나 claim 가능하므로 사칭 방지의 핵심 단계).
      </p>

      {listQuery.isLoading ? (
        <div>Loading…</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th style={th}>신청 병원명</th>
              <th style={th}>claim한 병원 (place id)</th>
              <th style={th}>담당자</th>
              <th style={th}>이메일</th>
              <th style={th}>가입일</th>
              <th style={th}>상태</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {listQuery.data?.map((a) => (
              <tr key={a.id}>
                <td style={td}>{a.hospitalName}</td>
                <td style={td}>
                  {a.claimedName ? (
                    <>
                      {a.claimedName}
                      <br />
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>{a.claimedPlaceId}</span>
                    </>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>미작성</span>
                  )}
                </td>
                <td style={td}>{a.contactName}</td>
                <td style={td}>{a.email}</td>
                <td style={td}>{a.createdAt.slice(0, 10)}</td>
                <td style={td}>
                  <span style={badge(a.status)}>{STATUS_LABEL[a.status]}</span>
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {a.status !== "approved" && (
                    <PrimaryButton
                      onClick={() => statusMutation.mutate({ id: a.id, status: "approved" })}
                    >
                      승인
                    </PrimaryButton>
                  )}{" "}
                  {a.status !== "rejected" && (
                    <PrimaryNagativeButton
                      onClick={() => statusMutation.mutate({ id: a.id, status: "rejected" })}
                    >
                      거절
                    </PrimaryNagativeButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<PartnerAccountStatus, string> = {
  pending: "승인 대기",
  approved: "승인됨",
  rejected: "거절됨",
};

function badge(status: PartnerAccountStatus): CSSProperties {
  const color =
    status === "approved" ? "#0d7d6f" : status === "rejected" ? "#b3261e" : "#a2610a";
  return {
    color,
    background: color + "18",
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 700,
  };
}

const th: CSSProperties = { textAlign: "left", borderBottom: "2px solid #eee", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8 };
