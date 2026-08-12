import { useState, type CSSProperties } from "react";

import {
  TREATMENT_CATEGORIES,
  type TreatmentItem,
} from "../constants/treatmentCategories";

/* ---- keyword tags ------------------------------------------------------ */

export function KeywordsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v || value.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="예: 스마일라식, 드림렌즈 (Enter로 추가)"
          style={inp}
        />
        <button type="button" onClick={add} style={smallBtn}>
          추가
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {value.map((k) => (
          <span key={k} style={tag}>
            {k}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== k))}
              style={tagX}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---- treatment items --------------------------------------------------- */

export function TreatmentItemsEditor({
  value,
  onChange,
}: {
  value: TreatmentItem[];
  onChange: (next: TreatmentItem[]) => void;
}) {
  function update(i: number, patch: Partial<TreatmentItem>) {
    onChange(value.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    onChange([...value, { category: "dreamLens", name: "" }]);
  }
  function num(v: string): number | null {
    const n = Number(v.replace(/[^0-9]/g, ""));
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  }

  return (
    <div>
      {value.map((it, i) => (
        <div key={i} style={itemCard}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select
              value={it.category}
              onChange={(e) => update(i, { category: e.target.value })}
              style={{ ...inp, flex: "0 0 160px" }}
            >
              {TREATMENT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              value={it.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="항목명 (예: 노안수술 검진)"
              style={{ ...inp, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              style={smallBtnDanger}
            >
              삭제
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={it.normalPrice ?? ""}
              onChange={(e) => update(i, { normalPrice: num(e.target.value) })}
              placeholder="정상가 (원)"
              inputMode="numeric"
              style={{ ...inp, flex: 1 }}
            />
            <input
              value={it.eventPrice ?? ""}
              onChange={(e) => update(i, { eventPrice: num(e.target.value) })}
              placeholder="이벤트가 (원, 선택)"
              inputMode="numeric"
              style={{ ...inp, flex: 1 }}
            />
          </div>
          <textarea
            value={it.description ?? ""}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="안내 문구 (예: 검진항목 등에 따라 비용이 상이할 수 있습니다)"
            style={{ ...inp, height: 60 }}
          />
        </div>
      ))}
      <button type="button" onClick={addItem} style={smallBtn}>
        + 치료항목 추가
      </button>
    </div>
  );
}

const inp: CSSProperties = {
  width: "100%",
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
  boxSizing: "border-box",
};
const smallBtn: CSSProperties = {
  flexShrink: 0,
  padding: "8px 14px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#f3f4f6",
  cursor: "pointer",
  fontSize: 13,
  whiteSpace: "nowrap",
};
const smallBtnDanger: CSSProperties = { ...smallBtn, color: "#b3261e", borderColor: "#f0c9c6" };
const tag: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "#eef2ff",
  color: "#3730a3",
  borderRadius: 999,
  padding: "3px 6px 3px 10px",
  fontSize: 13,
};
const tagX: CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#3730a3",
  fontSize: 15,
  lineHeight: 1,
};
const itemCard: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  marginBottom: 10,
  background: "#fafafa",
};
