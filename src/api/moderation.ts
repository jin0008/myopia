import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ReportTargetType = "post" | "comment" | "poll" | "poll_comment" | "review" | "answer";

export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  createdAt: string;
  /** Snippet of the reported content, so the queue is judgeable in place. */
  preview: string | null;
  /** Opens the content on the public web build; null if it no longer exists. */
  contentUrl: string | null;
  /** Already hidden or deleted — usually nothing left to do. */
  contentGone: boolean;
}

export const TARGET_LABEL: Record<ReportTargetType, string> = {
  post: "게시글",
  comment: "댓글",
  poll: "투표",
  poll_comment: "투표 댓글",
  review: "병원 리뷰",
  answer: "병원 답변",
};

export const REASON_LABEL: Record<string, string> = {
  spam: "스팸·광고",
  abuse: "욕설·비방",
  sexual: "선정적인 내용",
  medical_misinfo: "잘못된 의학정보",
  privacy: "개인정보 노출",
  other: "기타",
};

export function listReports(status: ReportStatus | "all"): Promise<ContentReport[]> {
  return jsonFetchWithSession(
    API_ROOT + "/moderation/reports?status=" + encodeURIComponent(status),
  );
}

export function resolveReport(
  id: string,
  body: { status: ReportStatus; hideContent?: boolean },
): Promise<{ id: string; status: ReportStatus }> {
  return jsonFetchWithSession(
    API_ROOT + "/moderation/reports/" + id,
    { method: "PATCH" },
    body,
  );
}

/* ---- 커뮤니티 글 관리 ---- */

export type PostShow = "live" | "deleted" | "all";

export interface AdminPost {
  id: string;
  title: string;
  bodyPreview: string;
  category: string;
  imageCount: number;
  authorId: string;
  authorNickname: string | null;
  authorEmail: string | null;
  createdAt: string;
  deleted: boolean;
  commentCount: number;
  /** 전문가 상담 글의 병원 답변(숨긴 것 빼고). */
  answerCount: number;
  likeCount: number;
  viewCount: number;
  /** 앱 웹(myodoc.co.kr)에서 그 글. 숨긴 글은 열어도 없다고 나온다. */
  url: string;
}

export interface AdminComment {
  id: string;
  parentCommentId: string | null;
  body: string;
  authorNickname: string | null;
  createdAt: string;
  deleted: boolean;
}

export function listAdminPosts(params: {
  q: string;
  show: PostShow;
  cursor?: string;
}): Promise<{ posts: AdminPost[]; nextCursor: string | null }> {
  const qs = new URLSearchParams({ q: params.q, show: params.show });
  if (params.cursor) qs.set("cursor", params.cursor);
  return jsonFetchWithSession(API_ROOT + "/moderation/posts?" + qs.toString());
}

export interface AdminAnswer {
  id: string;
  body: string;
  hospitalName: string;
  createdAt: string;
  deleted: boolean;
}

export function listAdminAnswers(postId: string): Promise<AdminAnswer[]> {
  return jsonFetchWithSession(API_ROOT + "/moderation/posts/" + postId + "/answers");
}

export function listAdminComments(postId: string): Promise<AdminComment[]> {
  return jsonFetchWithSession(API_ROOT + "/moderation/posts/" + postId + "/comments");
}

export type HideKind = "posts" | "comments" | "answers";

/** 숨기기(hide=true)·되살리기. 앱의 삭제와 같은 숨김이라 되돌릴 수 있다. */
export function setContentHidden(
  kind: HideKind,
  id: string,
  hide: boolean,
): Promise<void> {
  return jsonFetchWithSession(
    API_ROOT + `/moderation/${kind}/${id}` + (hide ? "" : "/restore"),
    { method: hide ? "DELETE" : "POST" },
    undefined,
    false,
  );
}
