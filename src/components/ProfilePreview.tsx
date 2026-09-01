import { useEffect, type CSSProperties, type ReactNode } from "react";

import { categoryLabel, type TreatmentItem } from "../constants/treatmentCategories";

/**
 * 지금 화면에 입력한 내용이 앱에서 어떻게 보이는지.
 *
 * 마이오닥 웹 상세 페이지를 새 탭으로 여는 방법도 있지만 두 가지가 걸린다.
 * 저장한 내용만 보이므로 고치는 중에는 쓸 수 없고, 승인 전(pending) 프로필은
 * 앱이 404 로 막아 아예 열리지 않는다. 파트너가 미리보기를 누르는 시점이
 * 정확히 그 두 경우다.
 *
 * 그래서 폼 상태를 그대로 그린다. 저장하지 않아도, 승인 전이어도 보인다.
 * 앱의 실제 픽셀을 재현하는 것이 목적이 아니라 "무엇이 어디에 들어가는지"를
 * 보여주는 것이 목적이라, 배치와 순서만 맞춘다.
 */
export interface PreviewData {
  name: string;
  tagline?: string | null;
  address?: string;
  phone?: string;
  thumbnail_url?: string | null;
  images?: string[];
  keywords?: string[];
  treatment_categories?: string[];
  treatment_items?: TreatmentItem[];
  doctors?: { name: string; title?: string | null }[] | null;
}

