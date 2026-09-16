import { useContext, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  claimProfileForAccount,
  searchFacilities,
  setAccountFacility,
  type FacilityHit,
  type PartnerAccount,
  listPartnerAccounts,
  listUnclaimedProfiles,
  setPartnerAccountStatus,
  type PartnerAccountStatus,
} from "../api/partnerAccount";

export default function AdminPartnerAccounts() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["admin", "partnerAccounts"],
    queryFn: listPartnerAccounts,
  });

  // 온보딩은 어드민이 프로필을 먼저 채우는 것으로 시작한다. 그 병원이 나중에
  // 가입하면 미리 만들어 둔 프로필을 넘겨줘야 자기 손으로 관리할 수 있다.
  const unclaimedQuery = useQuery({
    queryKey: ["admin", "unclaimedProfiles"],
    queryFn: listUnclaimedProfiles,
  });

  // 광고가 쓰는 가게를 계정에 묶는다. 프로필(카카오 장소)과는 다른 번호다 -
  // 프로필을 넘겨줬다고 광고를 걸 수 있는 것은 아니다.
  const facilityMutation = useMutation({
    mutationFn: ({
      accountId,
      facility,
    }: {
      accountId: string;
      facility: { kind: "eye" | "optical"; key: string } | null;
    }) => setAccountFacility(accountId, facility),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] });
    },
    onError: (e: any) =>
      alert(
        e?.code === 409
          ? "다른 계정이 이미 이 가게를 쓰고 있습니다."
          : e?.code === 404
            ? "명부에서 찾을 수 없는 가게입니다. 다시 골라 주세요."
            : (e?.message ?? "묶지 못했습니다."),
      ),
  });

  const claimMutation = useMutation({
    mutationFn: ({ accountId, profileId }: { accountId: string; profileId: string }) =>
      claimProfileForAccount(accountId, profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] });
      qc.invalidateQueries({ queryKey: ["admin", "unclaimedProfiles"] });
      alert("프로필을 이 계정으로 넘겼습니다. 이제 병원이 직접 수정할 수 있습니다.");
    },
    onError: (e: any) => alert(e?.message ?? "이관 실패"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PartnerAccountStatus }) =>
      setPartnerAccountStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] }),
    onError: (e: any) => alert(e?.message ?? "변경 실패"),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={{ display: "inline-block", marginBottom: 12, color: "#6b7280" }}>
        ← myodoc 관리
      </a>
      <h1>병원 파트너 계정 승인</h1>
      <p style={{ color: "#6b7280", marginTop: -6 }}>
        가입한 병원 계정을 승인하면 해당 병원 프로필이 앱에 노출됩니다.
        ⚠️ 승인 전, "신청 병원명"과 "claim한 병원"이 실제로 일치하는지 꼭
        확인하세요 (아무 병원이나 claim 가능하므로 사칭 방지의 핵심 단계).
      </p>

      {listQuery.isLoading ? (
        <div>Loading…</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
          <thead>
            <tr>
              <th style={th}>신청 병원명</th>
              <th style={th}>claim한 병원 (place id)</th>
              <th style={th}>광고용 가게</th>
              <th style={th}>담당자</th>
              <th style={th}>이메일</th>
              <th style={th}>가입일</th>
              <th style={th}>상태</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {listQuery.data?.map((a) => (
              <tr key={a.id}>
                <td style={td}>
                  {/* 병원과 안경점이 한 목록에 섞인다. 안경점에는 프로필을
                      넘겨줄 것이 없으니, 어느 쪽인지 먼저 보여야 운영자가
                      할 일을 고를 수 있다. */}
                  <span style={bizTag(a.businessKind)}>
                    {a.businessKind === "optical" ? "안경점" : "병원"}
                  </span>{" "}
                  {a.hospitalName}
                </td>
                <td style={td}>
                  {a.claimedName ? (
                    <>
                      {a.claimedName}
                      <br />
                      <span style={{ color: "#9ca3af", fontSize: 12 }}>{a.claimedPlaceId}</span>
                    </>
                  ) : (
                    <div style={{ display: "grid", gap: 4 }}>
                      <span style={{ color: "#9ca3af" }}>미작성</span>
                      {(unclaimedQuery.data?.profiles.length ?? 0) > 0 && (
                        <select
                          defaultValue=""
                          disabled={claimMutation.isPending}
                          onChange={(e) => {
                            const profileId = e.target.value;
                            e.target.value = "";
                            if (!profileId) return;
                            if (!confirm("이 프로필을 해당 병원 계정으로 넘길까요? 이후 병원이 직접 수정하게 됩니다."))
                              return;
                            claimMutation.mutate({ accountId: a.id, profileId });
                          }}
                          style={select}
                        >
                          <option value="">기존 프로필 넘기기…</option>
                          {unclaimedQuery.data?.profiles.map((pf) => (
                            <option key={pf.id} value={pf.id}>
                              {pf.name}
                              {pf.address ? ` · ${pf.address}` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </td>
                <td style={td}>
                  <FacilityCell
                    account={a}
                    busy={facilityMutation.isPending}
                    onSet={(facility) =>
                      facilityMutation.mutate({ accountId: a.id, facility })
                    }
                  />
                </td>
                <td style={td}>{a.contactName}</td>
                <td style={td}>{a.email}</td>
                <td style={td}>{a.createdAt.slice(0, 10)}</td>
                <td style={td}>
                  <span style={badge(a.status)}>{STATUS_LABEL[a.status]}</span>
                </td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {a.status !== "approved" && (
                    <PrimaryButton
                      onClick={() => statusMutation.mutate({ id: a.id, status: "approved" })}
                    >
                      승인
                    </PrimaryButton>
                  )}{" "}
                  {a.status !== "rejected" && (
                    <PrimaryNagativeButton
                      onClick={() => statusMutation.mutate({ id: a.id, status: "rejected" })}
                    >
                      거절
                    </PrimaryNagativeButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const select: CSSProperties = {
  padding: "4px 6px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 12,
  maxWidth: 260,
};

const STATUS_LABEL: Record<PartnerAccountStatus, string> = {
  pending: "승인 대기",
  approved: "승인됨",
  rejected: "거절됨",
};

/**
 * 계정에 묶인 광고용 가게 한 칸.
 *
 * 번호를 손으로 적게 하지 않는다 - 25자짜리 인허가번호는 한 글자만 빠져도
 * 아무 데도 안 붙고, 등록은 성공한 것처럼 보인다. 이미 한 번 그렇게 당했다.
 */
function FacilityCell({
  account,
  busy,
  onSet,
}: {
  account: PartnerAccount;
  busy: boolean;
  onSet: (facility: { kind: "eye" | "optical"; key: string } | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<FacilityHit[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function run() {
    if (term.trim().length < 2) return;
    setSearching(true);
    try {
      setHits(await searchFacilities(term.trim()));
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }

  if (account.facilityKey != null && !open) {
    return (
      <div>
        <b>{account.facilityName ?? "(명부에 없는 번호)"}</b>
        <div style={{ color: "#8a93a1", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>
          {account.facilityKey}
        </div>
        <button type="button" style={linkBtn} disabled={busy} onClick={() => setOpen(true)}>
          바꾸기
        </button>{" "}
        <button
          type="button"
          style={linkBtn}
          disabled={busy}
          onClick={() => {
            // 풀면 그 계정은 더 신청할 수 없다. 이미 걸린 광고는 그대로다 -
            // 돈을 받은 기간까지는 나가야 한다.
            if (confirm("묶음을 풀면 이 계정은 프리미엄을 신청할 수 없습니다. 이미 걸린 광고는 그대로 나갑니다.")) {
              onSet(null);
            }
          }}
        >
          풀기
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" style={linkBtn} disabled={busy} onClick={() => setOpen(true)}>
        가게 묶기
      </button>
    );
  }

  return (
    <div style={{ minWidth: 240 }}>
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void run();
          }
        }}
        placeholder="상호 또는 주소"
        style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 8px", fontSize: 13, width: "100%" }}
      />
      <div style={{ marginTop: 4 }}>
        <button type="button" style={linkBtn} disabled={term.trim().length < 2 || searching} onClick={() => void run()}>
          {searching ? "찾는 중…" : "찾기"}
        </button>{" "}
        <button type="button" style={linkBtn} onClick={() => { setOpen(false); setHits(null); setTerm(""); }}>
          닫기
        </button>
      </div>
      {hits != null &&
        (hits.length === 0 ? (
          <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>찾지 못했습니다.</div>
        ) : (
          <div style={{ border: "1px solid #eee", borderRadius: 6, maxHeight: 160, overflowY: "auto", marginTop: 4 }}>
            {hits.map((h) => (
              <button
                key={h.kind + h.key}
                type="button"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: 0,
                  borderBottom: "1px solid #f4f4f4",
                  background: "none",
                  padding: "6px 8px",
                  cursor: "pointer",
                  fontSize: 13,
                }}
                disabled={busy}
                onClick={() => {
                  onSet({ kind: h.kind, key: h.key });
                  setOpen(false);
                  setHits(null);
                  setTerm("");
                }}
              >
                <b>{h.name}</b>
                <div style={{ color: "#666", fontSize: 11.5 }}>{h.address}</div>
              </button>
            ))}
          </div>
        ))}
    </div>
  );
}

const linkBtn: CSSProperties = {
  border: 0,
  background: "none",
  color: "#1a73e8",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

function bizTag(kind: "hospital" | "optical"): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    color: kind === "optical" ? "#1c5a7c" : "#5b6472",
    background: kind === "optical" ? "#e6f1f7" : "#eef1f6",
    borderRadius: 4,
    padding: "1px 6px",
  };
}

function badge(status: PartnerAccountStatus): CSSProperties {
  const color =
    status === "approved" ? "#0d7d6f" : status === "rejected" ? "#b3261e" : "#a2610a";
  return {
    color,
    background: color + "18",
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 700,
  };
}

const th: CSSProperties = { textAlign: "left", borderBottom: "2px solid #eee", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8 };
