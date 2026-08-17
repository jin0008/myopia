import { useEffect, useState, type CSSProperties } from "react";

import type { ProfileEditorApi } from "../api/profileEditorApi";
import type { PartnerNotice } from "../api/partner";

interface Draft {
  title: string;
  body: string;
  kind: "notice" | "event";
  pinned: boolean;
}

const EMPTY: Draft = { title: "", body: "", kind: "notice", pinned: false };

/**
 * 병원이 직접 쓰는 소식.
 *
 * 서버가 로그인한 주체(파트너 계정 또는 myopia 병원 관리자)에서 프로필을
 * 찾으므로 이 컴포넌트는 프로필 id를 다루지 않는다 - 자기 병원 소식 외에는
 * 손댈 수 없다. 어느 쪽으로 로그인했는지는 `api`가 들고 있다.
 */
export function PartnerNoticesEditor({ api }: { api: ProfileEditorApi }) {
  const [rows, setRows] = useState<PartnerNotice[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = () => {
    api.listNotices()
      .then((r) => setRows(r.notices))
      .catch(() => setRows([]));
  };

  // api는 로그인 상태로 정해지고 렌더 중 바뀌지 않는다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, []);

  const add = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      setErr("제목과 내용을 입력하세요.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api.createNotice(draft);
      setDraft(EMPTY);
      reload();
    } catch (e: any) {
      // 409 = the profile hasn't been saved yet, so there's nothing to hang a
      // notice off. Say that rather than showing a bare error.
      setErr(
        e?.status === 409
          ? "프로필을 먼저 저장한 뒤 소식을 등록할 수 있습니다."
          : (e?.message ?? "등록 실패"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p style={hint}>
        재개원 안내, 원장 변경, 이벤트처럼 앱 병원 상세에 노출할 소식입니다. 고정한 소식이 항상 위에
        표시됩니다.
      </p>

      <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={draft.kind}
            onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as Draft["kind"] }))}
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
        {err && <p style={{ color: "#b3261e", fontSize: 13, margin: 0 }}>{err}</p>}
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
                <label style={check}>
                  <input
                    type="checkbox"
                    checked={n.pinned}
                    onChange={async (e) => {
                      await api.updateNotice(n.id, { pinned: e.target.checked });
                      reload();
                    }}
                  />
                  고정
                </label>
                <label style={check}>
                  <input
                    type="checkbox"
                    checked={n.published}
                    onChange={async (e) => {
                      await api.updateNotice(n.id, { published: e.target.checked });
                      reload();
                    }}
                  />
                  노출
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("이 소식을 삭제할까요?")) return;
                    await api.deleteNotice(n.id);
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
const check: CSSProperties = { fontSize: 12, display: "flex", gap: 4, alignItems: "center" };
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
