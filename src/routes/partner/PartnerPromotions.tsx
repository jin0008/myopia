import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import {
  clearPartnerToken,
  cancelPromotionRequest,
  createPromotionRequest,
  getPaymentState,
  getPromotionAvailability,
  startCheckout,
  type PaymentState,
  type PromotionAvailability,
  getPartnerToken,
  listMyPromotionRequests,
  listMyPromotions,
  partnerMe,
  type LinkedFacility,
  type PartnerBusinessKind,
  type MyPromotion,
  type PromotionRequest,
} from "../../api/partner";

/**
 * 프리미엄 — 신청하고, 지금 어떻게 나가고 있는지 본다.
 *
 * 두 가지를 한 화면에 둔다. 신청하러 온 사람과 성적을 보러 온 사람이
 * 다른 사람이 아니다 - 이번 달 숫자를 보고 연장할지 정한다.
 *
 * 성적이 먼저 온다. 이미 돈을 낸 사람에게는 그것이 이 화면에 오는
 * 이유고, 아직 안 낸 사람에게는 빈 자리가 신청서로 가는 안내가 된다.
 */
/**
 * 나이스 결제창 SDK.
 *
 * index.html 에 넣지 않는다. 결제 화면에서만 쓰는데 모든 페이지가 받아
 * 가면, 결제와 상관없는 사람까지 결제사 스크립트를 내려받는다.
 */
const NICE_SDK = "https://pay.nicepay.co.kr/v1/js/";

declare global {
  interface Window {
    AUTHNICE?: { requestPay: (o: Record<string, unknown>) => void };
  }
}

function loadNiceSdk(): Promise<void> {
  if (window.AUTHNICE != null) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${NICE_SDK}"]`);
    if (existing != null) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("sdk")));
      return;
    }
    const el = document.createElement("script");
    el.src = NICE_SDK;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("sdk"));
    document.head.appendChild(el);
  });
}

