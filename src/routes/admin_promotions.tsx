import { useContext, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../App";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import {
  deletePromotion,
  listPromotions,
  listPartnerAccounts,
  savePromotion,
  searchFacilities,
  type FacilityHit,
} from "../api/partnerAccount";

/**
 * 안과·안경점 찾기의 유료 노출 관리.
 *
 * 등급은 여기서만 켠다. 파트너가 스스로 올릴 수 있으면 돈을 내지 않고도
 * 프리미엄이 된다 - 인증 배지를 관리자 전용으로 둔 것과 같은 이유다.
 *
 * 연결 열쇠는 상호가 아니라 번호다. 안과는 심평원 요양기호, 안경점은
 * 지자체 인허가번호. 같은 상호가 전국에 여럿이고 주소 표기도 도로명과
 * 지번이 섞여 있어, 이름으로 맞추면 엉뚱한 업체에 광고가 붙는다.
 */
export default function AdminPromotions() {
  const { user } = useContext(UserContext);
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["admin", "promotions"],
    queryFn: listPromotions,
  });
  const accountsQuery = useQuery({
    queryKey: ["admin", "partnerAccounts"],
    queryFn: listPartnerAccounts,
  });

  // 고른 업체. 번호를 손으로 적지 않는다 - 25자짜리 인허가번호에서 앞
  // 네 글자가 빠진 채 저장돼 광고가 안 나간 일이 있었다. 등록은 성공한
  // 것처럼 보이고 노출만 안 되니 원인을 찾기도 어렵다.
  const [picked, setPicked] = useState<FacilityHit | null>(null);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<FacilityHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [startsOn, setStartsOn] = useState(today());
  const [endsOn, setEndsOn] = useState(monthsLater(1));
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");

  const runSearch = async () => {
    if (term.trim().length < 2) return;
    setSearching(true);
    try {
      setHits(await searchFacilities(term.trim()));
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: savePromotion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "promotions"] });
      setPicked(null);
      setTerm("");
      setHits(null);
      setNote("");
    },
    onError: () => alert("저장하지 못했습니다. 입력값을 확인해 주세요."),
  });

  const removeMutation = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "promotions"] }),
  });

  if (!user?.is_site_admin) {
    return <div style={{ padding: 24 }}>권한이 없습니다.</div>;
  }

  const rows = listQuery.data ?? [];
  const canSave = picked != null && startsOn !== "" && endsOn !== "";

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h2 style={{ marginBottom: 4 }}>유료 노출 관리</h2>
      <p style={hint}>
        찾기 탭에서 상단 광고 자리에 올릴 업체를 지정합니다. 자리는 최대 3개이며,
        사용자 위치에서 5km 안에 있을 때만 노출됩니다.
      </p>

      <div style={card}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>등록 · 기간 연장</h3>
        <div style={formRow}>
          <label style={{ ...label, flex: 3 }}>
            업체 찾기
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
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <PrimaryButton disabled={term.trim().length < 2} onClick={() => void runSearch()}>
              {searching ? "찾는 중…" : "찾기"}
            </PrimaryButton>
          </div>
        </div>

        {picked ? (
          <div style={pickedBox}>
            <div>
              <span style={kindTag}>{picked.kind === "eye" ? "안과" : "안경점"}</span>{" "}
              <b>{picked.name}</b>
              <div style={{ color: "#666", fontSize: 12 }}>{picked.address}</div>
              <div style={{ fontFamily: "monospace", fontSize: 11.5, color: "#8a93a1" }}>
                {picked.key}
              </div>
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
        <div style={formRow}>
          <label style={label}>
            시작
            <input
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              style={input}
            />
          </label>
          <label style={label}>
            종료
            <input
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              style={input}
            />
          </label>
          <label style={{ ...label, flex: 2 }}>
            파트너 계정 (선택)
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              style={input}
            >
              <option value="">연결 안 함</option>
              {(accountsQuery.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.hospitalName} · {a.email}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={formRow}>
          <label style={{ ...label, flex: 1 }}>
            메모 (선택)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="입금일, 계약 건번호 등"
              style={input}
            />
          </label>
        </div>
        <p style={hint}>
          같은 업체를 다시 등록하면 기간이 갱신됩니다. 종료일은 그날 자정까지
          유효합니다.
        </p>
        <PrimaryButton
          disabled={!canSave || saveMutation.isPending}
          onClick={() =>
            picked &&
            saveMutation.mutate({
              kind: picked.kind,
              key: picked.key,
              tier: "premium",
              startsOn,
              endsOn,
              accountId: accountId || undefined,
              note: note.trim() || undefined,
            })
          }
        >
          {saveMutation.isPending ? "저장 중…" : "저장"}
        </PrimaryButton>
      </div>

      <h3 style={{ fontSize: 15, marginTop: 28 }}>등록된 광고 ({rows.length})</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
        <thead>
          <tr>
            <th style={th}>상태</th>
            <th style={th}>구분</th>
            <th style={th}>업체</th>
            <th style={th}>기간</th>
            <th style={th}>파트너</th>
            <th style={th}>메모</th>
            <th style={th} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={td}>
                <span style={badge(r.active)}>{r.active ? "노출 중" : "기간 아님"}</span>
              </td>
              <td style={td}>{r.kind === "eye" ? "안과" : "안경점"}</td>
              <td style={td}>
                {r.facilityName ? (
                  <>
                    <div style={{ fontWeight: 700 }}>{r.facilityName}</div>
                    <div style={{ color: "#666", fontSize: 12 }}>{r.facilityAddress}</div>
                  </>
                ) : (
                  // 번호로 붙는 업체가 없다. 오타이거나 명부에 없는 곳이다.
                  <div style={{ color: "#b3261e", fontWeight: 700 }}>
                    번호에 맞는 업체 없음
                  </div>
                )}
                <div style={{ fontFamily: "monospace", fontSize: 11.5, color: "#8a93a1" }}>
                  {r.key}
                </div>
              </td>
              <td style={td}>
                {r.startsOn} ~ {r.endsOn}
              </td>
              <td style={td}>{r.accountName ?? "-"}</td>
              <td style={{ ...td, color: "#666", fontSize: 12 }}>{r.note ?? "-"}</td>
              <td style={td}>
                <PrimaryNagativeButton
                  onClick={() => {
                    if (!window.confirm("이 광고를 삭제할까요?")) return;
                    removeMutation.mutate(r.id);
                  }}
                >
                  삭제
                </PrimaryNagativeButton>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={{ ...td, color: "#888" }} colSpan={7}>
                등록된 광고가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 기본 계약 기간. 자주 쓰는 값을 미리 채워 두면 매번 달력을 열지 않는다. */
function monthsLater(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function badge(active: boolean): CSSProperties {
  const color = active ? "#0d7d6f" : "#888";
  return {
    color,
    background: color + "18",
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

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

const kindTag: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "#5b6472",
  background: "#eef1f6",
  borderRadius: 4,
  padding: "1px 6px",
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

const card: CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 16,
  marginTop: 16,
  background: "#fafbfc",
};

const formRow: CSSProperties = { display: "flex", gap: 12, marginBottom: 10 };

const label: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12,
  fontWeight: 700,
  color: "#5b6472",
  flex: 1,
};

const input: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 14,
  fontWeight: 400,
  color: "#141922",
};

const hint: CSSProperties = { color: "#666", fontSize: 12.5, margin: "8px 0 12px" };

const th: CSSProperties = { textAlign: "left", borderBottom: "2px solid #eee", padding: 8 };
const td: CSSProperties = { borderBottom: "1px solid #eee", padding: 8 };
