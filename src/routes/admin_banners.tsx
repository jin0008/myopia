import { useContext, useState, type CSSProperties, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
  type AdBanner,
  type BannerInput,
} from "../api/banner";

const EMPTY: BannerInput = {
  title: "",
  subtitle: "",
  badge_text: "",
  image_url: "",
  link_url: "",
  placement: "home",
  sort_order: 0,
  active: true,
};

export default function AdminBanners() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerInput>(EMPTY);

  const listQuery = useQuery({ queryKey: ["admin", "banners"], queryFn: listBanners });

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId ? updateBanner(editingId, form) : createBanner(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      reset();
    },
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function startEdit(b: AdBanner) {
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      badge_text: b.badge_text ?? "",
      image_url: b.image_url,
      link_url: b.link_url,
      placement: b.placement,
      sort_order: b.sort_order,
      active: b.active,
      start_at: b.start_at,
      end_at: b.end_at,
    });
  }

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  const setText = (k: keyof BannerInput) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSave =
    !!form.title.trim() && !!form.image_url.trim() && !!form.link_url.trim();

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>배너 관리</h1>

      <div style={card}>
        <h2>{editingId ? "배너 수정" : "새 배너"}</h2>
        <Field label="제목">
          <input value={form.title} onChange={setText("title")} style={inp} />
        </Field>
        <Field label="서브타이틀">
          <input value={form.subtitle} onChange={setText("subtitle")} style={inp} />
        </Field>
        <Field label="배지 텍스트 (예: 기간 할인)">
          <input value={form.badge_text} onChange={setText("badge_text")} style={inp} />
        </Field>
        <Field label="이미지 URL">
          <input value={form.image_url} onChange={setText("image_url")} style={inp} />
        </Field>
        <Field label="연결 링크 URL">
          <input value={form.link_url} onChange={setText("link_url")} style={inp} />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="노출 위치">
            <input
              value={form.placement}
              onChange={setText("placement")}
              style={inp}
              placeholder="home"
            />
          </Field>
          <Field label="정렬 순서 (낮을수록 먼저)">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
              }
              style={inp}
            />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="시작일시 (비우면 즉시)">
            <input
              type="datetime-local"
              value={form.start_at ? form.start_at.slice(0, 16) : ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  start_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
              style={inp}
            />
          </Field>
          <Field label="종료일시 (비우면 무기한)">
            <input
              type="datetime-local"
              value={form.end_at ? form.end_at.slice(0, 16) : ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  end_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
              style={inp}
            />
          </Field>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
          <input
            type="checkbox"
            checked={!!form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          활성 (체크 해제 시 앱에 노출되지 않음)
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <PrimaryButton onClick={() => canSave && saveMutation.mutate()}>
            {editingId ? "수정 저장" : "생성"}
          </PrimaryButton>
          {editingId && <PrimaryNagativeButton onClick={reset}>취소</PrimaryNagativeButton>}
        </div>
        {saveMutation.isError && <p style={{ color: "red" }}>저장에 실패했습니다.</p>}
      </div>

      <h2 style={{ marginTop: 28 }}>배너 목록</h2>
      {listQuery.isLoading ? (
        <div>Loading…</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>제목</th>
              <th style={th}>위치</th>
              <th style={th}>순서</th>
              <th style={th}>활성</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {listQuery.data?.map((b) => (
              <tr key={b.id}>
                <td style={td}>{b.title}</td>
                <td style={td}>{b.placement}</td>
                <td style={td}>{b.sort_order}</td>
                <td style={td}>{b.active ? "O" : "-"}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <PrimaryButton onClick={() => startEdit(b)}>수정</PrimaryButton>{" "}
                  <PrimaryNagativeButton
                    onClick={() => {
                      if (confirm("이 배너를 삭제할까요?")) delMutation.mutate(b.id);
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
