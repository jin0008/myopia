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
          <input
            value={form.category}
            onChange={set("category")}
            style={inp}
            placeholder="예: atropine, lifestyle, basics"
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="이모지">
            <input value={form.thumbnail_emoji} onChange={set("thumbnail_emoji")} style={{ ...inp, width: 90 }} />
          </Field>
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
                <td style={td}>{c.category}</td>
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
