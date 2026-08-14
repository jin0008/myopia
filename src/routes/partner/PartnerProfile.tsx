import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import {
  clearPartnerToken,
  getPartnerProfile,
  getPartnerToken,
  partnerMe,
  savePartnerProfile,
  uploadPartnerImages,
  uploadPartnerImage,
  searchPartnerPlaces,
  type PartnerMe,
  type PartnerProfileInput,
} from "../../api/partner";
import { normaliseProfileUrls } from "../../api/hospitalProfile";
import {
  KeywordsEditor,
  OpeningHoursEditor,
  TreatmentItemsEditor,
} from "../../components/hospitalCardEditors";
import { BannerImagesEditor, DetailBlocksEditor } from "../../components/HospitalContentEditors";
import { FormTabs } from "../../components/FormTabs";
import { PlacePicker } from "../../components/PlacePicker";
import { PartnerNoticesEditor } from "../../components/PartnerNoticesEditor";
import { DoctorsEditor, cleanDoctors } from "../../components/DoctorsEditor";

const EMPTY: PartnerProfileInput = {
  kakao_place_id: "",
  name: "",
  description: "",
  banner_image_url: "",
  images: [],
  phone: "",
  address: "",
  thumbnail_url: "",
  keywords: [],
  treatment_items: [],
  opening_hours: null,
  doctors: [],
  tagline: "",
  detail_blocks: [],
  booking_url: "",
};