export default function PartnerPromotions() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<MyPromotion[] | null>(null);
  const [requests, setRequests] = useState<PromotionRequest[] | null>(null);
  const [error, setError] = useState(false);

  // 신청서. 업체는 고르지 않는다 - 운영자가 확인해 연결해 둔 것이 곧 내
  // 업체다. 고르게 두면 남의 업체로도 신청할 수 있고, 처리 대기 신청이
  // 업체당 하나뿐이라 남의 신청을 막아 버릴 수도 있다.
  const [facility, setFacility] = useState<LinkedFacility | null>(null);
  const [businessKind, setBusinessKind] = useState<PartnerBusinessKind>("hospital");
  const [pay, setPay] = useState<PaymentState | null>(null);
  const [avail, setAvail] = useState<PromotionAvailability | null>(null);
  const [paying, setPaying] = useState(false);
  const [startsOn, setStartsOn] = useState(today());
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getPartnerToken()) {
      navigate("/partner/login", { replace: true });
      return;
    }
    void reload();
    void getPaymentState().then(setPay).catch(() => setPay(null));

    // 결제창에서 돌아오면 서버가 ?pay=ok|fail 을 붙여 보낸다. 알려 주고
    // 주소는 지운다 - 남겨 두면 새로고침할 때마다 같은 알림이 뜬다.
    const q = new URLSearchParams(window.location.search);
    const result = q.get("pay");
    if (result != null) {
      alert(
        result === "ok"
          ? "결제가 완료되었습니다. 광고가 지금부터 노출됩니다."
          : `결제하지 못했습니다. ${q.get("reason") ?? ""}`.trim(),
      );
      window.history.replaceState({}, "", window.location.pathname);
    }

  }, [navigate]);

  // 내 동이 비었는지. 막는 자리는 결제지만, 모르고 결제까지 가게 두지는
  // 않는다.
  useEffect(() => {
    let live = true;
    void getPromotionAvailability()
      .then((a) => live && setAvail(a))
      .catch(() => live && setAvail(null));
    return () => {
      live = false;
    };
  }, []);

  async function reload() {
    try {
      const [p, r, me] = await Promise.all([
        listMyPromotions(30),
        listMyPromotionRequests(),
        partnerMe(),
      ]);
      setPromotions(p);
      setRequests(r);
      setFacility(me.facility);
      setBusinessKind(me.businessKind);
    } catch {
      setError(true);
    }
  }

  /**
   * 결제하고 신청한다.
   *
   * 금액은 서버가 정한다. 여기서는 몇 달치인지만 말한다.
   *
   * 결제창은 나이스가 띄우고, 끝나면 나이스가 우리 서버로 결과를 보낸다.
   * 서버가 승인까지 끝내고 이 화면으로 돌려보낸다 - 브라우저가 중간에
   * 꺼져도 승인은 서버에서 끝난다.
   */
  async function payAndSubmit() {
    if (facility == null || paying) return;
    setPaying(true);
    try {
      await loadNiceSdk();
      const c = await startCheckout(months);
      window.AUTHNICE?.requestPay({
        clientId: c.clientId,
        method: "card",
        orderId: c.orderId,
        amount: c.amount,
        goodsName: c.goodsName,
        returnUrl: c.returnUrl,
        fnError: (r: { errorMsg?: string }) => {
          alert(r?.errorMsg ?? "결제창을 열지 못했습니다.");
          setPaying(false);
        },
      });
      // 여기서 끝이 아니다. 결제창이 뜨고, 결과는 서버가 받는다.
    } catch (e) {
      const code = (e as { code?: number })?.code;
      alert(
        code === 403
          ? "업체 인증을 먼저 마쳐 주세요."
          : code === 409
            ? "같은 동에 이미 노출 중인 곳이 있어 신청할 수 없습니다. 자리가 비는 날 이후로 알려 드릴 수 있습니다."
            : code === 503
              ? "결제 준비가 아직 되지 않았습니다. 담당자에게 알려 주세요."
              : "결제를 시작하지 못했습니다.",
      );
      setPaying(false);
    }
  }

  async function submit() {
    if (facility == null) return;
    setSaving(true);
    try {
      await createPromotionRequest({
        startsOn,
        months,
        note: note.trim() || undefined,
      });
      setNote("");
      await reload();
    } catch (e) {
      // PartnerError 가 담는 이름은 status 가 아니라 code 다. 틀리면 항상
      // 일반 문구로 떨어져, 왜 안 되는지 알려 줄 유일한 자리가 사라진다.
      const code = (e as { code?: number })?.code;
      alert(
        code === 409
          ? "이미 처리를 기다리는 신청이 있습니다. 먼저 취소해 주세요."
          : code === 403
            ? "아직 업체 확인이 되지 않았습니다. 담당자에게 확인을 요청해 주세요."
            : code === 404
              ? "연결된 업체를 명부에서 찾을 수 없습니다. 담당자에게 알려 주세요."
              : "신청하지 못했습니다. 입력값을 확인해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm("이 신청을 취소할까요?")) return;
    try {
      await cancelPromotionRequest(id);
      await reload();
    } catch {
      alert("취소하지 못했습니다. 이미 처리되었을 수 있습니다.");
    }
  }

  if (error) {
    return <p style={{ padding: 24 }}>불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
  }
  if (promotions == null || requests == null) {
    return <p style={{ padding: 24 }}>불러오는 중…</p>;
  }

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* 안경원은 이 화면이 파트너 포털의 전부다. 여기에 로그아웃이 없으면
          나갈 길이 없다. 병원은 프로필 편집기에서 왔으니 돌아갈 길을 준다. */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>프리미엄 노출</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {businessKind === "hospital" && (
            <button type="button" style={headBtn} onClick={() => navigate("/partner/profile")}>
              프로필 관리
            </button>
          )}
          <button
            type="button"
            style={headBtn}
            onClick={() => {
              clearPartnerToken();
              navigate("/partner/login");
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
      <p style={hint}>
        찾기 탭에서 내 주변 안과·안경원을 볼 때 목록 맨 위에 광고로 보입니다.
      </p>

      {/* 성적 */}
      <div style={card}>
        <h3 style={h3}>내 광고 (최근 30일)</h3>
        {promotions.length === 0 ? (
          <p style={hint}>
            아직 걸려 있는 광고가 없습니다. 아래에서 신청하시면 운영자 확인 후
            노출이 시작됩니다.
          </p>
        ) : (
          promotions.map((p) => (
            <div key={p.id} style={promoBox}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <b>{p.name ?? "(명부에 없는 번호)"}</b>{" "}
                  <span style={p.live ? liveTag : endedTag}>
                    {p.live ? "노출 중" : "기간 아님"}
                  </span>
                  <div style={{ color: "#666", fontSize: 12 }}>
                    {p.startsAt.slice(0, 10)} ~ {p.endsAt.slice(0, 10)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, textAlign: "right" }}>
                  <Stat label="노출" value={p.impressions} />
                  <Stat label="클릭" value={p.clicks} />
                  <Stat
                    label="클릭률"
                    value={
                      p.impressions === 0
                        ? "—"
                        : ((p.clicks / p.impressions) * 100).toFixed(1) + "%"
                    }
                  />
                </div>
              </div>
              {/* 일자별. 그래프까지 갈 것은 아니고, 어느 날 튀었는지만 보이면 된다. */}
              {p.days.length > 0 && (
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>날짜</th>
                      <th style={thNum}>노출</th>
                      <th style={thNum}>클릭</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...p.days].reverse().map((d) => (
                      <tr key={d.day}>
                        <td style={td}>{d.day}</td>
                        <td style={tdNum}>{d.impressions.toLocaleString()}</td>
                        <td style={tdNum}>{d.clicks.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))
        )}
        <p style={{ ...hint, marginTop: 10 }}>
          한 사람이 하루에 여러 번 봐도 한 번으로 셉니다. 스크롤을 오르내린
          횟수가 아니라 실제로 본 사람 수에 가깝게 보여 드리기 위해서입니다.
        </p>
      </div>

      {/* 신청 */}
      <div style={card}>
        <h3 style={h3}>신청</h3>
        {pending.length > 0 && (
          <p style={hint}>
            처리를 기다리는 신청이 있습니다. 한 업체에 한 건씩만 접수됩니다.
          </p>
        )}

        {/* 고르는 자리가 아니다. 운영자가 확인해 연결해 준 업체를 보여 주고,
            틀렸으면 사람에게 말하게 한다 - 여기서 바꾸게 하면 확인한 뜻이
            없어진다. */}
        {facility == null ? (
          <div style={warnBox}>
            <b>아직 업체 확인이 되지 않았습니다.</b>
            <div style={{ marginTop: 4 }}>
              프리미엄은 확인된 업체에만 걸 수 있습니다. 아래에서 내 업체를
              고르고 서류를 올리시면 확인 후 신청하실 수 있습니다.
            </div>
            {/* 막힌 자리에서 나갈 길을 준다. 예전에는 "담당자에게 연락
                하세요"로 끝나서, 파트너는 누구에게 무엇을 보내야 하는지
                모른 채 이 화면을 떠났다. */}
            <button
              style={verifyBtn}
              onClick={() => navigate("/partner/verification")}
            >
              업체 인증하러 가기
            </button>
          </div>
        ) : (
          <div style={pickedBox}>
            <div>
              <span style={kindTag}>
                {facility.kind === "eye" ? "안과" : "안경원"}
              </span>{" "}
              <b>{facility.name}</b>
              <div style={{ color: "#666", fontSize: 12 }}>{facility.address}</div>
            </div>
            <span style={{ color: "#8a93a1", fontSize: 12 }}>확인된 업체</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* 결제로 거는 광고는 오늘부터 시작한다. 날짜를 고르게 해 두면
              11월 1일을 골라도 오늘 시작되어, 화면이 거짓말을 한다. */}
          {pay?.available ? null : (
            <label style={label}>
              시작일
              <input
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                style={input}
              />
            </label>
          )}
          <label style={label}>
            기간
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              style={input}
            >
              {[1, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m}개월
                </option>
              ))}
            </select>
          </label>
        </div>
        {avail != null && pay?.available && (
          <p style={{ ...hint, marginTop: -2 }}>
            <b>{avail.regionName ?? "내 동"}</b>에는 다른 업체를 걸지 않습니다. 가까이에서
            찾는 분들에게 지도와 목록 맨 위에 크게 뜨고, 나머지는 지금처럼 작은 점으로
            보입니다. 다만 노출 자리는 검색하는 분 둘레 5km 에서 가장 가까운 한 곳이
            가져가므로, 옆 동 업체가 그분께 더 가까우면 그쪽이 보일 수 있습니다. 월{" "}
            {avail.monthly.toLocaleString()}원 · {months}개월{" "}
            <b>{(avail.monthly * months).toLocaleString()}원</b>
          </p>
        )}

        {/* 모르고 결제까지 가게 두지 않는다. 막는 자리는 결제다. */}
        {avail?.full ? (
          <div style={fullBox}>
            <b style={{ fontSize: 13.5 }}>지금은 신청할 수 없습니다</b>
            <div style={{ color: "#4b5563", fontSize: 12.5, marginTop: 6, lineHeight: 1.8 }}>
              {avail.regionName ?? "같은 동"}에 이미 <b>노출 중인 곳</b>이 있습니다. 노출은 동
              하나에 한 곳만 걸립니다.
              {avail.nextFreeOn ? (
                <>
                  <br />
                  <br />
                  그 노출이 끝나는 날짜는 <b>{korean(avail.nextFreeOn)}</b>입니다. 그 뒤로는
                  신청하실 수 있습니다.
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <p style={hint}>
          {pay?.available
            ? "결제가 끝나면 오늘부터 바로 노출됩니다. 이미 노출 중이면 남은 기간에 이어 붙습니다. 자동 결제는 없으며, 기간이 끝나기 7일 전에 메일로 알려 드립니다."
            : "신청하시면 운영자가 확인 후 노출을 시작합니다."}
        </p>
        {/* 결제가 켜져 있으면 결제로, 아니면 예전처럼 신청으로. 켜지지 않은
            곳에서 결제 버튼을 보이면 눌러도 아무 일이 없다. */}
        {pay?.available ? (
          <button
            type="button"
            style={{ ...btn, ...btnPrimary }}
            disabled={facility == null || paying || avail?.full === true}
            onClick={() => void payAndSubmit()}
          >
            {paying ? "결제창을 여는 중…" : "결제하고 바로 시작"}
          </button>
        ) : (
          <button
            type="button"
            style={{ ...btn, ...btnPrimary }}
            disabled={facility == null || saving}
            onClick={() => void submit()}
          >
            {saving ? "보내는 중…" : "신청하기"}
          </button>
        )}
      </div>

      {/* 신청 내역 */}
      <div style={card}>
        <h3 style={h3}>신청 내역</h3>
        {requests.length === 0 ? (
          <p style={hint}>아직 신청한 적이 없습니다.</p>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>가게</th>
                <th style={th}>시작</th>
                <th style={th}>기간</th>
                <th style={th}>상태</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.facilityName}</td>
                  <td style={td}>{r.startsOn}</td>
                  <td style={td}>{r.months}개월</td>
                  <td style={td}>
                    <span style={statusTag(r.status)}>{STATUS_LABEL[r.status]}</span>
                    {/* 거절 사유는 접어 두지 않는다. 무엇을 고쳐 다시 내야
                        할지가 이 줄에서 가장 중요한 정보다. */}
                    {r.reviewNote && (
                      <div style={{ color: "#a33", fontSize: 12, marginTop: 3 }}>
                        {r.reviewNote}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    {r.status === "pending" && (
                      <button type="button" style={linkBtn} onClick={() => void cancel(r.id)}>
                        취소
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "#8a93a1", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<PromotionRequest["status"], string> = {
  pending: "확인 중",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소함",
};

function today(): string {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

function statusTag(s: PromotionRequest["status"]): CSSProperties {
  const color =
    s === "approved" ? "#1c7c4a" : s === "rejected" ? "#a33" : s === "pending" ? "#8a6d1f" : "#666";
  const bg =
    s === "approved" ? "#eaf6ef" : s === "rejected" ? "#fbeeee" : s === "pending" ? "#fdf6e3" : "#f1f1f1";
  return { fontSize: 11.5, fontWeight: 700, color, background: bg, borderRadius: 4, padding: "2px 7px" };
}

const headBtn: CSSProperties = {
  border: "1px solid #ddd",
  background: "#fff",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const card: CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 16,
  marginTop: 16,
  background: "#fff",
};
const h3: CSSProperties = { margin: "0 0 12px", fontSize: 15 };
/** "2026-11-03" → "2026년 11월 3일". 업체가 읽을 글이라 숫자만 늘어놓지 않는다. */
function korean(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

const fullBox: CSSProperties = {
  border: "1px solid #f0d8a8",
  background: "#fdf8ec",
  borderRadius: 10,
  padding: 12,
  margin: "4px 0 12px",
};
const hint: CSSProperties = { color: "#666", fontSize: 13, margin: "6px 0" };
const label: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
  fontWeight: 700,
  color: "#333",
  marginBottom: 10,
  flex: 1,
  minWidth: 180,
};
const input: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  fontWeight: 400,
};
const btn: CSSProperties = {
  border: "1px solid #ddd",
  background: "#fff",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: 10,
};
const btnPrimary: CSSProperties = {
  border: 0,
  background: "#1a73e8",
  color: "#fff",
};
const promoBox: CSSProperties = {
  border: "1px solid #eef1f6",
  borderRadius: 8,
  padding: 12,
  marginBottom: 10,
};
const liveTag: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "#1c7c4a",
  background: "#eaf6ef",
  borderRadius: 4,
  padding: "2px 7px",
};
const endedTag: CSSProperties = { ...liveTag, color: "#666", background: "#f1f1f1" };
const kindTag: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "#5b6472",
  background: "#eef1f6",
  borderRadius: 4,
  padding: "1px 6px",
};
const pickedBox: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  border: "1px solid #cfe3d6",
  background: "#f2f9f5",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 10,
  fontSize: 14,
};
const verifyBtn: CSSProperties = {
  marginTop: 10,
  border: "none",
  borderRadius: 8,
  background: "#0d47a1",
  color: "#fff",
  padding: "9px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
const warnBox: CSSProperties = {
  border: "1px solid #f0d9a8",
  background: "#fdf6e3",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 10,
  fontSize: 13.5,
  color: "#6b5613",
};

const linkBtn: CSSProperties = {
  border: 0,
  background: "none",
  color: "#1a73e8",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13.5,
  marginTop: 10,
};
const th: CSSProperties = {
  textAlign: "left",
  color: "#8a93a1",
  fontSize: 12,
  borderBottom: "1px solid #eee",
  padding: "6px 4px",
};
const thNum: CSSProperties = { ...th, textAlign: "right" };
const td: CSSProperties = { borderBottom: "1px solid #f4f4f4", padding: "7px 4px" };
const tdNum: CSSProperties = {
  ...td,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};
