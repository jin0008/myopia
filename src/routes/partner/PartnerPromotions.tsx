import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import {
  cancelPromotionRequest,
  createPromotionRequest,
  getPartnerToken,
  listMyPromotionRequests,
  listMyPromotions,
  searchMyFacilities,
  type FacilityHit,
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
export default function PartnerPromotions() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<MyPromotion[] | null>(null);
  const [requests, setRequests] = useState<PromotionRequest[] | null>(null);
  const [error, setError] = useState(false);

  // 신청서
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<FacilityHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<FacilityHit | null>(null);
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
  }, [navigate]);

  async function reload() {
    try {
      const [p, r] = await Promise.all([
        listMyPromotions(30),
        listMyPromotionRequests(),
      ]);
      setPromotions(p);
      setRequests(r);
    } catch {
      setError(true);
    }
  }

  async function runSearch() {
    if (term.trim().length < 2) return;
    setSearching(true);
    try {
      setHits(await searchMyFacilities(term.trim()));
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }

  async function submit() {
    if (picked == null) return;
    setSaving(true);
    try {
      await createPromotionRequest({
        kind: picked.kind,
        key: picked.key,
        facilityName: picked.name,
        startsOn,
        months,
        note: note.trim() || undefined,
      });
      setPicked(null);
      setTerm("");
      setHits(null);
      setNote("");
      await reload();
    } catch (e) {
      const code = (e as { status?: number })?.status;
      alert(
        code === 409
          ? "이미 처리를 기다리는 신청이 있습니다. 먼저 취소해 주세요."
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
      <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>프리미엄 노출</h2>
      <p style={hint}>
        찾기 탭에서 내 주변 안과·안경점을 볼 때 목록 맨 위에 광고로 보입니다.
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
            처리를 기다리는 신청이 있습니다. 한 가게에 한 건씩만 접수됩니다.
          </p>
        )}

        <label style={label}>
          가게 찾기
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="상호 또는 주소 (예: 뉴파피루스, 압구정 안경)"
            style={input}
          />
        </label>
        <button
          type="button"
          style={btn}
          disabled={term.trim().length < 2 || searching}
          onClick={() => void runSearch()}
        >
          {searching ? "찾는 중…" : "찾기"}
        </button>

        {picked ? (
          <div style={pickedBox}>
            <div>
              <span style={kindTag}>{picked.kind === "eye" ? "안과" : "안경점"}</span>{" "}
              <b>{picked.name}</b>
              <div style={{ color: "#666", fontSize: 12 }}>{picked.address}</div>
            </div>
            <button type="button" style={linkBtn} onClick={() => setPicked(null)}>
              다시 고르기
            </button>
          </div>
        ) : hits != null ? (
          hits.length === 0 ? (
            <p style={hint}>찾지 못했습니다. 상호 일부만 넣어 보세요.</p>
          ) : (
            <div style={hitBox}>
              {hits.map((h) => (
                <button
                  key={h.kind + h.key}
                  type="button"
                  style={hitRow}
                  onClick={() => {
                    setPicked(h);
                    setHits(null);
                  }}
                >
                  <span style={kindTag}>{h.kind === "eye" ? "안과" : "안경점"}</span>{" "}
                  <b>{h.name}</b>
                  <div style={{ color: "#666", fontSize: 12 }}>{h.address}</div>
                </button>
              ))}
            </div>
          )
        ) : null}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={label}>
            시작일
            <input
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              style={input}
            />
          </label>
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
        <label style={label}>
          남길 말 (선택)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="문의나 요청 사항"
            style={input}
          />
        </label>

        <p style={hint}>
          신청하시면 운영자가 확인 후 노출을 시작합니다. 결제는 확인 단계에서
          따로 안내드립니다.
        </p>
        <button
          type="button"
          style={{ ...btn, ...btnPrimary }}
          disabled={picked == null || saving}
          onClick={() => void submit()}
        >
          {saving ? "보내는 중…" : "신청하기"}
        </button>
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

const card: CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 16,
  marginTop: 16,
  background: "#fff",
};
const h3: CSSProperties = { margin: "0 0 12px", fontSize: 15 };
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
const hitBox: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  maxHeight: 220,
  overflowY: "auto",
  marginBottom: 10,
  background: "#fff",
};
const hitRow: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: 0,
  borderBottom: "1px solid #f0f0f0",
  background: "none",
  padding: "9px 12px",
  cursor: "pointer",
  fontSize: 14,
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
