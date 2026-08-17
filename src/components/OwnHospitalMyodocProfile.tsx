import { useEffect, useState, type CSSProperties } from "react";

import {
  getOwnHospitalProfile,
  saveOwnHospitalProfile,
  searchOwnHospitalPlaces,
  uploadOwnHospitalImage,
  uploadOwnHospitalImages,
  normaliseProfileUrls,
  type OwnHospitalProfileInput,
} from "../api/hospitalProfile";
import { DoctorsEditor, cleanDoctors } from "./DoctorsEditor";
import { FormTabs } from "./FormTabs";
import { BannerImagesEditor, DetailBlocksEditor } from "./HospitalContentEditors";
import { KeywordsEditor, OpeningHoursEditor, TreatmentItemsEditor } from "./hospitalCardEditors";
import { OwnHospitalNoticesEditor } from "./OwnHospitalNoticesEditor";
import { PlacePicker } from "./PlacePicker";

const EMPTY: OwnHospitalProfileInput = {
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
  latitude: null,
  longitude: null,
  tagline: "",
  detail_blocks: [],
  booking_url: "",
};

/**
 * 병원 관리자가 자기 병원의 myodoc 소개를 직접 관리하는 화면.
 *
 * myopia 로그인 그대로 쓴다 — 파트너 계정을 따로 만들게 하면 같은 회사
 * 서비스에 계정이 둘이 되고, 병원마다 그 설명을 해야 한다.
 *
 * 어느 병원에 붙는지·인증 뱃지·노출 상태는 여기서 다루지 않는다. 서버가
 * 로그인한 관리자의 병원으로 고정한다.
 */
export function OwnHospitalMyodocProfile() {
  const [form, setForm] = useState<OwnHospitalProfileInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    getOwnHospitalProfile()
      .then((p) => {
        if (!p) return;
        setHasProfile(true);
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
          doctors: p.doctors ?? [],
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          tagline: p.tagline ?? "",
          detail_blocks: p.detail_blocks ?? [],
          booking_url: p.booking_url ?? "",
        });
      })
      .catch(() => setMsg("불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const set =
    (k: keyof OwnHospitalProfileInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const canSave = form.kakao_place_id !== "" && form.name.trim() !== "";

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await saveOwnHospitalProfile(
        normaliseProfileUrls({ ...form, doctors: cleanDoctors(form.doctors ?? []) }),
      );
      setHasProfile(true);
      setMsg("저장되었습니다. 앱에 바로 반영됩니다.");
    } catch (e: any) {
      setMsg(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={card}>불러오는 중…</div>;

  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 4px" }}>myodoc 병원 소개</h3>
      <p style={hint}>
        myodoc 앱의 병원 상세에 노출되는 내용입니다. 여기서 저장하면 앱에 바로 반영됩니다.
      </p>

      <FormTabs
        onTabChange={() => setMsg(null)}
        tabs={[
          {
            key: "basic",
            label: "기본 정보",
            content: (
              <>
                <Field label="병원 찾기 (카카오맵 검색)">
                  <PlacePicker
                    search={searchOwnHospitalPlaces}
                    currentId={form.kakao_place_id}
                    onPick={(pl) =>
                      setForm((s) => ({
                        ...s,
                        kakao_place_id: pl.id,
                        name: pl.name,
                        phone: pl.phone ?? s.phone,
                        address: pl.roadAddress ?? pl.address ?? s.address,
                        latitude: pl.latitude,
                        longitude: pl.longitude,
                      }))
                    }
                  />
                  {form.kakao_place_id ? (
                    <p style={{ color: "#0d7d6f", fontSize: 13, margin: "8px 0 0" }}>
                      선택됨: {form.name}
                    </p>
                  ) : (
                    <p style={{ color: "#6b7280", fontSize: 12, margin: "8px 0 0" }}>
                      검색해서 우리 병원을 선택하면 병원명·전화·주소가 자동으로 채워집니다.
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
                <Field label="키워드 태그">
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
                  <input
                    value={form.booking_url ?? ""}
                    onChange={set("booking_url")}
                    style={inp}
                    placeholder="https://"
                  />
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
                upload={uploadOwnHospitalImages}
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
                upload={uploadOwnHospitalImages}
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
                upload={uploadOwnHospitalImage}
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
            // 소식은 프로필에 달리므로 프로필을 먼저 저장해야 한다.
            content: hasProfile ? (
              <OwnHospitalNoticesEditor />
            ) : (
              <p style={{ color: "#6b7280", fontSize: 13 }}>
                병원 정보를 먼저 저장한 뒤 소식을 등록할 수 있습니다.
              </p>
            ),
          },
        ]}
      />

      {msg && (
        <p style={{ fontSize: 13, color: msg.includes("저장되") ? "#0d7d6f" : "#b3261e" }}>{msg}</p>
      )}
      <button
        style={{ ...saveBtn, opacity: canSave && !saving ? 1 : 0.5 }}
        disabled={!canSave || saving}
        onClick={save}
      >
        {saving ? "저장 중…" : "저장"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10, flex: 1 }}>
      <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const card: CSSProperties = {
  background: "white",
  border: "1px solid #eee",
  padding: 28,
  borderRadius: 16,
  marginTop: 24,
};
const hint: CSSProperties = { color: "#6b7280", fontSize: 13, margin: "0 0 14px" };
const inp: CSSProperties = {
  width: "100%",
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
  boxSizing: "border-box",
};
const saveBtn: CSSProperties = {
  padding: "12px 24px",
  borderRadius: 8,
  border: "none",
  background: "#0d47a1",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 12,
};
