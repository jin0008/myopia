import { useContext, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";

import { UserContext } from "../App";
import { listAdInquiries } from "../api/adInquiry";
import { listReports } from "../api/moderation";
import { listVerifications } from "../api/partnerAccount";

/**
 * 마이오닥 관리.
 *
 * 아홉 개를 평평하게 늘어놓으면 어느 것이 어느 것의 앞뒤인지 알 수 없다.
 * 파트너 쪽은 순서가 있는 일이라(인증해야 업체가 묶이고, 결제하면 광고가
 * 나간다) 그 순서대로 세운다.
 *
 * 처리할 것이 쌓이는 메뉴(광고 문의·업체 인증·신고)에는 건수를 붙인다.
 * 운영자는 숫자가 있는 줄만 들어가면 된다.
 *
 * 옆에 붙이는 말은 그 화면에서 할 수 있는 일만 적는다. 왜 그 순서인지는
 * 순서 자체가 말한다 - 거기에 설명을 덧붙이면 읽을 것만 늘어난다.
 */
const GROUPS: {
  title: string;
  hint?: string;
  items: { href: string; label: string; hint?: string; badge?: BadgeKey }[];
}[] = [
  {
    title: "파트너 · 광고",
    items: [
      {
        href: "/admin/ad-inquiries",
        label: "광고 문의",
        hint: "문의 접수 목록",
        badge: "inquiries",
      },
      {
        href: "/admin/verifications",
        label: "업체 인증 심사",
        hint: "제출 서류 확인 · 승인하면 결제·치료탭 노출이 열림",
        badge: "verifications",
      },
      {
        href: "/admin/partner-accounts",
        label: "파트너 계정",
        hint: "계정 목록 · 프로필 내리기 · 계정 삭제",
      },
      {
        href: "/admin/promotions",
        label: "유료 노출 관리",
        hint: "게재 중인 광고 · 노출/클릭 수",
      },
      {
        href: "/admin/payments",
        label: "결제 내역",
        hint: "구독 결제 · 승인 취소",
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
    items: [
      { href: "/admin/reports", label: "신고 처리", badge: "reports" },
      { href: "/admin/app-stats", label: "가입 현황", hint: "앱 보호자 가입 · 자녀 · 이용" },
    ],
  },
];

type BadgeKey = "inquiries" | "verifications" | "reports";

export default function AdminMyodoc() {
  const { user } = useContext(UserContext);
  const admin = user?.is_site_admin === true;
  // 각 화면이 쓰는 목록을 같은 키로 불러 센다. 캐시를 같이 써서, 그 화면에서
  // 처리하고 돌아오면 숫자가 바로 준다. 하나가 실패해도 메뉴는 뜬다 - 배지만
  // 안 보인다.
  const inquiries = useQuery({
    queryKey: ["admin", "ad-inquiries", "new"],
    queryFn: () => listAdInquiries("new"),
    enabled: admin,
  });
  const verifications = useQuery({
    queryKey: ["admin", "verifications"],
    queryFn: listVerifications,
    enabled: admin,
  });
  const reports = useQuery({
    queryKey: ["admin", "reports", "pending"],
    queryFn: () => listReports("pending"),
    enabled: admin,
  });
  const counts: Record<BadgeKey, { n: number; label: string }> = {
    inquiries: { n: inquiries.data?.inquiries.length ?? 0, label: "새 문의" },
    verifications: {
      n: verifications.data?.filter((v) => v.status === "pending").length ?? 0,
      label: "대기",
    },
    reports: { n: reports.data?.length ?? 0, label: "미처리" },
  };

  if (!admin) {
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
                <span style={{ fontWeight: 600 }}>
                  {it.label}
                  {it.badge && counts[it.badge].n > 0 && (
                    <span style={badgeStyle}>
                      {counts[it.badge].label} {counts[it.badge].n}
                    </span>
                  )}
                </span>
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
const badgeStyle: CSSProperties = {
  marginLeft: 8,
  fontSize: 12,
  fontWeight: 700,
  color: "#fff",
  background: "#e5484d",
  borderRadius: 999,
  padding: "2px 8px",
  verticalAlign: "1px",
};
