import type { CSSProperties } from "react";
import { Outlet } from "react-router";

/**
 * 결제가 일어나는 화면(파트너 포털) 하단의 사업자 정보.
 *
 * 전자상거래법상 통신판매업자가 알려야 하는 정보이고, 나이스페이 결제 경로
 * 심사도 이 줄을 본다. 값은 사업자등록증(2026-09-15 발급)에서 옮겼다.
 * public/myodoc/partners.html 하단에도 같은 값이 있으니 함께 고친다.
 *
 * 전화번호와 통신판매신고번호는 아직 받지 못했다. 지어내서 채우면 공개
 * 화면에 거짓 정보가 나가므로 비워 두고, 채워지면 그 줄이 나타난다.
 */
const BUSINESS = {
  name: "주식회사 아이디엑스",
  ceo: "김응수",
  registrationNo: "668-86-03923",
  address: "경기도 광명시 덕안로104번길 17, 비323호(일직동)",
  phone: "",
  email: "myodoc@idx.ai.kr",
  mailOrderNo: "",
};

export function BusinessFooter() {
  const rows: [string, string][] = [
    ["상호", BUSINESS.name],
    ["대표자", BUSINESS.ceo],
    ["사업자등록번호", BUSINESS.registrationNo],
    ["통신판매업신고", BUSINESS.mailOrderNo],
    ["주소", BUSINESS.address],
    ["전화", BUSINESS.phone],
    ["이메일", BUSINESS.email],
  ];
  return (
    <footer style={wrap}>
      <div style={inner}>
        <div style={links}>
          <a href="/myodoc/tos" style={link}>
            이용약관
          </a>
          <a href="/myodoc/privacy" style={{ ...link, fontWeight: 700 }}>
            개인정보처리방침
          </a>
        </div>
        <p style={line}>
          {rows
            .filter(([, v]) => v !== "")
            .map(([k, v]) => `${k} ${v}`)
            .join(" · ")}
        </p>
      </div>
    </footer>
  );
}

/** 파트너 포털 화면들 아래에 사업자 정보를 붙인다. */
export function WithBusinessFooter() {
  return (
    <>
      <Outlet />
      <BusinessFooter />
    </>
  );
}

const wrap: CSSProperties = {
  background: "#f6f7fb",
  borderTop: "1px solid #e8ebf0",
  padding: "20px 16px 28px",
};
const inner: CSSProperties = { maxWidth: 900, margin: "0 auto" };
const links: CSSProperties = { display: "flex", gap: 14, marginBottom: 8 };
const link: CSSProperties = { color: "#4b5563", fontSize: 12.5, textDecoration: "none" };
const line: CSSProperties = {
  margin: 0,
  color: "#8a93a1",
  fontSize: 12,
  lineHeight: 1.8,
  wordBreak: "keep-all",
};
