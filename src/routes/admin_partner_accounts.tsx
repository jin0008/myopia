import { useContext, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import { OPTICAL_BRANDS } from "../api/partner";
import {
  claimProfileForAccount,
  setAccountBrands,
  setAccountFacility,
  type PartnerAccount,
  listPartnerAccounts,
  listUnclaimedProfiles,
  setPartnerAccountStatus,
  type PartnerAccountStatus,
} from "../api/partnerAccount";

/**
 * 파트너 계정.
 *
 * 병원과 안경원을 한 표에 넣지 않는다. 둘은 볼 것이 다르다 - 안경원에는
 * 프로필도 치료탭 노출도 없어서, 같은 표에 두면 행의 절반이 빈칸이 되고
 * 그 빈칸을 설명하느라 화면 위에 문단이 붙는다. 설명을 읽어야 쓸 수 있는
 * 화면은 실패한 화면이다.
 *
 * 그 둘을 위아래로 쌓았더니 이번에는 아래 표가 위 표의 이어짐으로 읽혔다 -
 * 병원 목록을 보다 스크롤하면 칸 이름이 달라지는데, 그것을 알아채기 전까지는
 * 같은 표로 본다. 탭으로 나눠 한 번에 하나만 보인다.
 *
 * 업체 연결은 여기서 하지 않는다. 인증 심사에서 서류를 보고 승인할 때만
 * 생긴다 - 서류 없이 손으로 묶는 길이 남아 있으면 인증 절차를 만든 뜻이
 * 절반 사라진다. 여기서는 결과를 보여 주고, 잘못된 것을 푸는 것만 한다.
 */
export default function AdminPartnerAccounts() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"hospital" | "optical">("hospital");

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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PartnerAccountStatus }) =>
      setPartnerAccountStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] }),
    onError: (e: any) => alert(e?.message ?? "변경 실패"),
  });

  const unlinkMutation = useMutation({
    mutationFn: (accountId: string) => setAccountFacility(accountId, null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] }),
    onError: (e: any) => alert(e?.message ?? "해제하지 못했습니다."),
  });

  const brandsMutation = useMutation({
    mutationFn: ({ accountId, brands }: { accountId: string; brands: string[] }) =>
      setAccountBrands(accountId, brands),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] }),
    onError: (e: any) => alert(e?.message ?? "바꾸지 못했습니다."),
  });

  const claimMutation = useMutation({
    mutationFn: ({ accountId, profileId }: { accountId: string; profileId: string }) =>
      claimProfileForAccount(accountId, profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partnerAccounts"] });
      qc.invalidateQueries({ queryKey: ["admin", "unclaimedProfiles"] });
    },
    onError: (e: any) => alert(e?.message ?? "넘기지 못했습니다."),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>Not authorized</div>;
  }

  const rows = listQuery.data ?? [];
  const hospitals = rows.filter((a) => a.businessKind !== "optical");
  const opticals = rows.filter((a) => a.businessKind === "optical");
  const unclaimed = unclaimedQuery.data?.profiles ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <a href="/admin/myodoc" style={backLink}>
        ← 마이오닥 관리
      </a>
      <h1 style={{ marginBottom: 4 }}>파트너 계정</h1>
      <p style={desc}>
        업체 연결은 <a href="/admin/verifications">업체 인증 심사</a>에서
        서류를 보고 승인할 때 생깁니다. 여기서는 결과를 보고, 잘못된 것을
        풀기만 합니다.
      </p>

      {listQuery.isLoading ? (
        <div>Loading…</div>
      ) : (
        <>
          <div style={tabRow}>
            <button style={tabBtn(tab === "hospital")} onClick={() => setTab("hospital")}>
              병원 {hospitals.length}
            </button>
            <button style={tabBtn(tab === "optical")} onClick={() => setTab("optical")}>
              안경원 {opticals.length}
            </button>
          </div>

          <div style={{ display: tab === "hospital" ? "block" : "none" }}>
          <p style={desc}>
            <b>치료탭 노출</b>을 켜면 그 병원 프로필이 앱 치료탭에 보입니다.
            프로필의 카카오 장소는 병원이 직접 고르므로, 켜기 전에 상호와
            프로필이 같은 곳인지 확인하세요.
          </p>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>상호 · 담당자</th>
                <th style={th}>프로필</th>
                <th style={th}>치료탭 노출</th>
                <th style={th}>인증된 업체</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.length === 0 ? (
                <tr>
                  <td style={td} colSpan={4}>
                    아직 없습니다.
                  </td>
                </tr>
              ) : (
                hospitals.map((a) => (
                  <tr key={a.id}>
                    <Who a={a} />
                    <td style={td}>
                      {a.claimedName ? (
                        <>
                          {a.claimedName}
                          <div style={sub}>{a.claimedPlaceId}</div>
                        </>
                      ) : (
                        <div style={{ display: "grid", gap: 4 }}>
                          <span style={{ color: "#9ca3af" }}>미작성</span>
                          {/* 온보딩용으로 미리 만들어 둔 프로필이 있을 때만
                              보인다. 없으면 고를 것이 없는 빈 상자다. */}
                          {unclaimed.length > 0 && (
                            <select
                              defaultValue=""
                              disabled={claimMutation.isPending}
                              onChange={(e) => {
                                const profileId = e.target.value;
                                e.target.value = "";
                                if (!profileId) return;
                                if (
                                  !confirm(
                                    "이 프로필을 해당 병원 계정으로 넘길까요? 이후 병원이 직접 수정하게 됩니다.",
                                  )
                                )
                                  return;
                                claimMutation.mutate({ accountId: a.id, profileId });
                              }}
                              style={select}
                            >
                              <option value="">기존 프로필 넘기기…</option>
                              {unclaimed.map((pf) => (
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
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <span style={badge(a.status)}>{HOSPITAL_LABEL[a.status]}</span>
                      <div style={{ marginTop: 6 }}>
                        {a.status !== "approved" && (
                          <PrimaryButton
                            onClick={() =>
                              statusMutation.mutate({ id: a.id, status: "approved" })
                            }
                          >
                            노출
                          </PrimaryButton>
                        )}{" "}
                        {a.status !== "rejected" && (
                          <PrimaryNagativeButton
                            onClick={() =>
                              statusMutation.mutate({ id: a.id, status: "rejected" })
                            }
                          >
                            숨김
                          </PrimaryNagativeButton>
                        )}
                      </div>
                    </td>
                    <Facility
                      a={a}
                      busy={unlinkMutation.isPending}
                      onUnlink={() => unlinkMutation.mutate(a.id)}
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>

          </div>

          <div style={{ display: tab === "optical" ? "block" : "none" }}>
          <p style={desc}>
            안경원에는 프로필도 치료탭 노출도 없습니다. 업체가 인증되면 바로
            프리미엄을 신청할 수 있습니다.
          </p>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>상호 · 담당자</th>
                <th style={th}>인증된 업체</th>
                <th style={th}>취급 브랜드</th>
                <th style={th}>프리미엄 신청</th>
              </tr>
            </thead>
            <tbody>
              {opticals.length === 0 ? (
                <tr>
                  <td style={td} colSpan={4}>
                    아직 없습니다.
                  </td>
                </tr>
              ) : (
                opticals.map((a) => (
                  <tr key={a.id}>
                    <Who a={a} />
                    <Facility
                      a={a}
                      busy={unlinkMutation.isPending}
                      onUnlink={() => unlinkMutation.mutate(a.id)}
                    />
                    {/* 인증 심사에서 정하지만, 나중에 들여오거나 그만
                        취급할 수 있다. 여기서 고친다. */}
                    <td style={td}>
                      {OPTICAL_BRANDS.map((b) => (
                        <label
                          key={b.key}
                          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                        >
                          <input
                            type="checkbox"
                            checked={a.brands.includes(b.key)}
                            disabled={brandsMutation.isPending}
                            onChange={(e) =>
                              brandsMutation.mutate({
                                accountId: a.id,
                                brands: e.target.checked
                                  ? [...a.brands, b.key]
                                  : a.brands.filter((x) => x !== b.key),
                              })
                            }
                          />
                          {b.label}
                        </label>
                      ))}
                    </td>
                    <td style={td}>
                      {a.facilityKey != null ? (
                        <span style={badge("approved")}>가능</span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                          인증 전이라 불가
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}

/** 누구인지. 두 표가 같은 모양이어야 훑을 때 눈이 안 튄다. */
function Who({ a }: { a: PartnerAccount }) {
  return (
    <td style={td}>
      <b>{a.hospitalName}</b>
      <div style={sub}>
        {a.contactName} · {a.email}
      </div>
      <div style={sub}>{a.createdAt.slice(0, 10)} 가입</div>
    </td>
  );
}

/**
 * 인증으로 묶인 업체.
 *
 * 여기서 새로 묶지 않는다. 푸는 것만 남긴다 - 잘못 승인한 것을 정리할
 * 길은 있어야 한다.
 */
function Facility({
  a,
  busy,
  onUnlink,
}: {
  a: PartnerAccount;
  busy: boolean;
  onUnlink: () => void;
}) {
  if (a.facilityKey == null) {
    return (
      <td style={td}>
        <span style={{ color: "#9ca3af" }}>미인증</span>
        <div style={sub}>
          <a href="/admin/verifications">인증 심사에서 처리</a>
        </div>
      </td>
    );
  }
  return (
    <td style={td}>
      <b>{a.facilityName ?? "(명부에 없는 번호)"}</b>
      {/* 주소 없이는 어느 가게인지 확정할 수 없다. "명안경원"만 해도 전국에
          열두 곳이다. 서버가 이미 명부에서 끌어와 보내고 있다. */}
      {a.facilityAddress ? <div style={sub}>{a.facilityAddress}</div> : null}
      <div style={{ ...sub, fontFamily: "monospace", wordBreak: "break-all" }}>
        {a.facilityKey}
      </div>
      <button
        type="button"
        style={linkBtn}
        disabled={busy}
        onClick={() => {
          // 풀면 그 계정은 더 신청할 수 없다. 이미 걸린 광고는 그대로다 -
          // 돈을 받은 기간까지는 나가야 한다.
          if (
            confirm(
              "연결을 해제하면 이 계정은 프리미엄을 신청할 수 없습니다. 이미 걸린 광고는 기간이 끝날 때까지 그대로 나갑니다.",
            )
          ) {
            onUnlink();
          }
        }}
      >
        연결 해제
      </button>
    </td>
  );
}

/** 이 상태가 정하는 것은 치료탭에 프로필이 보이느냐 하나다. 안경원 표에는
 *  이 칸이 없다 - 노출시킬 프로필이 없어 '노출 중'이 거짓말이 된다. */
const HOSPITAL_LABEL: Record<PartnerAccountStatus, string> = {
  pending: "대기",
  approved: "노출 중",
  rejected: "숨김",
};

const backLink: CSSProperties = {
  display: "inline-block",
  marginBottom: 12,
  color: "#6b7280",
};
const desc: CSSProperties = {
  color: "#6b7280",
  fontSize: 13.5,
  lineHeight: 1.7,
  margin: "4px 0 10px",
};
const tabRow: CSSProperties = {
  display: "flex",
  gap: 6,
  margin: "16px 0 4px",
  borderBottom: "1px solid #e5e7eb",
};
/** 고른 쪽만 밑줄로 끌어올린다. 배경색으로 나누면 아래 표의 머리글과 겹쳐
 *  어디까지가 탭이고 어디부터가 표인지 흐려진다. */
function tabBtn(on: boolean): CSSProperties {
  return {
    border: 0,
    background: "none",
    padding: "8px 14px",
    marginBottom: -1,
    borderBottom: `2px solid ${on ? "#0d47a1" : "transparent"}`,
    color: on ? "#0d47a1" : "#6b7280",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  };
}
const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
};
const th: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  padding: "8px 10px",
  fontSize: 13,
  color: "#6b7280",
  whiteSpace: "nowrap",
};
const td: CSSProperties = {
  borderBottom: "1px solid #f1f3f5",
  padding: "10px",
  fontSize: 14,
  verticalAlign: "top",
};
const sub: CSSProperties = { color: "#9ca3af", fontSize: 12, marginTop: 2 };
const select: CSSProperties = {
  padding: "4px 6px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 12,
  maxWidth: 260,
};
const linkBtn: CSSProperties = {
  border: 0,
  background: "none",
  color: "#1a73e8",
  cursor: "pointer",
  fontSize: 12.5,
  padding: 0,
  marginTop: 4,
};
function badge(status: string): CSSProperties {
  const color =
    status === "approved" ? "#0d7d6f" : status === "rejected" ? "#b3261e" : "#a2610a";
  return {
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 6,
    padding: "2px 8px",
    color,
    background:
      status === "approved" ? "#e7f5f3" : status === "rejected" ? "#fdecea" : "#fdf4e3",
  };
}
