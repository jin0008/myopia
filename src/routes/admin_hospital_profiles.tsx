import { useContext, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  createHospitalProfile,
  deleteHospitalProfile,
  listHospitalProfiles,
  updateHospitalProfile,
  uploadHospitalImages,
  searchAdminPlaces,
  normaliseProfileUrls,
  type HospitalProfile,
  type HospitalProfileInput,
} from "../api/hospitalProfile";
import { getHospitalList } from "../api/hospital";
import {
  KeywordsEditor,
  OpeningHoursEditor,
  TreatmentItemsEditor,
} from "../components/hospitalCardEditors";
import { BannerImagesEditor, DetailBlocksEditor } from "../components/HospitalContentEditors";
import { FormTabs } from "../components/FormTabs";
import { PlacePicker } from "../components/PlacePicker";
import { HospitalNoticesEditor } from "../components/HospitalNoticesEditor";

interface HospitalListItem {
  id: string;
  name: string;
}

const MYODOC_WEB = "https://myodoc.co.kr";

// Live detail page on the myodoc web app. The profile (banner/설명/이미지) is
// fetched there by kakao place id; the rest are basic-info params the results
// list normally passes, so we fill what we have.
function previewUrl(placeId: string, name: string, phone?: string, address?: string) {
  const q = new URLSearchParams({
    id: placeId,
    name: name ?? "",
    category: "clinic",
    address: address ?? "",
    roadAddress: "",
    phone: phone ?? "",
    placeUrl: "",
  });
  return `${MYODOC_WEB}/treatment-finder/hospital?${q.toString()}`;
}

const EMPTY: HospitalProfileInput = {
  kakao_place_id: "",
  name: "",
  description: "",
  banner_image_url: "",
  images: [],
  phone: "",
  address: "",
  status: "published",
  hospital_id: null,
  thumbnail_url: "",
  keywords: [],
  treatment_items: [],
  opening_hours: null,
  tagline: "",
  detail_blocks: [],
  verified: false,
  booking_url: "",
};

