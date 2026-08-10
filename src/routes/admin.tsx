import { useContext, type CSSProperties } from "react";

import { UserContext } from "../App";

/** Landing page: pick which system to administer, then drill into its own
 * page. Previously this route held every management section (hospitals,
 * studies, alert thresholds, audit logs, AND the myodoc-content links) in
 * one long page — split into /admin/myopia and /admin/myodoc so each stays
 * scannable as more sections get added. */
export default function Admin() {
  const { user } = useContext(UserContext);

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>관리자 홈</h1>
      <p style={{ color: "#6b7280", marginTop: -8 }}>관리할 영역을 선택하세요.</p>
      <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
        <a href="/admin/myopia" style={cardLink}>
          <div style={cardTitle}>myopia 관리</div>
          <div style={cardDesc}>병원 · 회원 · 연구 · 알림 기준 · 감사 로그</div>
        </a>
        <a href="/admin/myodoc" style={cardLink}>
          <div style={cardTitle}>myodoc 관리</div>
          <div style={cardDesc}>전문칼럼 · 홈 배너</div>
        </a>
      </div>
    </div>
  );
}

const cardLink: CSSProperties = {
  flex: "1 1 260px",
  display: "block",
  padding: 24,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  textDecoration: "none",
  color: "#111827",
  background: "#fff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};
const cardTitle: CSSProperties = { fontSize: 18, fontWeight: 800, marginBottom: 6 };
const cardDesc: CSSProperties = { fontSize: 13, color: "#6b7280" };
