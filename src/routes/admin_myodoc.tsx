import { useContext, type CSSProperties } from "react";

import { UserContext } from "../App";

export default function AdminMyodoc() {
  const { user } = useContext(UserContext);

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <a href="/admin" style={backLink}>
        ← 관리자 홈
      </a>
      <h1>myodoc 관리</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        <a href="/admin/columns" style={linkRow}>
          전문칼럼 관리 →
        </a>
        <a href="/admin/banners" style={linkRow}>
          홈 배너 관리 →
        </a>
        <a href="/admin/hospital-profiles" style={linkRow}>
          병원 프로필 관리 →
        </a>
        <a href="/admin/partner-accounts" style={linkRow}>
          병원 파트너 계정 승인 →
        </a>
        <a href="/admin/reports" style={linkRow}>
          신고 처리 →
        </a>
      </div>
    </div>
  );
}

const backLink: CSSProperties = { display: "inline-block", marginBottom: 12, color: "#6b7280" };
const linkRow: CSSProperties = {
  display: "block",
  padding: "14px 16px",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  textDecoration: "none",
  color: "#0d47a1",
  fontWeight: 600,
  background: "#fff",
};
