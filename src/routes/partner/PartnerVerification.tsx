import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import {
  getPartnerToken,
  getVerification,
  searchMyFacilities,
  submitVerification,
  type DirectoryFacility,
  type VerificationState,
} from "../../api/partner";

/**
 * 업체 인증 — 내가 정말 이 가게의 사람인지 보인다.
 *
 * 가입 폼의 상호는 자유 입력이라 누구나 남의 병원 이름을 칠 수 있다.
 * 여기서 명부의 실제 가게를 고르고 서류를 올리면, 운영자가 둘을 대조해
 * 승인한다. 승인이 곧 계정과 업체의 연결이라, 그 뒤로 프리미엄을
 * 신청할 수 있다.
 *
 * 가게를 본인이 고르게 하는 이유: 25자짜리 인허가번호를 운영자가 이름만
 * 보고 찾는 것보다 본인이 고르는 쪽이 정확하다. 남의 가게를 골라도
 * 서류에서 걸린다.
 */
export default function PartnerVerification() {
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState | null>(null);
  const [error, setError] = useState(false);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<DirectoryFacility[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<DirectoryFacility | null>(null);
  const [docs, setDocs] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 토큰이 없으면 불러와 봐야 401 이다. 그대로 두면 "불러오지 못했습니다"만
    // 뜨고, 로그인하면 된다는 것을 알 길이 없다.
    if (!getPartnerToken()) {
      navigate("/partner/login", { replace: true });
      return;
    }
    getVerification().then(setState).catch(() => setError(true));
  }, [navigate]);

  async function search() {
    const term = q.trim();
    if (term.length < 2) return;
    setSearching(true);
    try {
      setResults(await searchMyFacilities(term));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function submit() {
    if (picked == null || docs.length === 0) return;
    setSaving(true);
    try {
      await submitVerification(picked.key, docs, note.trim() || undefined);
      setState(await getVerification());
      setPicked(null);
      setDocs([]);
      setNote("");
      setResults(null);
      setQ("");
    } catch (e) {
      alert((e as { message?: string })?.message ?? "신청하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <div style={wrap}>불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>;
  }
  if (state == null) {
    return <div style={wrap}>불러오는 중…</div>;
  }

  const isOptical = state.businessKind === "optical";
  const req = state.request;

  return (
    <div style={wrap}>
      <div style={head}>
        <h1 style={{ margin: 0, fontSize: 20 }}>업체 인증</h1>
        <button
          style={headBtn}
          onClick={() => navigate(isOptical ? "/partner/promotions" : "/partner/profile")}
        >
          돌아가기
        </button>
      </div>

      {/* 끝난 사람에게 신청서를 계속 보여 주면 무엇을 더 해야 하나 싶어진다. */}
      {state.verified ? (
        <div style={okBox}>
          <b>인증이 끝났습니다.</b>
          <div style={{ marginTop: 4 }}>
            {req?.facilityName ? `${req.facilityName} 으로 확인되었습니다. ` : ""}
            이제 프리미엄 노출을 신청하실 수 있습니다.
          </div>
          <button
            style={{ ...primaryBtn, marginTop: 10 }}
            onClick={() => navigate("/partner/promotions")}
          >
            프리미엄 신청하러 가기
          </button>
        </div>
      ) : req?.status === "pending" ? (
        <div style={waitBox}>
          <b>심사 중입니다.</b>
          <div style={{ marginTop: 4 }}>
            <b>{req.facilityName}</b> 으로 서류 {req.docCount}건을 받았습니다.
            영업일 기준 1~2일 안에 처리됩니다. 결과는 이 화면에서 확인하실 수
            있습니다.
          </div>
        </div>
      ) : (
        <>
          {/* 반려는 사유와 함께 보여 준다. 무엇을 고쳐 다시 내야 하는지
              모르면 같은 서류를 다시 올린다. */}
          {req?.status === "rejected" && (
            <div style={warnBox}>
              <b>지난 신청이 반려되었습니다.</b>
              <div style={{ marginTop: 4 }}>{req.reviewNote}</div>
              <div style={{ marginTop: 4, color: "#8a7a3d" }}>
                아래에서 다시 신청하실 수 있습니다.
              </div>
            </div>
          )}

          <div style={card}>
            <h3 style={h3}>1. 내 {isOptical ? "안경원" : "병원"} 찾기</h3>
            <p style={hint}>
              {isOptical
                ? "안경업소 등록 명부에서 찾습니다. 상호나 주소로 검색해 주세요."
                : "건강보험심사평가원 요양기관 명부에서 찾습니다. 상호나 주소로 검색해 주세요."}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...input, flex: 1 }}
                placeholder="상호 또는 주소 (두 글자 이상)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
              <button style={headBtn} onClick={search} disabled={searching}>
                {searching ? "찾는 중…" : "찾기"}
              </button>
            </div>

            {picked != null && (
              <div style={pickedBox}>
                <div>
                  <b>{picked.name}</b>
                  <div style={{ color: "#666", fontSize: 12 }}>{picked.address}</div>
                </div>
                <button style={linkBtn} onClick={() => setPicked(null)}>
                  다시 고르기
                </button>
              </div>
            )}

            {picked == null && results != null && (
              <div style={{ marginTop: 10 }}>
                {results.length === 0 ? (
                  <p style={hint}>
                    찾지 못했습니다. 상호가 명부에 등록된 이름과 다를 수 있으니
                    주소로도 찾아보세요.
                  </p>
                ) : (
                  results.map((f) => (
                    <button key={f.key} style={resultRow} onClick={() => setPicked(f)}>
                      <b>{f.name}</b>
                      <div style={{ color: "#666", fontSize: 12 }}>{f.address}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={h3}>2. 서류 올리기</h3>
            <p style={hint}>
              {isOptical
                ? "안경업소 개설등록증 또는 사업자등록증"
                : "의료기관 개설신고증명서(개설허가증) 또는 사업자등록증"}
              을 올려 주세요. 사진으로 찍은 것도 괜찮습니다. 상호와 주소가
              읽히면 됩니다.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={(e) => setDocs(Array.from(e.target.files ?? []).slice(0, 3))}
            />
            {docs.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
                {docs.map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            )}
            {/* 올린 것이 어디로 가는지 밝힌다. 사업자등록증을 올리라고만
                하면 공개되는 줄 알고 망설인다. */}
            <p style={{ ...hint, marginTop: 10 }}>
              올리신 서류는 운영자만 열람하며, 확인이 끝나면 다른 곳에
              쓰이지 않습니다.
            </p>
          </div>

          <div style={card}>
            <h3 style={h3}>3. 남길 말 (선택)</h3>
            <textarea
              style={{ ...input, width: "100%", minHeight: 70, boxSizing: "border-box" }}
              placeholder="상호가 명부와 다른 이유 등 전할 말이 있으면 적어 주세요."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </div>

          <button
            style={{
              ...primaryBtn,
              marginTop: 16,
              opacity: picked == null || docs.length === 0 ? 0.5 : 1,
            }}
            disabled={picked == null || docs.length === 0 || saving}
            onClick={submit}
          >
            {saving ? "보내는 중…" : "인증 신청"}
          </button>
          {(picked == null || docs.length === 0) && (
            <p style={hint}>
              {picked == null ? "업체를 골라 주세요." : "서류를 한 장 이상 올려 주세요."}
            </p>
          )}
        </>
      )}
    </div>
  );
}

const wrap: CSSProperties = { maxWidth: 720, margin: "0 auto", padding: 24 };
const head: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
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
const hint: CSSProperties = { color: "#666", fontSize: 13, margin: "6px 0" };
const input: CSSProperties = {
  padding: 10,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 14,
};
const resultRow: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "1px solid #eee",
  background: "#fff",
  borderRadius: 8,
  padding: "9px 11px",
  marginBottom: 6,
  cursor: "pointer",
  fontSize: 14,
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
  marginTop: 10,
  fontSize: 14,
};
const okBox: CSSProperties = { ...pickedBox, display: "block", marginTop: 16 };
const waitBox: CSSProperties = {
  border: "1px solid #cdddf5",
  background: "#f1f6fd",
  borderRadius: 8,
  padding: "12px 14px",
  marginTop: 16,
  fontSize: 14,
  color: "#20406b",
};
const warnBox: CSSProperties = {
  border: "1px solid #f0d9a8",
  background: "#fdf6e3",
  borderRadius: 8,
  padding: "10px 12px",
  marginTop: 16,
  fontSize: 13.5,
  color: "#6b5613",
};
const primaryBtn: CSSProperties = {
  padding: 12,
  border: "none",
  borderRadius: 8,
  background: "#0d47a1",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};
const linkBtn: CSSProperties = {
  border: 0,
  background: "none",
  color: "#1a73e8",
  cursor: "pointer",
  fontSize: 13,
  padding: 0,
};