export default function AdminHospitalProfiles() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HospitalProfileInput>(EMPTY);

  const listQuery = useQuery({
    queryKey: ["admin", "hospitalProfiles"],
    queryFn: listHospitalProfiles,
  });

  // Internal participating hospitals — linking one enables patient reviews.
  const hospitalsQuery = useQuery<HospitalListItem[]>({
    queryKey: ["hospitalList"],
    queryFn: getHospitalList,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId
        ? updateHospitalProfile(editingId, normaliseProfileUrls(form))
        : createHospitalProfile(normaliseProfileUrls(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hospitalProfiles"] });
      reset();
    },
    onError: (e: any) => alert(e?.message ?? "저장 실패"),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteHospitalProfile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "hospitalProfiles"] }),
  });




  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function startEdit(h: HospitalProfile) {
    setEditingId(h.id);
    setForm({
      kakao_place_id: h.kakao_place_id,
      name: h.name,
      description: h.description ?? "",
      banner_image_url: h.banner_image_url ?? "",
      images: h.images ?? [],
      phone: h.phone ?? "",
      address: h.address ?? "",
      status: h.status,
      hospital_id: h.hospital_id ?? null,
      thumbnail_url: h.thumbnail_url ?? "",
      keywords: h.keywords ?? [],
      treatment_items: h.treatment_items ?? [],
      opening_hours: h.opening_hours ?? null,
      tagline: h.tagline ?? "",
      detail_blocks: h.detail_blocks ?? [],
      verified: h.verified ?? false,
      booking_url: h.booking_url ?? "",
    });
  }

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  const set = (k: keyof HospitalProfileInput) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSave = !!form.kakao_place_id.trim() && !!form.name.trim();

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={{ display: "inline-block", marginBottom: 12, color: "#6b7280" }}>
        ← myodoc 관리
      </a>
      <h1>병원 프로필 관리</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>
        카카오 place id 기준으로 앱 병원 상세 페이지에 배너·설명·이미지를 노출합니다.
      </p>

      <div style={card}>
        <h2>{editingId ? "프로필 수정" : "새 프로필"}</h2>
        <FormTabs
          tabs={[
            {
              key: "basic",
              label: "기본 정보",
              content: (
                <>
                  <Field label="병원 찾기 (카카오맵 검색)">
                    <PlacePicker
                      search={searchAdminPlaces}
                      currentId={form.kakao_place_id}
                      onPick={(pl) =>
                        setForm((f) => ({
                          ...f,
                          kakao_place_id: pl.id,
                          name: pl.name,
                          phone: pl.phone ?? f.phone,
                          address: pl.roadAddress ?? pl.address ?? f.address,
                        }))
                      }
                    />
                    {form.kakao_place_id ? (
                      <p style={{ color: "#0d7d6f", fontSize: 13, margin: "8px 0 0" }}>
                        선택됨: {form.name} (place id {form.kakao_place_id})
                      </p>
                    ) : (
                      <p style={{ color: "#6b7280", fontSize: 12, margin: "8px 0 0" }}>
                        검색해서 병원을 선택하면 병원명·전화·주소가 자동으로 채워집니다.
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
                      onChange={(keywords) => setForm((f) => ({ ...f, keywords }))}
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
                  onChange={(images) => setForm((f) => ({ ...f, images }))}
                  upload={uploadHospitalImages}
                />
              ),
            },
            {
              key: "detail",
              label: "상세 설명",
              content: (
                <DetailBlocksEditor
                  value={form.detail_blocks ?? []}
                  onChange={(detail_blocks) => setForm((f) => ({ ...f, detail_blocks }))}
                  upload={uploadHospitalImages}
                />
              ),
            },
            {
              key: "hours",
              label: "진료시간",
              content: (
                <OpeningHoursEditor
                  value={form.opening_hours ?? null}
                  onChange={(opening_hours) => setForm((f) => ({ ...f, opening_hours }))}
                />
              ),
            },
            {
              key: "treatments",
              label: "치료항목",
              content: (
                <TreatmentItemsEditor
                  value={form.treatment_items ?? []}
                  onChange={(treatment_items) => setForm((f) => ({ ...f, treatment_items }))}
                />
              ),
            },
            {
              key: "notices",
              label: "소식",
              content: <HospitalNoticesEditor profileId={editingId} />,
            },
            {
              key: "admin",
              label: "관리자 설정",
              content: (
                <>
                  <Field label="내부 병원 연결 (리뷰 자격 · eyelog 연동 배지)">
                    <select
                      value={form.hospital_id ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, hospital_id: e.target.value || null }))}
                      style={inp}
                    >
                      <option value="">연결 안 함 (리뷰 비활성)</option>
                      {hospitalsQuery.data?.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="인증 배지">
                    <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
                      <input
                        type="checkbox"
                        checked={!!form.verified}
                        onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))}
                      />
                      인증됨 표시
                    </label>
                  </Field>
                  <Field label="상태">
                    <select value={form.status} onChange={set("status")} style={inp}>
                      <option value="published">게시</option>
                      <option value="pending">승인대기</option>
                      <option value="draft">임시저장</option>
                    </select>
                  </Field>
                </>
              ),
            },
          ]}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <PrimaryButton onClick={() => canSave && saveMutation.mutate()}>
            {editingId ? "수정 저장" : "생성"}
          </PrimaryButton>
          {editingId && <PrimaryNagativeButton onClick={reset}>취소</PrimaryNagativeButton>}
          {canSave && (
            <a
              href={previewUrl(form.kakao_place_id, form.name, form.phone, form.address)}
              target="_blank"
              rel="noreferrer"
              style={previewBtn}
              title="저장 후 눌러야 최신 내용이 보입니다"
            >
              실서비스 미리보기 ↗
            </a>
          )}
        </div>
      </div>

      <h2 style={{ marginTop: 28 }}>프로필 목록</h2>
      {listQuery.isLoading ? (
        <div>Loading…</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>병원명</th>
              <th style={th}>place id</th>
              <th style={th}>상태</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {listQuery.data?.map((h) => (
              <tr key={h.id}>
                <td style={td}>{h.name}</td>
                <td style={td}>{h.kakao_place_id}</td>
                <td style={td}>{h.status}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <a
                    href={previewUrl(h.kakao_place_id, h.name, h.phone ?? undefined, h.address ?? undefined)}
                    target="_blank"
                    rel="noreferrer"
                    style={previewBtn}
                  >
                    미리보기 ↗
                  </a>{" "}
                  <a
                    href={`/admin/hospital-profiles/${encodeURIComponent(h.kakao_place_id)}/reviews`}
                    style={previewBtn}
                  >
                    리뷰 관리
                  </a>{" "}
                  <PrimaryButton onClick={() => startEdit(h)}>수정</PrimaryButton>{" "}
                  <PrimaryNagativeButton
                    onClick={() => {
                      if (confirm("이 프로필을 삭제할까요?")) delMutation.mutate(h.id);
                    }}
                  >
                    삭제
                  </PrimaryNagativeButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 10, flex: 1 }}>
      <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const card: CSSProperties = { border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 12 };
const inp: CSSProperties = {
  width: "100%",
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
  boxSizing: "border-box",
};
const previewBtn: CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  border: "1px solid #0d7d6f",
  borderRadius: 6,
  color: "#0d7d6f",
  background: "#0d7d6f14",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: "nowrap",
};
const th: CSSProperties = { textAlign: "left", borderBottom: "2px solid #eee", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8 };
