import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import { partnerSignup } from "../../api/partner";

export default function PartnerSignup() {
  const nav = useNavigate();
  // 병원인지 안경점인지 먼저 고른다. 뒤에 나오는 말이 전부 여기서 갈린다 -
  // 안경점 사장에게 "병원명"을 묻거나 병원 프로필 이야기를 하면, 잘못
  // 들어온 줄 알고 나간다.
  const [kind, setKind] = useState<"hospital" | "optical">("hospital");
  const [form, setForm] = useState({
    hospital_name: "",
    contact_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit =
    form.hospital_name.trim() &&
    form.contact_name.trim() &&
    form.email.trim() &&
    form.password.length >= 8;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await partnerSignup({
        email: form.email.trim(),
        password: form.password,
        contact_name: form.contact_name.trim(),
        hospital_name: form.hospital_name.trim(),
        business_kind: kind,
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "가입 실패");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={{ marginTop: 0 }}>가입 신청 완료</h1>
          <p style={{ color: "#374151" }}>
            {kind === "hospital"
              ? "관리자 승인 후 병원 프로필이 앱에 노출됩니다. 승인 전에도 로그인해서 프로필을 미리 작성해 둘 수 있어요."
              : "관리자 승인 후 프리미엄 노출을 신청하실 수 있습니다. 승인 과정에서 사업자 확인을 위해 연락드립니다."}
          </p>
          <button style={btn} onClick={() => nav("/partner/login")}>
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ marginTop: 0 }}>파트너 가입</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["hospital", "optical"] as const).map((k) => (
            <button
              key={k}
              type="button"
              style={kindBtn(kind === k)}
              onClick={() => setKind(k)}
            >
              {k === "hospital" ? "병원" : "안경점"}
            </button>
          ))}
        </div>
        <input
          style={inp}
          placeholder={kind === "hospital" ? "병원명" : "안경점 이름"}
          value={form.hospital_name}
          onChange={set("hospital_name")}
        />
        <input style={inp} placeholder="담당자 이름" value={form.contact_name} onChange={set("contact_name")} />
        <input style={inp} placeholder="이메일" value={form.email} onChange={set("email")} />
        <input
          style={inp}
          type="password"
          placeholder="비밀번호 (8자 이상)"
          value={form.password}
          onChange={set("password")}
        />
        {error && <p style={{ color: "#b3261e", fontSize: 13 }}>{error}</p>}
        <button style={{ ...btn, opacity: canSubmit && !busy ? 1 : 0.5 }} disabled={!canSubmit || busy} onClick={submit}>
          {busy ? "가입 중…" : "가입 신청"}
        </button>
        <p style={{ fontSize: 13, textAlign: "center", marginBottom: 0 }}>
          이미 계정이 있으신가요?{" "}
          <a href="/partner/login" style={{ color: "#0d47a1" }}>
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}

function kindBtn(active: boolean): CSSProperties {
  return {
    flex: 1,
    border: active ? 0 : "1px solid #d1d5db",
    background: active ? "#1a73e8" : "#fff",
    color: active ? "#fff" : "#374151",
    borderRadius: 8,
    padding: "10px 0",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  };
}

const wrap: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f6f7fb",
  padding: 16,
};
const card: CSSProperties = {
  width: "100%",
  maxWidth: 380,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 28,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};
const inp: CSSProperties = {
  padding: 11,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 15,
  boxSizing: "border-box",
};
const btn: CSSProperties = {
  padding: 12,
  border: "none",
  borderRadius: 8,
  background: "#0d47a1",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 4,
};
