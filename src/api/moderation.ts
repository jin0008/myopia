import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ReportTargetType = "post" | "comment" | "poll" | "poll_comment" | "review";

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
