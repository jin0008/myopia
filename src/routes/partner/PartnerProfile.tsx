import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import {
  clearPartnerToken,
  getPartnerProfile,
  getPartnerToken,
  partnerMe,
  savePartnerProfile,
  uploadPartnerImage,
  uploadPartnerImages,
  type PartnerMe,
  type PartnerProfileInput,
} from "../../api/partner";
import {
  KeywordsEditor,
  OpeningHoursEditor,
  TreatmentItemsEditor,
} from "../../components/hospitalCardEditors";
import { BannerImagesEditor, DetailBlocksEditor } from "../../components/HospitalContentEditors";
import { FormTabs } from "../../components/FormTabs";
import { PartnerNoticesEditor } from "../../components/PartnerNoticesEditor";

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
  const [thumbUploading, setThumbUploading] = useState(false);

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
      await savePartnerProfile(form);
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
          tabs={[
            {
              key: "basic",
              label: "기본 정보",
              content: (
                <>
                  <Field label="카카오 place id (앱 검색 결과의 내 병원 id)">
                    <input value={form.kakao_place_id} onChange={set("kakao_place_id")} style={inp} />
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
                  <Field label="썸네일 이미지 (리스트 카드용)">
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input value={form.thumbnail_url ?? ""} onChange={set("thumbnail_url")} style={{ ...inp, flex: 1 }} placeholder="파일 업로드 또는 URL" />
                      <UploadBtn
                        busy={thumbUploading}
                        onFile={async (f) => {
                          setThumbUploading(true);
                          try {
                            const { url } = await uploadPartnerImage(f);
                            setForm((s) => ({ ...s, thumbnail_url: url }));
                          } catch (e: any) {
                            alert(e?.message ?? "업로드 실패");
                          } finally {
                            setThumbUploading(false);
                          }
                        }}
                      />
                    </div>
                    {form.thumbnail_url ? <img src={form.thumbnail_url} alt="" style={thumb} /> : null}
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

function UploadBtn({ busy, onFile }: { busy: boolean; onFile: (f: File) => void }) {
  return (
    <label style={{ ...uploadBtn, opacity: busy ? 0.6 : 1, pointerEvents: busy ? "none" : "auto" }}>
      {busy ? "업로드 중…" : "파일 선택"}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
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
const inp: CSSProperties = { width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, boxSizing: "border-box" };
const uploadBtn: CSSProperties = {
  flexShrink: 0,
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#f3f4f6",
  cursor: "pointer",
  fontSize: 13,
  whiteSpace: "nowrap",
};
const thumb: CSSProperties = { marginTop: 8, maxWidth: 200, maxHeight: 120, borderRadius: 8, display: "block" };
const saveBtn: CSSProperties = {
  padding: "12px 20px",
  border: "none",
  borderRadius: 8,
  background: "#0d47a1",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 8,
};
const logout: CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
