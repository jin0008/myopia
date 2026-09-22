import { useContext, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  createColumn,
  deleteColumn,
  listColumns,
  updateColumn,
  type ColumnInput,
  type ExpertColumn,
} from "../api/column";

// 앱(myodoc src/features/columns/ColumnIcon.tsx)이 아이콘을 그리는 분류.
// 앱의 칼럼 그림은 이 분류로 정해진다. 이모지는 따로 고르지 않고 분류를
// 고를 때 같이 들어간다 - 고를 수 있게 두면 바꿔도 앱에 티가 나지 않아
// 헷갈린다.
const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: "atropine", label: "아트로핀", emoji: "💧" },
  { key: "orthok", label: "드림렌즈", emoji: "🌙" },
  { key: "myopia_lenses", label: "근시 억제 안경·렌즈", emoji: "👓" },
  { key: "lifestyle", label: "생활습관", emoji: "☀️" },
  { key: "basics", label: "근시 기본", emoji: "👁️" },
  { key: "checkup", label: "검진·안축장", emoji: "📏" },
  { key: "emergency", label: "응급·경고 증상", emoji: "🚨" },
  { key: "strabismus", label: "사시", emoji: "👀" },
];

const EMPTY: ColumnInput = {
  title: "",
  body: "",
  category: "",
  author: "마이오닥 의료진",
  author_role: "안과 감수",
  thumbnail_emoji: "📄",
  published: true,
};

export default function AdminColumns() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ColumnInput>(EMPTY);

  const listQuery = useQuery({ queryKey: ["admin", "columns"], queryFn: listColumns });

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId ? updateColumn(editingId, form) : createColumn(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "columns"] });
      reset();
    },
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteColumn(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "columns"] }),
  });

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function startEdit(c: ExpertColumn) {
    setEditingId(c.id);
    setForm({
      title: c.title,
      body: c.body,
      category: c.category,
      author: c.author,
      author_role: c.author_role,
      thumbnail_emoji: c.thumbnail_emoji,
      published: c.published,
    });
  }

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  const set = (k: keyof ColumnInput) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSave = !!form.title.trim() && !!form.body.trim() && !!form.category.trim();

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>칼럼 관리</h1>

      <div style={card}>
        <h2>{editingId ? "칼럼 수정" : "새 칼럼"}</h2>
        <Field label="제목">
          <input value={form.title} onChange={set("title")} style={inp} />
        </Field>
        <Field label="카테고리">
          <select
            value={form.category}
            // 분류를 고르면 어울리는 이모지를 같이 넣는다.
            onChange={(e) => {
              const cat = CATEGORIES.find((x) => x.key === e.target.value);
              setForm((f) => ({ ...f, category: e.target.value, thumbnail_emoji: cat?.emoji ?? f.thumbnail_emoji }));
            }}
            style={inp}
          >
            <option value="" disabled>
              선택하세요
            </option>
            {CATEGORIES.map((x) => (
              <option key={x.key} value={x.key}>
                {x.emoji} {x.label}
              </option>
            ))}
            {/* 목록에 없는 분류로 쓴 옛 칼럼도 고칠 수 있게 그 값을 남긴다. */}
            {form.category && !CATEGORIES.some((x) => x.key === form.category) && (
              <option value={form.category}>{form.category}</option>
            )}
          </select>
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="저자">
            <input value={form.author} onChange={set("author")} style={inp} />
          </Field>
          <Field label="저자 역할">
            <input value={form.author_role} onChange={set("author_role")} style={inp} />
          </Field>
        </div>
        <Field label="본문 (마크다운)">
          <textarea
            value={form.body}
            onChange={set("body")}
            style={{ ...inp, height: 240, fontFamily: "monospace" }}
          />
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
          <input
            type="checkbox"
            checked={!!form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
          />
          게시 (체크 해제 시 앱에 노출되지 않음)
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <PrimaryButton
            onClick={() => canSave && saveMutation.mutate()}
          >
            {editingId ? "수정 저장" : "생성"}
          </PrimaryButton>
          {editingId && <PrimaryNagativeButton onClick={reset}>취소</PrimaryNagativeButton>}
        </div>
        {saveMutation.isError && <p style={{ color: "red" }}>저장에 실패했습니다.</p>}
      </div>

      <h2 style={{ marginTop: 28 }}>칼럼 목록</h2>
      {listQuery.isLoading ? (
        <div>Loading…</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>제목</th>
              <th style={th}>카테고리</th>
              <th style={th}>게시</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {listQuery.data?.map((c) => (
              <tr key={c.id}>
                <td style={td}>
                  {c.thumbnail_emoji} {c.title}
                </td>
                <td style={td}>{CATEGORIES.find((x) => x.key === c.category)?.label ?? c.category}</td>
                <td style={td}>{c.published ? "O" : "-"}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <PrimaryButton onClick={() => startEdit(c)}>수정</PrimaryButton>{" "}
                  <PrimaryNagativeButton
                    onClick={() => {
                      if (confirm("이 칼럼을 삭제할까요?")) delMutation.mutate(c.id);
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

const card: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  marginTop: 12,
};
const inp: CSSProperties = {
  width: "100%",
  padding: 8,
  border: "1px solid #ccc",
  borderRadius: 6,
  boxSizing: "border-box",
};
const th: CSSProperties = { textAlign: "left", borderBottom: "2px solid #eee", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8 };
