import { useContext, useState, type CSSProperties } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  listAdminAnswers,
  listAdminComments,
  listAdminPosts,
  setContentHidden,
  type AdminBoard,
  type AdminPost,
  type HideKind,
  type PostShow,
} from "../api/moderation";

const FILTERS: { key: PostShow; label: string }[] = [
  { key: "live", label: "게시 중" },
  { key: "deleted", label: "숨김" },
  { key: "all", label: "전체" },
];

const CATEGORY_LABEL: Record<string, string> = {
  general: "시술/수술 질문",
  expert: "전문가 상담",
  chat: "자유수다",
  review: "치료후기",
};

/**
 * 커뮤니티 글 관리. 신고 처리(/admin/reports)는 들어온 신고만 보이는데,
 * 테스트 글·광고처럼 아무도 신고하지 않는 것도 지워야 해서 전체를 훑는다.
 * 숨기기는 앱의 삭제와 같아 되살릴 수 있다.
 *
 * 전문가 상담(/admin/expert)도 같은 화면을 board="expert" 로 쓴다 - 커뮤니티 글
 * 사이에 섞이면 찾기 어렵다. 그쪽은 펼치면 댓글 대신 병원 답변이 나온다.
 */
export default function AdminCommunity({ board = "community" }: { board?: AdminBoard }) {
  const expert = board === "expert";
  const { user } = useContext(UserContext);
  const qc = useQueryClient();
  const [show, setShow] = useState<PostShow>("live");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const posts = useInfiniteQuery({
    queryKey: ["admin", "community", board, show, q],
    queryFn: ({ pageParam }) => listAdminPosts({ q, show, board, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: user?.is_site_admin === true,
  });

  const hide = useMutation({
    mutationFn: (v: { kind: HideKind; id: string; hide: boolean }) =>
      setContentHidden(v.kind, v.id, v.hide),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "community"] }),
    onError: (e: any) => alert(e?.message ?? "처리하지 못했습니다."),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  const rows = posts.data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 1040, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={{ display: "inline-block", marginBottom: 12, color: "#6b7280" }}>
        ← myodoc 관리
      </a>
      <h1>{expert ? "전문가 상담 관리" : "커뮤니티 글 관리"}</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>
        {expert ? "앱 전문가 상담의 전체 질문입니다. 펼치면 병원 답변을 하나씩 숨길 수 있습니다." : "앱 커뮤니티의 전체 글입니다."} "숨기기"를 누르면 앱에서 바로 사라지고(앱의 삭제와 같음),
        숨김 목록에서 되살릴 수 있습니다.
      </p>

      <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap", alignItems: "center" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setShow(f.key)}
            style={{
              ...chip,
              borderColor: show === f.key ? "#0d47a1" : "#ddd",
              color: show === f.key ? "#0d47a1" : "#6b7280",
              fontWeight: show === f.key ? 700 : 500,
            }}
          >
            {f.label}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(input.trim());
          }}
          style={{ marginLeft: "auto", display: "flex", gap: 6 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="제목·본문·닉네임·이메일"
            style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8, width: 220 }}
          />
          <PrimaryButton type="submit">검색</PrimaryButton>
        </form>
      </div>

      {posts.isLoading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ color: "#9ca3af", marginTop: 16 }}>글이 없습니다.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>글</th>
              <th style={th}>작성자</th>
              <th style={th}>작성일</th>
              <th style={th}>{expert ? "답변" : "반응"}</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <PostRow
                key={p.id}
                p={p}
                open={openId === p.id}
                onToggle={() => setOpenId(openId === p.id ? null : p.id)}
                onHide={(kind, id, h) => {
                  const what = kind === "posts" ? "글" : kind === "answers" ? "병원 답변" : "댓글";
                  if (!h || confirm(`이 ${what}을 앱에서 숨길까요?`)) hide.mutate({ kind, id, hide: h });
                }}
              />
            ))}
          </tbody>
        </table>
      )}

      {posts.hasNextPage && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <PrimaryButton onClick={() => posts.fetchNextPage()} disabled={posts.isFetchingNextPage}>
            {posts.isFetchingNextPage ? "불러오는 중…" : "더 보기"}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

function PostRow({
  p,
  open,
  onToggle,
  onHide,
}: {
  p: AdminPost;
  open: boolean;
  onToggle: () => void;
  onHide: (kind: HideKind, id: string, hide: boolean) => void;
}) {
  const muted = p.deleted ? "#9ca3af" : "#111";
  return (
    <>
      <tr>
        <td style={{ ...td, maxWidth: 420 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {CATEGORY_LABEL[p.category] ?? p.category}
            {p.imageCount > 0 && ` · 사진 ${p.imageCount}`}
            {p.deleted && <span style={{ ...badge, marginLeft: 6 }}>숨김</span>}
          </div>
          <div style={{ fontWeight: 700, color: muted, marginTop: 2 }}>{p.title}</div>
          <div style={{ color: p.deleted ? "#9ca3af" : "#4b5563", fontSize: 13, lineHeight: 1.45, marginTop: 2 }}>
            {p.bodyPreview}
          </div>
          {!p.deleted && (
            <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#0d47a1" }}>
              앱에서 보기 ↗
            </a>
          )}
        </td>
        <td style={td}>
          <div>{p.authorNickname ?? "—"}</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>{p.authorEmail ?? ""}</div>
        </td>
        <td style={{ ...td, whiteSpace: "nowrap" }}>{p.createdAt.slice(0, 10)}</td>
        <td style={{ ...td, whiteSpace: "nowrap", fontSize: 13, color: "#4b5563" }}>
          <button onClick={onToggle} style={linkBtn}>
            {p.category === "expert" ? `병원 답변 ${p.answerCount}` : `댓글 ${p.commentCount}`} {open ? "▲" : "▼"}
          </button>
          <div>좋아요 {p.likeCount} · 조회 {p.viewCount}</div>
        </td>
        <td style={{ ...td, whiteSpace: "nowrap" }}>
          {p.deleted ? (
            <PrimaryButton onClick={() => onHide("posts", p.id, false)}>되살리기</PrimaryButton>
          ) : (
            <PrimaryNagativeButton onClick={() => onHide("posts", p.id, true)}>숨기기</PrimaryNagativeButton>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} style={{ ...td, background: "#f9fafb" }}>
            {p.category === "expert" ? (
              <Answers postId={p.id} onHide={onHide} />
            ) : (
              <Comments postId={p.id} onHide={onHide} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Comments({
  postId,
  onHide,
}: {
  postId: string;
  onHide: (kind: HideKind, id: string, hide: boolean) => void;
}) {
  const comments = useQuery({
    // 글 목록과 같은 키 아래에 두어, 숨기기 뒤 목록을 다시 받을 때 같이 갱신된다.
    queryKey: ["admin", "community", "comments", postId],
    queryFn: () => listAdminComments(postId),
  });
  if (comments.isLoading) return <div>Loading…</div>;
  if (!comments.data || comments.data.length === 0)
    return <div style={{ color: "#9ca3af" }}>댓글이 없습니다.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {comments.data.map((c) => (
        <div
          key={c.id}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            paddingLeft: c.parentCommentId ? 24 : 0,
          }}
        >
          <div style={{ flex: 1, color: c.deleted ? "#9ca3af" : "#111", fontSize: 14, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 700 }}>{c.parentCommentId ? "ㄴ " : ""}{c.authorNickname ?? "—"}</span>
            <span style={{ color: "#9ca3af", fontSize: 12 }}> · {c.createdAt.slice(0, 10)}</span>
            {c.deleted && <span style={{ ...badge, marginLeft: 6 }}>숨김</span>}
            <div>{c.body}</div>
          </div>
          {c.deleted ? (
            <button style={linkBtn} onClick={() => onHide("comments", c.id, false)}>
              되살리기
            </button>
          ) : (
            <button style={{ ...linkBtn, color: "#c62828" }} onClick={() => onHide("comments", c.id, true)}>
              숨기기
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** 전문가 상담 글엔 회원 댓글이 없고 병원 답변만 달린다. */
function Answers({
  postId,
  onHide,
}: {
  postId: string;
  onHide: (kind: HideKind, id: string, hide: boolean) => void;
}) {
  const answers = useQuery({
    queryKey: ["admin", "community", "answers", postId],
    queryFn: () => listAdminAnswers(postId),
  });
  if (answers.isLoading) return <div>Loading…</div>;
  if (!answers.data || answers.data.length === 0)
    return <div style={{ color: "#9ca3af" }}>병원 답변이 없습니다.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ color: "#6b7280", fontSize: 12 }}>
        숨긴 답변은 병원이 고쳐 쓸 수 없고, 여기서 되살려야 다시 보입니다.
      </div>
      {answers.data.map((a) => (
        <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1, color: a.deleted ? "#9ca3af" : "#111", fontSize: 14, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 700 }}>{a.hospitalName}</span>
            <span style={{ color: "#9ca3af", fontSize: 12 }}> · {a.createdAt.slice(0, 10)}</span>
            {a.deleted && <span style={{ ...badge, marginLeft: 6 }}>숨김</span>}
            <div style={{ whiteSpace: "pre-wrap" }}>{a.body}</div>
          </div>
          {a.deleted ? (
            <button style={linkBtn} onClick={() => onHide("answers", a.id, false)}>
              되살리기
            </button>
          ) : (
            <button style={{ ...linkBtn, color: "#c62828" }} onClick={() => onHide("answers", a.id, true)}>
              숨기기
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const chip: CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};
const badge: CSSProperties = {
  color: "#6b7280",
  background: "#6b728018",
  borderRadius: 999,
  padding: "1px 8px",
  fontSize: 11,
  fontWeight: 700,
};
const linkBtn: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#0d47a1",
  cursor: "pointer",
  fontSize: 13,
};
const th: CSSProperties = { textAlign: "left", borderBottom: "2px solid #eee", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8, verticalAlign: "top" };
