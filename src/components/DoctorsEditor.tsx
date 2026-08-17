import { useRef, useState, type CSSProperties } from "react";

import type { Doctor } from "../api/hospitalProfile";

export const MAX_DOCTORS = 20;

type UploadOne = (file: File) => Promise<{ url: string }>;

/**
 * 의사 정보 편집기.
 *
 * 순서가 곧 앱에서의 노출 순서라 위/아래로 옮길 수 있어야 한다 — 병원은 거의
 * 항상 대표원장을 맨 앞에 두고 싶어한다. 이름만 필수로 두는 이유는 사진과
 * 소개를 준비하는 데 시간이 걸려서, 그 둘을 기다리느라 목록 자체가 비어 있는
 * 것보다 이름만이라도 올려두는 편이 낫기 때문이다.
 */
export function DoctorsEditor({
  value,
  onChange,
  upload,
}: {
  value: Doctor[];
  onChange: (v: Doctor[]) => void;
  upload: UploadOne;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const set = (i: number, d: Doctor) => onChange(value.map((x, idx) => (idx === i ? d : x)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const pickPhoto = async (i: number, file: File | undefined) => {
    if (!file) return;
    setBusy(i);
    try {
      const { url } = await upload(file);
      set(i, { ...value[i], photoUrl: url });
    } catch (e: any) {
      alert(e?.message ?? "업로드 실패");
    } finally {
      setBusy(null);
      const el = inputRefs.current[i];
      if (el) el.value = "";
    }
  };

  return (
    <div>
      <p style={hint}>
        앱 병원 상세의 “의사 정보”에 위에서부터 순서대로 노출됩니다. 이름만 넣어도 등록되고, 사진과
        소개는 나중에 채워도 됩니다. 최대 {MAX_DOCTORS}명.
      </p>

      {value.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 13 }}>등록된 의사 정보가 없습니다.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
          {value.map((d, i) => (
            <div key={i} style={card}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: "0 0 96px" }}>
                  {d.photoUrl ? (
                    <img src={d.photoUrl} alt="" style={photo} />
                  ) : (
                    <div style={{ ...photo, ...photoEmpty }}>사진 없음</div>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="file"
                    accept="image/*"
                    disabled={busy === i}
                    onChange={(e) => void pickPhoto(i, e.target.files?.[0])}
                    style={{ width: 96, fontSize: 11, marginTop: 4 }}
                  />
                  {d.photoUrl && (
                    <button
                      type="button"
                      onClick={() => set(i, { ...d, photoUrl: null })}
                      style={{ ...tinyBtn, marginTop: 4 }}
                    >
                      사진 삭제
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={d.name}
                      onChange={(e) => set(i, { ...d, name: e.target.value })}
                      placeholder="이름"
                      style={{ ...inp, flex: 1 }}
                    />
                    <input
                      value={d.title ?? ""}
                      onChange={(e) => set(i, { ...d, title: e.target.value })}
                      placeholder="직함"
                      style={{ ...inp, flex: 1.4 }}
                    />
                  </div>
                  <textarea
                    value={d.bio ?? ""}
                    onChange={(e) => set(i, { ...d, bio: e.target.value })}
                    placeholder="약력·소개 (선택)"
                    rows={3}
                    style={{ ...inp, width: "100%", resize: "vertical" }}
                  />
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      style={tinyBtn}
                      disabled={i === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      style={tinyBtn}
                      disabled={i === value.length - 1}
                    >
                      ↓
                    </button>
                    <div style={{ flex: 1 }} />
                    {busy === i && (
                      <span style={{ color: "#6b7280", fontSize: 12 }}>업로드 중…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      style={{ ...tinyBtn, color: "#e0245e", borderColor: "#e0245e" }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onChange([...value, { name: "" }])}
        disabled={value.length >= MAX_DOCTORS}
        style={addBtn}
      >
        + 의사 추가
      </button>
    </div>
  );
}

/**
 * 빈 문자열을 null로. 백엔드가 photoUrl을 URL로 검증해서 `""`는 400이 되고,
 * 이름이 빈 줄은 "추가"만 눌러놓고 안 채운 줄이라 저장할 것이 없다.
 */
export function cleanDoctors(rows: Doctor[]): Doctor[] {
  return rows
    .filter((d) => d.name.trim() !== "")
    .map((d) => ({
      name: d.name.trim(),
      title: d.title?.trim() ? d.title.trim() : null,
      photoUrl: d.photoUrl?.trim() ? d.photoUrl.trim() : null,
      bio: d.bio?.trim() ? d.bio.trim() : null,
    }));
}

const hint: CSSProperties = { color: "#6b7280", fontSize: 12, margin: "0 0 10px" };
const inp: CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 14,
};
const card: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
};
const photo: CSSProperties = {
  width: 96,
  height: 96,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  display: "block",
  background: "#f3f4f6",
};
const photoEmpty: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
  fontSize: 12,
};
const tinyBtn: CSSProperties = {
  padding: "2px 8px",
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};
const addBtn: CSSProperties = {
  padding: "6px 14px",
  borderRadius: 8,
  border: "1px solid #0d47a1",
  background: "#fff",
  color: "#0d47a1",
  cursor: "pointer",
  fontSize: 13,
};
