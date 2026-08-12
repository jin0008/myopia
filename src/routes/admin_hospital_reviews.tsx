import { useContext, type CSSProperties } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  listHospitalReviews,
  setReviewStatus,
  type HospitalReview,
} from "../api/hospitalProfile";

export default function AdminHospitalReviews() {
  const { user } = useContext(UserContext);
  const { placeId = "" } = useParams();
  const qc = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ["admin", "hospitalReviews", placeId],
    queryFn: () => listHospitalReviews(placeId),
    enabled: !!placeId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "visible" | "hidden" }) =>
      setReviewStatus(id, status),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "hospitalReviews", placeId] }),
    onError: (e: any) => alert(e?.message ?? "변경 실패"),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <a
        href="/admin/hospital-profiles"
        style={{ display: "inline-block", marginBottom: 12, color: "#6b7280" }}
      >
        ← 병원 프로필 관리
      </a>
      <h1>리뷰 관리</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>
        place id: {placeId}. 신고되거나 부적절한 리뷰를 숨길 수 있습니다.
      </p>

      {reviewsQuery.isLoading ? (
        <div>Loading…</div>
      ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
        reviewsQuery.data.map((r: HospitalReview) => (
          <div key={r.id} style={{ ...reviewCard, opacity: r.status === "hidden" ? 0.5 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</strong>
              <span style={{ color: "#9ca3af", fontSize: 12 }}>
                {r.created_at.slice(0, 10)} · {r.status === "hidden" ? "숨김" : "노출"}
              </span>
            </div>
            <p style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>{r.content}</p>
            {r.images.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {r.images.map((url, i) => (
                  <img key={i} src={url} alt="" style={img} />
                ))}
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              {r.status === "visible" ? (
                <PrimaryNagativeButton
                  onClick={() => statusMutation.mutate({ id: r.id, status: "hidden" })}
                >
                  숨기기
                </PrimaryNagativeButton>
              ) : (
                <PrimaryButton
                  onClick={() => statusMutation.mutate({ id: r.id, status: "visible" })}
                >
                  다시 노출
                </PrimaryButton>
              )}
            </div>
          </div>
        ))
      ) : (
        <div style={{ color: "#9ca3af", marginTop: 16 }}>아직 리뷰가 없습니다.</div>
      )}
    </div>
  );
}

const reviewCard: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
  marginTop: 12,
};
const img: CSSProperties = { maxWidth: 120, maxHeight: 120, borderRadius: 6 };
