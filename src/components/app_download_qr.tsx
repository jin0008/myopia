import { QRCodeSVG } from "qrcode.react";
import theme from "../theme";

// 기기별 스토어로 보내는 주소 하나(백엔드 GET /app). 아이폰·안드로이드 QR 을
// 따로 두면 고르다 틀리므로 하나만 둔다. 홈과 환자 차트가 같이 쓴다.
export const APP_DOWNLOAD_URL = "https://myopiamanage.org/api/app";

export function AppDownloadQr({
  title,
  description,
  size,
}: {
  title: string;
  description: string;
  size: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <QRCodeSVG
        value={APP_DOWNLOAD_URL}
        size={size}
        aria-label="마이오닥 앱 다운로드 QR"
        style={{ flexShrink: 0 }}
      />
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: 600, color: theme.textPrimary, marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: "0.85rem", lineHeight: 1.5, color: theme.textSecondary }}>
          {description}
        </div>
      </div>
    </div>
  );
}
