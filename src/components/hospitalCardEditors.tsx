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
            // Enter while a Korean IME is still composing means "confirm this
            // syllable", not "submit". Without this guard one Enter fires twice
            // — once for the composition, once for the key — and "라식" is added
            // followed by the leftover "식".
            if (e.nativeEvent.isComposing) return;
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
              placeholder="항목명 (예: 드림렌즈 피팅)"
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

/* ---- 진료시간 ------------------------------------------------------------ */

const DAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
] as const;

export interface DayHours {
  open: string;
  close: string;
  lunchStart?: string | null;
  lunchEnd?: string | null;
}
export type OpeningHours = Partial<Record<(typeof DAYS)[number]["key"], DayHours | null>> & {
  note?: string;
};

/** 00:00~23:30을 30분 간격으로. 병원 시간은 30분 단위를 벗어나는 일이 드물다. */
const TIME_SLOTS: { value: string; label: string }[] = (() => {
  const out: { value: string; label: string }[] = [];
  for (let m = 0; m < 24 * 60; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const value = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    const ampm = h < 12 ? "오전" : "오후";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    out.push({ value, label: `${ampm} ${h12}:${String(mm).padStart(2, "0")}` });
  }
  return out;
})();

/**
 * 시간 드롭다운.
 *
 * `<input type="time">`은 브라우저마다 생김새가 다르고 키보드로 시·분을 따로
 * 쳐야 해서, 일곱 요일 × 네 칸을 채우는 데 손이 많이 간다. 고를 값이 48개뿐이라
 * 목록에서 집는 편이 빠르다.
 */
function TimeSelect({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={timeSelect}>
      {placeholder != null && <option value="">{placeholder}</option>}
      {TIME_SLOTS.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

const timeSelect: CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 13,
  minWidth: 104,
};

/**
 * Weekly hours grid. No map API supplies these, so the clinic enters them.
 *
 * Unchecking a day sets it to null (휴진) rather than deleting the key — the
 * app needs to tell "closed on Sunday" apart from "hasn't filled this in yet",
 * and only the second one should hide the section.
 */
export function OpeningHoursEditor({
  value,
  onChange,
}: {
  value: OpeningHours | null;
  onChange: (v: OpeningHours | null) => void;
}) {
  const hours = value ?? {};
  const setDay = (key: string, d: DayHours | null) => onChange({ ...hours, [key]: d });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}>진료시간</strong>
        {value != null && (
          <button type="button" onClick={() => onChange(null)} style={smallBtnDanger}>
            전체 삭제
          </button>
        )}
      </div>
      <p style={{ color: "#6b7280", fontSize: 12, margin: "0 0 10px" }}>
        체크를 해제하면 그 요일은 휴진으로 표시됩니다. 아무것도 입력하지 않으면 앱에서 진료시간
        섹션 자체가 표시되지 않습니다.
      </p>
      {hours.mon != null && (
        <button
          type="button"
          onClick={() => {
            // 월요일을 화~금에 복사. 대부분의 병원이 평일 시간이 같아서,
            // 같은 값을 네 번 더 고르는 일이 제일 지겹다.
            const mon = hours.mon!;
            onChange({ ...hours, tue: { ...mon }, wed: { ...mon }, thu: { ...mon }, fri: { ...mon } });
          }}
          style={{ ...smallBtn, marginBottom: 8 }}
        >
          월요일과 같게 (화~금)
        </button>
      )}
      <div style={{ display: "grid", gap: 6 }}>
        {DAYS.map(({ key, label }) => {
          const d = hours[key];
          const open = d != null;
          return (
            <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ width: 64, display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={open}
                  onChange={(e) =>
                    setDay(key, e.target.checked ? { open: "09:00", close: "18:00" } : null)
                  }
                />
                {label}
              </label>
              {open ? (
                <>
                  <TimeSelect value={d.open} onChange={(v) => setDay(key, { ...d, open: v })} />
                  <span>~</span>
                  <TimeSelect value={d.close} onChange={(v) => setDay(key, { ...d, close: v })} />
                  <span style={{ color: "#6b7280", fontSize: 12, marginLeft: 6 }}>점심</span>
                  <TimeSelect
                    value={d.lunchStart ?? ""}
                    placeholder="없음"
                    onChange={(v) => setDay(key, { ...d, lunchStart: v || null })}
                  />
                  <span>~</span>
                  <TimeSelect
                    value={d.lunchEnd ?? ""}
                    placeholder="없음"
                    onChange={(v) => setDay(key, { ...d, lunchEnd: v || null })}
                  />
                </>
              ) : (
                <span style={{ color: "#9ca3af", fontSize: 13 }}>휴진</span>
              )}
            </div>
          );
        })}
      </div>
      <input
        value={hours.note ?? ""}
        onChange={(e) => onChange({ ...hours, note: e.target.value })}
        placeholder="추가 안내 (예: 공휴일 휴진, 예약제 운영)"
        style={{ ...inp, width: "100%", marginTop: 10 }}
      />
    </div>
  );
}