export function ProfilePreview({
  data,
  onClose,
}: {
  data: PreviewData;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // 뒤 화면이 같이 스크롤되면 어느 쪽을 보고 있는지 헷갈린다.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const cats = data.treatment_categories ?? [];
  const items = (data.treatment_items ?? []).filter((it) => it.name?.trim());
  const banner = data.images?.[0] ?? data.thumbnail_url ?? null;

  return (
    <div style={backdrop} onClick={onClose} role="presentation">
      <div
        style={sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="앱 미리보기"
      >
        <div style={sheetHead}>
          <strong style={{ fontSize: 15 }}>앱 미리보기</strong>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="닫기">
            ✕
          </button>
        </div>

        <p style={hint}>
          저장 전 내용입니다. 실제 앱에는 저장 후 반영됩니다.
        </p>

        <div style={scrollArea}>
          {/* ── 치료탭 목록 카드 ───────────────────────────── */}
          <Label>치료탭 목록에서</Label>
          <div style={phone}>
            <div style={card}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={badgeRow}>
                    <Badge tone="grey">의원</Badge>
                    {cats.length > 0 && <Badge tone="blue">{categoryLabel(cats[0])}</Badge>}
                  </div>
                  <div style={cardName}>{data.name || "병원명"}</div>
                  {data.tagline ? <div style={cardSub}>{data.tagline}</div> : null}
                  {data.address ? <div style={cardSub}>{data.address}</div> : null}
                </div>
                {data.thumbnail_url ? (
                  <img src={data.thumbnail_url} alt="" style={thumb} />
                ) : null}
              </div>

              {(data.keywords ?? []).length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {(data.keywords ?? []).slice(0, 4).map((k) => (
                    <span key={k} style={keywordChip}>
                      {k}
                    </span>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div style={itemBox}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{items[0].name}</div>
                  <PriceLine item={items[0]} />
                </div>
              )}
            </div>
          </div>

          {cats.length === 0 && (
            <p style={warnLine}>
              진료하는 치료를 고르지 않아, 부모가 치료를 선택해 검색하면 이 카드가
              나오지 않습니다.
            </p>
          )}

          {/* ── 병원 상세 ─────────────────────────────────── */}
          <Label>병원 상세에서</Label>
          <div style={phone}>
            {banner ? (
              <img src={banner} alt="" style={bannerImg} />
            ) : (
              <div style={{ ...bannerImg, ...bannerEmpty }}>배너 사진 없음</div>
            )}
            <div style={{ padding: "14px 14px 18px" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{data.name || "병원명"}</div>
              {data.tagline ? (
                <div style={{ ...cardSub, marginTop: 4 }}>{data.tagline}</div>
              ) : null}
              {data.phone || data.address ? (
                <div style={{ ...cardSub, marginTop: 8 }}>
                  {[data.address, data.phone].filter(Boolean).join(" · ")}
                </div>
              ) : null}

              {cats.length > 0 && (
                <>
                  <SectionTitle>진료하는 치료</SectionTitle>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {cats.map((k) => (
                      <Badge key={k} tone="blue">
                        {categoryLabel(k)}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              {items.length > 0 && (
                <>
                  <SectionTitle>이벤트</SectionTitle>
                  {items.map((it, i) => (
                    <div key={i} style={itemBox}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {it.category ? (
                          <Badge tone="grey">{categoryLabel(it.category)}</Badge>
                        ) : null}
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{it.name}</span>
                      </div>
                      <PriceLine item={it} />
                      {it.description ? (
                        <div style={{ ...cardSub, marginTop: 4 }}>{it.description}</div>
                      ) : null}
                    </div>
                  ))}
                </>
              )}

              {(data.doctors ?? []).length > 0 && (
                <>
                  <SectionTitle>의료진</SectionTitle>
                  {(data.doctors ?? []).map((d, i) => (
                    <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                      <b>{d.name}</b>
                      {d.title ? <span style={{ color: "#6b7280" }}> · {d.title}</span> : null}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceLine({ item }: { item: TreatmentItem }) {
  if (item.normalPrice == null && item.eventPrice == null) return null;
  const won = (n: number) => n.toLocaleString("ko-KR") + "원";
  return (
    <div style={{ fontSize: 13, marginTop: 3 }}>
      {item.eventPrice != null && item.normalPrice != null ? (
        <>
          <s style={{ color: "#9ca3af" }}>{won(item.normalPrice)}</s>{" "}
          <b style={{ color: "#b3261e" }}>{won(item.eventPrice)}</b>
        </>
      ) : (
        <b>{won((item.eventPrice ?? item.normalPrice)!)}</b>
      )}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div style={sectionLabel}>{children}</div>;
}
function SectionTitle({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px" }}>{children}</div>;
}
function Badge({ children, tone }: { children: ReactNode; tone: "blue" | "grey" }) {
  return (
    <span style={tone === "blue" ? badgeBlue : badgeGrey}>{children}</span>
  );
}

/* ---- styles ------------------------------------------------------------ */

const backdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 100,
};
const sheet: CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  width: "min(440px, 100%)",
  maxHeight: "min(88vh, 900px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const sheetHead: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 16px 10px",
  borderBottom: "1px solid #eef1f5",
};
const closeBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 16,
  cursor: "pointer",
  color: "#6b7280",
  padding: 4,
  lineHeight: 1,
};
const hint: CSSProperties = {
  margin: 0,
  padding: "8px 16px",
  fontSize: 12,
  color: "#6b7280",
  background: "#f8fafc",
};
const scrollArea: CSSProperties = { overflowY: "auto", padding: "14px 16px 20px" };
const sectionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".06em",
  color: "#9ca3af",
  margin: "10px 0 8px",
};
const phone: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
  background: "#f6f8fb",
};
const card: CSSProperties = { background: "#fff", padding: 12, margin: 10, borderRadius: 10 };
const cardName: CSSProperties = { fontSize: 15, fontWeight: 800, marginTop: 5 };
const cardSub: CSSProperties = { fontSize: 13, color: "#6b7280", marginTop: 3 };
const badgeRow: CSSProperties = { display: "flex", gap: 5, flexWrap: "wrap" };
const badgeBlue: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#e8f0fb",
  color: "#1a5fc4",
};
const badgeGrey: CSSProperties = { ...badgeBlue, background: "#f1f3f5", color: "#5a6673" };
const keywordChip: CSSProperties = {
  fontSize: 11.5,
  color: "#6b7280",
  background: "#f6f8fb",
  padding: "3px 8px",
  borderRadius: 6,
};
const thumb: CSSProperties = {
  width: 62,
  height: 62,
  borderRadius: 8,
  objectFit: "cover",
  flexShrink: 0,
};
const itemBox: CSSProperties = {
  background: "#f6f8fb",
  borderRadius: 8,
  padding: "9px 11px",
  marginTop: 8,
};
const bannerImg: CSSProperties = {
  width: "100%",
  height: 150,
  objectFit: "cover",
  display: "block",
};
const bannerEmpty: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#e9edf2",
  color: "#9ca3af",
  fontSize: 13,
};
const warnLine: CSSProperties = {
  fontSize: 12.5,
  color: "#b3261e",
  margin: "8px 2px 0",
};
