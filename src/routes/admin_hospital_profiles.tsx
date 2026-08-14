import { useContext, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  createHospitalProfile,
  deleteHospitalProfile,
  listHospitalProfiles,
  updateHospitalProfile,
  uploadHospitalImage,
  type HospitalProfile,
  type HospitalProfileInput,
} from "../api/hospitalProfile";
import { getHospitalList } from "../api/hospital";
import {
  KeywordsEditor,
  OpeningHoursEditor,
  TreatmentItemsEditor,
} from "../components/hospitalCardEditors";
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
      editingId ? updateHospitalProfile(editingId, form) : createHospitalProfile(form),
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

  const bannerUpload = useMutation({
    mutationFn: (file: File) => uploadHospitalImage(file),
    onSuccess: ({ url }) => setForm((f) => ({ ...f, banner_image_url: url })),
    onError: (e: any) => alert(e?.message ?? "업로드 실패"),
  });

  const galleryUpload = useMutation({
    mutationFn: (file: File) => uploadHospitalImage(file),
    onSuccess: ({ url }) =>
      setForm((f) => ({ ...f, images: [...(f.images ?? []), url] })),
    onError: (e: any) => alert(e?.message ?? "업로드 실패"),
  });

  const thumbUpload = useMutation({
    mutationFn: (file: File) => uploadHospitalImage(file),
    onSuccess: ({ url }) => setForm((f) => ({ ...f, thumbnail_url: url })),
    onError: (e: any) => alert(e?.message ?? "업로드 실패"),
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
        <Field label="카카오 place id (필수, 앱 검색 결과의 병원 id)">
          <input value={form.kakao_place_id} onChange={set("kakao_place_id")} style={inp} />
        </Field>
        <Field label="병원명">
          <input value={form.name} onChange={set("name")} style={inp} />
        </Field>
        <Field label="상세설명">
          <textarea
            value={form.description}
            onChange={set("description")}
            style={{ ...inp, height: 160 }}
          />
        </Field>

        <Field label="배너 이미지">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={form.banner_image_url ?? ""}
              onChange={set("banner_image_url")}
              style={{ ...inp, flex: 1 }}
              placeholder="파일 업로드 또는 URL"
            />
            <UploadButton pending={bannerUpload.isPending} onFile={(f) => bannerUpload.mutate(f)} />
          </div>
          {form.banner_image_url ? (
            <img src={form.banner_image_url} alt="" style={thumb} />
          ) : null}
        </Field>

        <Field label="상세 이미지 (여러 장)">
          <UploadButton pending={galleryUpload.isPending} onFile={(f) => galleryUpload.mutate(f)} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {(form.images ?? []).map((url, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={url} alt="" style={{ ...thumb, marginTop: 0 }} />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      images: (f.images ?? []).filter((_, idx) => idx !== i),
                    }))
                  }
                  style={removeBtn}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Field>

        <Field label="썸네일 이미지 (리스트 카드용)">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={form.thumbnail_url ?? ""}
              onChange={set("thumbnail_url")}
              style={{ ...inp, flex: 1 }}
              placeholder="파일 업로드 또는 URL"
            />
            <UploadButton pending={thumbUpload.isPending} onFile={(f) => thumbUpload.mutate(f)} />
          </div>
          {form.thumbnail_url ? <img src={form.thumbnail_url} alt="" style={thumb} /> : null}
        </Field>

        <Field label="키워드 태그 (리스트 카드에 노출)">
          <KeywordsEditor
            value={form.keywords ?? []}
            onChange={(keywords) => setForm((f) => ({ ...f, keywords }))}
          />
        </Field>

        <Field label="병원 소식 (공지·이벤트)">
          <HospitalNoticesEditor profileId={editingId} />
        </Field>

        <Field label="진료시간">
          <OpeningHoursEditor
            value={form.opening_hours ?? null}
            onChange={(opening_hours) => setForm((f) => ({ ...f, opening_hours }))}
          />
        </Field>

        <Field label="치료항목 (카테고리별 가격·안내)">
          <TreatmentItemsEditor
            value={form.treatment_items ?? []}
            onChange={(treatment_items) => setForm((f) => ({ ...f, treatment_items }))}
          />
        </Field>

        <Field label="예약 링크 (선택)">
          <input value={form.booking_url ?? ""} onChange={set("booking_url")} style={inp} placeholder="https://" />
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label="내부 병원 연결 (리뷰 자격 판정)">
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
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label="전화">
            <input value={form.phone} onChange={set("phone")} style={inp} />
          </Field>
          <Field label="주소">
            <input value={form.address} onChange={set("address")} style={inp} />
          </Field>
          <Field label="상태">
            <select value={form.status} onChange={set("status")} style={inp}>
              <option value="published">게시</option>
              <option value="pending">승인대기</option>
              <option value="draft">임시저장</option>
            </select>
          </Field>
        </div>

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

function UploadButton({ pending, onFile }: { pending: boolean; onFile: (f: File) => void }) {
  return (
    <label
      style={{
        ...uploadBtn,
        opacity: pending ? 0.6 : 1,
        pointerEvents: pending ? "none" : "auto",
      }}
    >
      {pending ? "업로드 중…" : "파일 선택"}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
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
const thumb: CSSProperties = {
  marginTop: 8,
  maxWidth: 200,
  maxHeight: 120,
  borderRadius: 8,
  display: "block",
};
const removeBtn: CSSProperties = {
  position: "absolute",
  top: 2,
  right: 2,
  width: 22,
  height: 22,
  borderRadius: 11,
  border: "none",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  cursor: "pointer",
  lineHeight: "20px",
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