export default function PartnerProfile() {
  const nav = useNavigate();
  const [me, setMe] = useState<PartnerMe | null>(null);
  const [form, setForm] = useState<PartnerProfileInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!getPartnerToken()) {
      nav("/partner/login");
      return;
    }
    Promise.all([partnerMe(), getPartnerProfile()])
      .then(([m, p]) => {
        setMe(m);
        if (p) {
          setForm({
            kakao_place_id: p.kakao_place_id,
            name: p.name,
            description: p.description ?? "",
            banner_image_url: p.banner_image_url ?? "",
            images: p.images ?? [],
            phone: p.phone ?? "",
            address: p.address ?? "",
            thumbnail_url: p.thumbnail_url ?? "",
            keywords: p.keywords ?? [],
            treatment_items: p.treatment_items ?? [],
            opening_hours: p.opening_hours ?? null,
            tagline: p.tagline ?? "",
            detail_blocks: p.detail_blocks ?? [],
            booking_url: p.booking_url ?? "",
          });
        } else {
          setForm((f) => ({ ...f, name: m.hospitalName }));
        }
      })
      .catch(() => {
        clearPartnerToken();
        nav("/partner/login");
      })
      .finally(() => setLoading(false));
  }, [nav]);

  const set = (k: keyof PartnerProfileInput) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setMsg(null);
    setSaving(true);
    try {
      await savePartnerProfile(
        // 이름이 빈 줄과 빈 문자열 photoUrl은 저장할 것이 없고, URL 검증에
        // 걸려 폼 전체가 400이 된다.
        normaliseProfileUrls({ ...form, doctors: cleanDoctors(form.doctors ?? []) }),
      );
      setMsg("저장되었습니다.");
    } catch (e: any) {
      setMsg(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  const canSave = !!form.kakao_place_id.trim() && !!form.name.trim();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>병원 프로필 관리</h1>
        <button
          style={logout}
          onClick={() => {
            clearPartnerToken();
            nav("/partner/login");
          }}
        >
          로그아웃
        </button>
      </div>

      {me && (
        <div style={statusBox(me.status)}>
          {me.status === "approved"
            ? "승인됨 — 저장하면 앱에 바로 노출됩니다."
            : me.status === "rejected"
              ? "승인이 거절되었습니다. 관리자에게 문의해 주세요."
              : "승인 대기 중 — 프로필을 미리 작성해 두면 승인 후 바로 노출됩니다."}
        </div>
      )}

      <div style={card}>
        <FormTabs
          // The save banner sits outside the tabs, so leaving it up made
          // "저장되었습니다" follow the user into a tab they hadn't saved.
          onTabChange={() => setMsg(null)}
          tabs={[
            {
              key: "basic",
              label: "기본 정보",
              content: (
                <>
                  <Field label="병원 찾기 (카카오맵 검색)">
                    <PlacePicker
                      search={searchPartnerPlaces}
                      currentId={form.kakao_place_id}
                      onPick={(pl) =>
                        setForm((s) => ({
                          ...s,
                          kakao_place_id: pl.id,
                          name: pl.name,
                          // Prefilled from Kakao so the clinic doesn't retype
                          // what the app already shows on the list card.
                          phone: pl.phone ?? s.phone,
                          address: pl.roadAddress ?? pl.address ?? s.address,
                        }))
                      }
                    />
                    {form.kakao_place_id ? (
                      <p style={{ color: "#0d7d6f", fontSize: 13, margin: "8px 0 0" }}>
                        선택됨: {form.name} (place id {form.kakao_place_id})
                      </p>
                    ) : (
                      <p style={{ color: "#6b7280", fontSize: 12, margin: "8px 0 0" }}>
                        검색해서 내 병원을 선택하면 병원명·전화·주소가 자동으로 채워집니다.
                      </p>
                    )}
                  </Field>
                  <Field label="병원명">
                    <input value={form.name} onChange={set("name")} style={inp} />
                  </Field>
                  <Field label="한 줄 소개 (리스트 카드·상세 상단)">
                    <input
                      value={form.tagline ?? ""}
                      onChange={set("tagline")}
                      style={inp}
                      placeholder="예: 드림렌즈·아트로핀 전문 소아근시 클리닉"
                      maxLength={120}
                    />
                  </Field>
                  <Field label="키워드 태그 (리스트 카드에 노출)">
                    <KeywordsEditor
                      value={form.keywords ?? []}
                      onChange={(keywords) => setForm((s) => ({ ...s, keywords }))}
                    />
                  </Field>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Field label="전화">
                      <input value={form.phone} onChange={set("phone")} style={inp} />
                    </Field>
                    <Field label="주소">
                      <input value={form.address} onChange={set("address")} style={inp} />
                    </Field>
                  </div>
                  <Field label="예약 링크 (선택)">
                    <input value={form.booking_url ?? ""} onChange={set("booking_url")} style={inp} placeholder="https://" />
                  </Field>
                </>
              ),
            },
            {
              key: "banner",
              label: "배너 사진",
              content: (
                <BannerImagesEditor
                  value={form.images ?? []}
                  onChange={(images) => setForm((s) => ({ ...s, images }))}
                  upload={uploadPartnerImages}
                />
              ),
            },
            {
              key: "detail",
              label: "상세 설명",
              content: (
                <DetailBlocksEditor
                  value={form.detail_blocks ?? []}
                  onChange={(detail_blocks) => setForm((s) => ({ ...s, detail_blocks }))}
                  upload={uploadPartnerImages}
                />
              ),
            },
            {
              key: "doctors",
              label: "의사 정보",
              content: (
                <DoctorsEditor
                  value={form.doctors ?? []}
                  onChange={(doctors) => setForm((s) => ({ ...s, doctors }))}
                  upload={uploadPartnerImage}
                />
              ),
            },
            {
              key: "hours",
              label: "진료시간",
              content: (
                <OpeningHoursEditor
                  value={form.opening_hours ?? null}
                  onChange={(opening_hours) => setForm((s) => ({ ...s, opening_hours }))}
                />
              ),
            },
            {
              key: "treatments",
              label: "치료항목",
              content: (
                <TreatmentItemsEditor
                  value={form.treatment_items ?? []}
                  onChange={(treatment_items) => setForm((s) => ({ ...s, treatment_items }))}
                />
              ),
            },
            {
              key: "notices",
              label: "소식",
              content: <PartnerNoticesEditor />,
            },
          ]}
        />

        {msg && <p style={{ fontSize: 13, color: msg.includes("저장되") ? "#0d7d6f" : "#b3261e" }}>{msg}</p>}
        <button style={{ ...saveBtn, opacity: canSave && !saving ? 1 : 0.5 }} disabled={!canSave || saving} onClick={save}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10, flex: 1 }}>
      <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function statusBox(status: string): CSSProperties {
  const color = status === "approved" ? "#0d7d6f" : status === "rejected" ? "#b3261e" : "#a2610a";
  return {
    background: color + "14",
    color,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    margin: "16px 0 4px",
  };
}

const card: CSSProperties = { border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 12 };
const saveBtn: CSSProperties = {
  padding: "12px 24px",
  borderRadius: 8,
  border: "none",
  background: "#0d47a1",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

const inp: CSSProperties = { width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" };
const logout: CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
