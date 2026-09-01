import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";

import {
  partnerResetPassword,
  partnerSendResetCode,
  partnerVerifyResetCode,
} from "../../api/partner";

/** 재발송 간격. 서버 쿨다운과 같은 값이다. */
const RESEND_SECONDS = 60;

/**
 * 병원 파트너 비밀번호 재설정.
 *
 * 지금까지는 병원이 비밀번호를 잊으면 방법이 없었다. 운영자가 DB 에서 해시를
 * 바꿔주는 것 말고는 길이 없었는데, 실제 병원이 들어오기 시작하면 그 요청을
 * 매번 사람이 받게 된다.
 *
 * 앱 쪽 재설정과 같은 순서로 만든다 - 코드를 받고, 확인하고, 새 비밀번호.
 * 두 곳의 흐름이 다르면 안내할 때마다 설명이 갈라진다.
 */
export default function PartnerForgotPassword() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const [ticket, setTicket] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (cooldown <= 0) return;
    timer.current = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [cooldown]);

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function run(fn: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError((e as { message?: string })?.message ?? "요청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const send = () =>
    run(async () => {
      await partnerSendResetCode(email.trim());
      setRequested(true);
      setCooldown(RESEND_SECONDS);
      setNotice("인증번호를 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요.");
    });

  const confirm = () =>
    run(async () => {
      const r = await partnerVerifyResetCode(email.trim(), code.trim());
      setTicket(r.verificationTicket);
      setNotice("이메일 인증이 완료되었습니다. 새 비밀번호를 입력해 주세요.");
    });

  const submit = () =>
    run(async () => {
      if (ticket == null) return;
      await partnerResetPassword(email.trim(), ticket, password);
      alert("비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.");
      nav("/partner/login");
    });

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ marginTop: 0, fontSize: 22 }}>비밀번호 재설정</h1>
        <p style={{ color: "#6b7280", marginTop: -6, fontSize: 14 }}>
          가입할 때 등록한 이메일로 인증번호를 보내드립니다.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...inp, flex: 1, ...(ticket != null ? locked : null) }}
            placeholder="이메일"
            value={email}
            disabled={ticket != null}
            onChange={(e) => setEmail(e.target.value)}
          />
          {/* 인증을 마치면 감춘다. 남겨두면 뜻 없는 카운트다운만 돈다. */}
          {ticket == null && (
            <button
              type="button"
              style={{ ...sideBtn, ...(!emailLooksValid || busy || cooldown > 0 ? dim : null) }}
              disabled={!emailLooksValid || busy || cooldown > 0}
              onClick={send}
            >
              {cooldown > 0 ? `${cooldown}초` : requested ? "재전송" : "인증번호 전송"}
            </button>
          )}
        </div>

        {/* 쿨다운이 아니라 발송 여부로 띄운다. 코드는 5분간 유효한데
            쿨다운(60초)으로 걸면 메일을 늦게 열었을 때 넣을 칸이 사라진다. */}
        {ticket == null && requested && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inp, flex: 1 }}
              placeholder="인증번호 6자리"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && confirm()}
            />
            <button
              type="button"
              style={{ ...sideBtn, ...(code.length !== 6 || busy ? dim : null) }}
              disabled={code.length !== 6 || busy}
              onClick={confirm}
            >
              확인
            </button>
          </div>
        )}

        {/* 새 비밀번호는 인증을 마친 뒤에만 보여준다. 먼저 띄우면 코드를
            받기도 전에 채워 넣고 왜 안 되는지 찾게 된다. */}
        {ticket != null && (
          <input
            style={inp}
            type="password"
            placeholder="새 비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && password.length >= 8 && submit()}
          />
        )}

        {notice && !error && (
          <p style={{ color: "#0d7d6f", fontSize: 13, margin: 0 }}>{notice}</p>
        )}
        {error && <p style={{ color: "#b3261e", fontSize: 13, margin: 0 }}>{error}</p>}

        <button
          style={{ ...btn, ...(ticket == null || password.length < 8 || busy ? dim : null) }}
          disabled={ticket == null || password.length < 8 || busy}
          onClick={submit}
        >
          {busy ? "처리 중…" : "비밀번호 변경"}
        </button>

        <p style={{ fontSize: 13, textAlign: "center", marginBottom: 0 }}>
          <a href="/partner/login" style={{ color: "#0d47a1" }}>
            로그인으로 돌아가기
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
const locked: CSSProperties = { background: "#f2f4f8", color: "#5b6472" };
const btn: CSSProperties = {
  padding: 12,
  border: "none",
  borderRadius: 8,
  background: "#0d47a1",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
const sideBtn: CSSProperties = {
  padding: "0 14px",
  border: "1px solid #0d47a1",
  borderRadius: 8,
  background: "#fff",
  color: "#0d47a1",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const dim: CSSProperties = { opacity: 0.5, cursor: "default" };
