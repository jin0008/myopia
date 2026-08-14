import { useState, type CSSProperties, type ReactNode } from "react";

export interface FormTab {
  key: string;
  label: string;
  content: ReactNode;
}

/**
 * Tab strip for the hospital profile form.
 *
 * The form had grown to a dozen unrelated groups in one column — basics, photos,
 * hours, prices, notices — so setting up a clinic meant scrolling past
 * everything you weren't doing. Every tab stays mounted so a single Save still
 * submits the whole form; hidden panels are only visually hidden.
 */
export function FormTabs({
  tabs,
  onTabChange,
}: {
  tabs: FormTab[];
  /** Fires when the user moves to another tab — used to drop a save banner
   *  that would otherwise follow them into a tab they haven't saved. */
  onTabChange?: () => void;
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div style={strip}>
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                if (t.key !== active) onTabChange?.();
                setActive(t.key);
              }}
              style={{
                ...tabBtn,
                color: on ? "#0d47a1" : "#6b7280",
                fontWeight: on ? 700 : 500,
                borderBottomColor: on ? "#0d47a1" : "transparent",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.key} style={{ display: t.key === active ? "block" : "none", paddingTop: 18 }}>
          {t.content}
        </div>
      ))}
    </div>
  );
}

const strip: CSSProperties = {
  display: "flex",
  gap: 4,
  borderBottom: "1px solid #e5e7eb",
  overflowX: "auto",
};
const tabBtn: CSSProperties = {
  padding: "10px 16px",
  background: "none",
  border: "none",
  borderBottom: "2px solid transparent",
  cursor: "pointer",
  fontSize: 14,
  whiteSpace: "nowrap",
};
