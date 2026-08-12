import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import { partnerLogin } from "../../api/partner";

export default function PartnerLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await partnerLogin(email.trim(), password);
      nav("/partner/profile");
    } catch (e: any) {
      setError(e?.message ?? "로그인 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ marginTop: 0 }}>병원 파트너 로그인</h1>
        <p style={{ color: "#6b7280", marginTop: -6 }}>myodoc 병원 프로필 관리</p>
        <input
          style={inp}
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={inp}
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error && <p style={{ color: "#b3261e", fontSize: 13 }}>{error}</p>}
        <button style={btn} disabled={busy} onClick={submit}>
          {busy ? "로그인 중…" : "로그인"}
        </button>
        <p style={{ fontSize: 13, textAlign: "center", marginBottom: 0 }}>
          계정이 없으신가요?{" "}
          <a href="/partner/signup" style={{ color: "#0d47a1" }}>
            병원 가입
          </a>
        </p>
      </div>
    </div>
  );
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
