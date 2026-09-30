import { useContext, type CSSProperties } from "react";

import { UserContext } from "../App";

/**
 * 마이오닥 관리.
 *
 * 아홉 개를 평평하게 늘어놓으면 어느 것이 어느 것의 앞뒤인지 알 수 없다.
 * 특히 파트너 쪽은 순서가 있는 일이다 - 인증해야 업체가 묶이고, 묶여야
 * 프리미엄을 신청하고, 승인해야 광고가 나간다. 그 순서대로 세운다.
 *
 * 파트너 줄에만 한 줄 설명을 붙인다. 나머지는 이름이 곧 하는 일이라
 * 설명이 붙으면 읽을 것만 늘어난다.
 */
const GROUPS: {
  title: string;
  hint?: string;
  items: { href: string; label: string; hint?: string }[];
}[] = [
  {
    title: "파트너 · 광고",
    hint: "업체가 들어와 광고가 나가기까지의 순서대로",
    items: [
      {
        href: "/admin/ad-inquiries",
        label: "광고 문의",
        hint: "랜딩에서 문의를 남긴 곳. 여기서 시작한다",
      },
      {
        href: "/admin/verifications",
        label: "업체 인증 심사",
        hint: "서류를 보고 승인. 업체가 묶이는 유일한 자리다",
      },
      {
        href: "/admin/partner-accounts",
        label: "파트너 계정",
        hint: "병원·안경원 계정, 병원의 치료탭 노출",
      },
      {
        href: "/admin/promotion-requests",
        label: "프리미엄 신청 처리",
        hint: "승인하면 그 기간 동안 광고가 나간다",
      },
      {
        href: "/admin/promotions",
        label: "유료 노출 관리",
        hint: "지금 나가고 있는 광고와 노출·클릭 성적",
      },
    ],
  },
  {
    title: "앱 콘텐츠",
    items: [
      { href: "/admin/hospital-profiles", label: "병원 프로필 관리" },
      { href: "/admin/columns", label: "전문칼럼 관리" },
      { href: "/admin/banners", label: "홈 배너 관리" },
    ],
  },
  {
    title: "운영",
    items: [{ href: "/admin/reports", label: "신고 처리" }],
  },
];

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
      <h1 style={{ marginBottom: 4 }}>마이오닥 관리</h1>

      {GROUPS.map((g) => (
        <section key={g.title} style={{ marginTop: 24 }}>
          <h2 style={h2}>{g.title}</h2>
          {g.hint && <p style={groupHint}>{g.hint}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {g.items.map((it) => (
              <a key={it.href} href={it.href} style={linkRow}>
                <span style={{ fontWeight: 600 }}>{it.label}</span>
                {it.hint && <span style={itemHint}>{it.hint}</span>}
                <span style={arrow}>→</span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const backLink: CSSProperties = {
  display: "inline-block",
  marginBottom: 12,
  color: "#6b7280",
};
const h2: CSSProperties = { fontSize: 15, margin: 0, color: "#374151" };
const groupHint: CSSProperties = {
  color: "#9ca3af",
  fontSize: 12.5,
  margin: "3px 0 0",
};
const linkRow: CSSProperties = {
  display: "grid",
  // 이름과 설명을 한 줄에 두고 화살표를 오른쪽 끝에 붙인다. 설명을 아래로
  // 내리면 줄 높이가 두 배가 되어 목록이 화면을 넘긴다.
  gridTemplateColumns: "minmax(0, auto) 1fr auto",
  alignItems: "baseline",
  gap: 10,
  padding: "13px 16px",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  textDecoration: "none",
  color: "#0d47a1",
  background: "#fff",
};
const itemHint: CSSProperties = { color: "#9ca3af", fontSize: 12.5, fontWeight: 400 };
const arrow: CSSProperties = { color: "#9ca3af" };
