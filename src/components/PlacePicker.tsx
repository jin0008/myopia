import { useState, type CSSProperties } from "react";

export interface PlaceResult {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  address: string | null;
  roadAddress: string | null;
}

/**
 * Find a clinic on Kakao by name and pick it.
 *
 * The profile is keyed by Kakao place id. Asking clinic staff to look that
 * number up and type it is not a workable onboarding step — they get it wrong,
 * the save succeeds anyway, and nothing ever appears in the app with no hint as
 * to why. Picking from search results removes the id from the human's hands
 * entirely, and fills in the phone and address while it's at it.
 */
export function PlacePicker({
  search,
  onPick,
  currentId,
}: {
  search: (q: string) => Promise<{ places: PlaceResult[] }>;
  onPick: (p: PlaceResult) => void;
  currentId?: string;
}) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PlaceResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    const query = q.trim();
    if (query.length < 2) {
      setErr("두 글자 이상 입력해 주세요.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await search(query);
      setRows(r.places);
      if (r.places.length === 0) setErr("검색 결과가 없습니다.");
    } catch (e: any) {
      setErr(e?.message ?? "검색에 실패했습니다.");
      setRows(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            // Korean IME: Enter during composition confirms the syllable.
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter") {
              e.preventDefault();
              void run();
            }
          }}
          placeholder="병원 이름으로 검색 (예: 누네안과병원 서울)"
          style={{ ...inp, flex: 1 }}
        />
        <button type="button" onClick={() => void run()} disabled={busy} style={btn}>
          {busy ? "검색 중…" : "검색"}
        </button>
      </div>

      {err && <p style={{ color: "#b3261e", fontSize: 13, margin: "8px 0 0" }}>{err}</p>}

      {rows && rows.length > 0 && (
        <div style={list}>
          {rows.map((p) => {
            const picked = p.id === currentId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPick(p);
                  setRows(null);
                  setQ("");
                }}
                style={{
                  ...row,
                  background: picked ? "#eef4ff" : "#fff",
                  borderColor: picked ? "#0d47a1" : "#e5e7eb",
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {p.name}
                  {picked && <span style={{ color: "#0d47a1", fontSize: 12 }}> · 선택됨</span>}
                </div>
                <div style={{ color: "#6b7280", fontSize: 12.5 }}>
                  {p.roadAddress || p.address}
                  {p.phone ? ` · ${p.phone}` : ""}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inp: CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 14,
};
const btn: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #0d47a1",
  background: "#0d47a1",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  whiteSpace: "nowrap",
};
const list: CSSProperties = {
  display: "grid",
  gap: 6,
  marginTop: 8,
  maxHeight: 260,
  overflowY: "auto",
};
const row: CSSProperties = {
  textAlign: "left",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px 12px",
  cursor: "pointer",
  display: "grid",
  gap: 2,
};
