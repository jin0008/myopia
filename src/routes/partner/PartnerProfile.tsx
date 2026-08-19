import { useContext, useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router";

import {
  clearPartnerToken,
  getPartnerToken,
  partnerMe,
  type PartnerMe,
  type PartnerProfileInput,
} from "../../api/partner";
import { normaliseProfileUrls } from "../../api/hospitalProfile";
import { hospitalApi, partnerApi } from "../../api/profileEditorApi";
import { describeFieldErrors } from "../../constants/profileFields";
import { UserContext } from "../../App";
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
  latitude: null,
  longitude: null,
  tagline: "",
  detail_blocks: [],
  booking_url: "",
};

export default function PartnerProfile() {
  const nav = useNavigate();
  const { user } = useContext(UserContext);
  // 같은 화면을 두 부류가 쓴다. myopia를 쓰는 병원은 원래 계정으로 들어오고,
  // 그렇지 않은 병원은 파트너 계정으로 들어온다. 화면을 둘로 나누면 앞으로
  // 필드를 추가할 때마다 두 곳을 고쳐야 하고 한쪽만 고치는 실수가 난다.
  const isHospitalAdmin = user?.healthcare_professional?.is_admin === true;
  // 한 브라우저에 두 로그인이 다 있을 수 있다(테스트 중에는 흔하다). 그때
  // 토큰 유무만 보면 myopia 관리자가 'myodoc 관리'를 눌렀는데 파트너 계정의
  // 프로필이 열린다. 헤더 버튼이 ?as=hospital을 달아 의도를 밝힌다.
  const [params] = useSearchParams();
  const asHospital = params.get("as") === "hospital" && isHospitalAdmin;
  const hasPartnerToken = !asHospital && getPartnerToken() != null;
  const api = hasPartnerToken ? partnerApi : hospitalApi;
  const [me, setMe] = useState<PartnerMe | null>(null);
  const [form, setForm] = useState<PartnerProfileInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // 어느 탭 어느 칸이 문제인지. 문장 하나로는 탭이 일곱 개라 찾을 수가 없다.
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!hasPartnerToken && !isHospitalAdmin) {
      nav("/partner/login");
      return;
    }
    // myopia 관리자는 승인 상태라는 개념이 없다 - 이미 진료 데이터를 다루도록
    // 승인된 계정이라 신원 확인이 그때 끝났다.
    Promise.all([hasPartnerToken ? partnerMe() : Promise.resolve(null), api.getProfile()])
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
            doctors: p.doctors ?? [],
            latitude: p.latitude ?? null,
            longitude: p.longitude ?? null,
            booking_url: p.booking_url ?? "",
          });
        } else if (m) {
          // 파트너는 가입할 때 병원명을 적었다. myopia 관리자는 그 값이 없고,
          // 장소 검색에서 고르면 채워진다.
          setForm((f) => ({ ...f, name: m.hospitalName }));
        }
      })
      .catch(() => {
        if (hasPartnerToken) {
          clearPartnerToken();
          nav("/partner/login");
        } else {
          setMsg("불러오지 못했습니다.");
        }
      })
      .finally(() => setLoading(false));
    // api/모드는 렌더 중 바뀌지 않는다(로그인 상태로 정해진다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  const set = (k: keyof PartnerProfileInput) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setMsg(null);
    setFieldErrors([]);
    setSaving(true);
    try {
      await api.saveProfile(
        // 이름이 빈 줄과 빈 문자열 photoUrl은 저장할 것이 없고, URL 검증에
        // 걸려 폼 전체가 400이 된다.
        normaliseProfileUrls({ ...form, doctors: cleanDoctors(form.doctors ?? []) }),
      );
      setMsg("저장되었습니다.");
    } catch (e: any) {
      const details = describeFieldErrors(e?.fields);
      setFieldErrors(details);
      setMsg(
        details.length > 0
          ? "저장하지 못했습니다. 아래 항목을 확인해 주세요."
          : (e?.message ?? "저장하지 못했습니다."),
      );
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
        {/* 이 화면은 myopia 헤더 밖에 있다. 파트너는 여기가 전부라 로그아웃이
            맞고, myopia 관리자는 원래 있던 곳으로 돌아갈 길이 있어야 한다. */}
        {hasPartnerToken ? (
          <button
            style={logout}
            onClick={() => {
              clearPartnerToken();
              nav("/partner/login");
            }}
          >
            로그아웃
          </button>
        ) : (
          <button style={logout} onClick={() => nav("/")}>
            ← myopia로 돌아가기
          </button>
        )}
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
          onTabChange={() => {
            setMsg(null);
            setFieldErrors([]);
          }}
          tabs={[
            {
              key: "basic",
              label: "기본 정보",
              content: (
                <>
                  <Field label="병원 찾기 (카카오맵 검색)">
                    <PlacePicker
                      search={api.searchPlaces}
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
                          // 좌표는 사람이 볼 일이 없어 폼에 칸을 두지 않는다.
                          // 앱이 거리 정렬·지도에 쓸 값이라 조용히 따라간다.
                          latitude: pl.latitude,
                          longitude: pl.longitude,
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
                  upload={api.uploadImages}
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
                  upload={api.uploadImages}
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
                  upload={api.uploadImage}
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
              content: <PartnerNoticesEditor api={api} />,
            },
          ]}
        />

        {msg && (
        <p style={{ fontSize: 13, color: msg.includes("저장되") ? "#0d7d6f" : "#b3261e" }}>{msg}</p>
      )}
      {fieldErrors.length > 0 && (
        <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: "#b3261e", fontSize: 13 }}>
          {fieldErrors.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {/* 탭이 일곱 개라 탭마다 저장 버튼이 있는 줄 알기 쉽다. 실제로는 모든
          탭이 한 폼이고 저장은 한 번이다. */}
      <p style={{ color: "#6b7280", fontSize: 12, margin: "10px 0 0" }}>
        모든 탭의 내용이 저장 버튼 한 번으로 함께 저장됩니다. 소식은 등록·수정할 때 바로
        반영됩니다.
      </p>
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
