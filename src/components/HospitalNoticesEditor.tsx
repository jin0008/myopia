import { useEffect, useState, type CSSProperties } from "react";

import {
  createHospitalNotice,
  deleteHospitalNotice,
  listHospitalNotices,
  updateHospitalNotice,
  type HospitalNotice,
} from "../api/hospitalProfile";

const EMPTY = { title: "", body: "", kind: "notice" as const, pinned: false };

/**
 * Clinic notices, managed from the admin profile page.
 *
 * Lives outside the profile form because notices are their own records with
 * their own lifetime — saving the profile shouldn't rewrite them, and adding
 * one shouldn't require re-saving everything else. Only available once the
 * profile exists, since a notice has to hang off one.
 */
export function HospitalNoticesEditor({ profileId }: { profileId: string | null }) {
  const [rows, setRows] = useState<HospitalNotice[]>([]);
  const [draft, setDraft] = useState<typeof EMPTY>(EMPTY);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    if (!profileId) return;
    listHospitalNotices(profileId)
      .then(setRows)
      .catch(() => setRows([]));
  };

  useEffect(reload, [profileId]);

  if (!profileId) {
    return (
      <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
        프로필을 먼저 저장하면 소식을 등록할 수 있습니다.
      </p>
    );
  }

  const add = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }
    setBusy(true);
    try {
      await createHospitalNotice(profileId, draft);
      setDraft(EMPTY);
      reload();
    } catch (e: any) {
      alert(e?.message ?? "등록 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: 12, margin: "0 0 10px" }}>
        재개원 안내, 원장 변경, 이벤트처럼 앱 병원 상세에 노출할 소식입니다. 고정한 소식이 항상 위에
        표시됩니다.
      </p>

      <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={draft.kind}
            onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as "notice" | "event" }))}
            style={{ ...inp, flex: "0 0 110px" }}
          >
            <option value="notice">공지</option>
            <option value="event">이벤트</option>
          </select>
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="제목 (예: 8월 휴진 안내)"
            style={{ ...inp, flex: 1 }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={draft.pinned}
              onChange={(e) => setDraft((d) => ({ ...d, pinned: e.target.checked }))}
            />
            고정
          </label>
        </div>
        <textarea
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          placeholder="내용"
          rows={4}
          style={{ ...inp, width: "100%", resize: "vertical" }}
        />
        <div>
          <button type="button" onClick={add} disabled={busy} style={addBtn}>
            소식 추가
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 13 }}>등록된 소식이 없습니다.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((n) => (
            <div key={n.id} style={card}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={badge(n.kind)}>{n.kind === "event" ? "이벤트" : "공지"}</span>
                <strong style={{ flex: 1 }}>{n.title}</strong>
                <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={n.pinned}
                    onChange={async (e) => {
                      await updateHospitalNotice(n.id, { pinned: e.target.checked });
                      reload();
                    }}
                  />
                  고정
                </label>
                <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={n.published}
                    onChange={async (e) => {
                      await updateHospitalNotice(n.id, { published: e.target.checked });
                      reload();
                    }}
                  />
                  노출
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("이 소식을 삭제할까요?")) return;
                    await deleteHospitalNotice(n.id);
                    reload();
                  }}
                  style={delBtn}
                >
                  삭제
                </button>
              </div>
              <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", color: "#374151", fontSize: 13 }}>
                {n.body}
              </p>
              <span style={{ color: "#9ca3af", fontSize: 11 }}>{n.createdAt.slice(0, 10)}</span>
            </div>
          ))}
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
const card: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
};
const addBtn: CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #0d47a1",
  background: "#0d47a1",
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
const delBtn: CSSProperties = {
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #e0245e",
  background: "#fff",
  color: "#e0245e",
  cursor: "pointer",
  fontSize: 12,
};
function badge(kind: string): CSSProperties {
  return {
    background: kind === "event" ? "#FDE9C8" : "#FFF6B8",
    color: "#36475A",
    borderRadius: 6,
    padding: "1px 8px",
    fontSize: 12,
    fontWeight: 700,
  };
}
