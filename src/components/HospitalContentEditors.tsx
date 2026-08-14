import { useRef, useState, type CSSProperties } from "react";

import type { DetailBlock } from "../api/hospitalProfile";

export const MAX_BANNERS = 10;

type UploadMany = (files: File[]) => Promise<{ urls: string[] }>;

/**
 * Banner carousel: pick several files at once, reorder, remove.
 *
 * Uploading one file at a time was the slowest part of setting up a profile —
 * a clinic has a folder of photos, not one photo. Capped at ten because past
 * that nobody swipes and the page just gets heavier.
 */
export function BannerImagesEditor({
  value,
  onChange,
  upload,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  upload: UploadMany;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const room = MAX_BANNERS - value.length;

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const chosen = Array.from(files).slice(0, room);
    if (chosen.length < files.length) {
      alert(`배너는 최대 ${MAX_BANNERS}장까지 등록할 수 있어 ${chosen.length}장만 추가합니다.`);
    }
    setBusy(true);
    try {
      const { urls } = await upload(chosen);
      onChange([...value, ...urls]);
    } catch (e: any) {
      alert(e?.message ?? "업로드 실패");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <p style={hint}>
        앱 병원 상세 상단에 좌우로 넘기며 보이는 사진입니다. 첫 번째 사진이 대표로 쓰입니다. 최대{" "}
        {MAX_BANNERS}장.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy || room <= 0}
          onChange={(e) => void pick(e.target.files)}
        />
        <span style={{ color: "#6b7280", fontSize: 12 }}>
          {busy ? "업로드 중…" : `${value.length} / ${MAX_BANNERS}`}
        </span>
      </div>

      {value.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 13 }}>등록된 배너 사진이 없습니다.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {value.map((url, i) => (
            <div key={url + i} style={thumbBox}>
              <img src={url} alt="" style={thumbImg} />
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <button type="button" onClick={() => move(i, -1)} style={tinyBtn} disabled={i === 0}>
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  style={tinyBtn}
                  disabled={i === value.length - 1}
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                  style={{ ...tinyBtn, color: "#e0245e", borderColor: "#e0245e" }}
                >
                  삭제
                </button>
              </div>
              {i === 0 && <span style={mainTag}>대표</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Blog-style body: paragraphs and pictures in the order the clinic wants.
 *
 * A single text field plus a flat gallery can't say "here's the procedure, and
 * here's what it looks like" — the picture has to sit next to the paragraph it
 * belongs to.
 */
export function DetailBlocksEditor({
  value,
  onChange,
  upload,
}: {
  value: DetailBlock[];
  onChange: (v: DetailBlock[]) => void;
  upload: UploadMany;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (i: number, b: DetailBlock) =>
    onChange(value.map((x, idx) => (idx === i ? b : x)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const { urls } = await upload(Array.from(files));
      onChange([...value, ...urls.map((url) => ({ type: "image" as const, url }))]);
    } catch (e: any) {
      alert(e?.message ?? "업로드 실패");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p style={hint}>
        글과 사진을 원하는 순서로 배치합니다. 블로그 글쓰기처럼 문단 사이에 사진을 넣을 수 있습니다.
      </p>

      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {value.length === 0 && (
          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
            아직 내용이 없습니다. 아래에서 글이나 사진을 추가하세요.
          </p>
        )}
        {value.map((b, i) => (
          <div key={i} style={blockBox}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <span style={blockTag}>{b.type === "text" ? "글" : "사진"}</span>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={() => move(i, -1)} style={tinyBtn} disabled={i === 0}>
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
              <button
                type="button"
                onClick={() => remove(i)}
                style={{ ...tinyBtn, color: "#e0245e", borderColor: "#e0245e" }}
              >
                삭제
              </button>
            </div>
            {b.type === "text" ? (
              <textarea
                value={b.text}
                onChange={(e) => set(i, { type: "text", text: e.target.value })}
                rows={4}
                placeholder="내용을 입력하세요"
                style={{ ...inp, width: "100%", resize: "vertical" }}
              />
            ) : (
              <img src={b.url} alt="" style={{ maxWidth: "100%", borderRadius: 8 }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => onChange([...value, { type: "text", text: "" }])}
          style={addBtn}
        >
          + 글 추가
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(e) => void addImages(e.target.files)}
        />
        {busy && <span style={{ color: "#6b7280", fontSize: 12 }}>업로드 중…</span>}
      </div>
    </div>
  );
}

const hint: CSSProperties = { color: "#6b7280", fontSize: 12, margin: "0 0 10px" };
const inp: CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 14,
};
const thumbBox: CSSProperties = { position: "relative", width: 140 };
const thumbImg: CSSProperties = {
  width: 140,
  height: 92,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  display: "block",
};
const mainTag: CSSProperties = {
  position: "absolute",
  top: 6,
  left: 6,
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  fontSize: 11,
  borderRadius: 4,
  padding: "1px 6px",
};
const tinyBtn: CSSProperties = {
  padding: "2px 8px",
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};
const blockBox: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
};
const blockTag: CSSProperties = {
  background: "#eef2f7",
  color: "#36475A",
  borderRadius: 6,
  padding: "1px 8px",
  fontSize: 12,
  fontWeight: 700,
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
