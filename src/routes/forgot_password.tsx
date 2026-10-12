import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router";
import { LoginInput } from "../components/input";
import Logo from "../components/logo";
import {
  PASSWORD_RULE,
  resetPassword,
  sendPasswordResetCode,
  verifyPasswordResetCode,
} from "../api/auth";
import { HttpError } from "../lib/fetch";
import theme from "../theme";
import { PrimaryAction } from "./login_steps";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
`;

const Form = styled.div`
  width: 100%;
  max-width: 460px;
  margin-top: 32px;
`;

const Title = styled.h2`
  margin: 0 0 6px;
  font-size: 20px;
`;

const Lead = styled.p`
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: ${theme.textSecondary};
`;

const Small = styled.p`
  margin: 2px 0 12px;
  font-size: 13px;
  color: ${theme.textSecondary};
`;

const ErrorText = styled.p`
  margin: 4px 0 12px;
  font-size: 13px;
  color: #b3261e;
`;

const Back = styled.button`
  display: block;
  margin-top: 16px;
  background: none;
  border: none;
  padding: 0;
  color: ${theme.textSecondary};
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
`;

/**
 * 비밀번호 찾기: 이메일 → 인증번호 → 새 비밀번호.
 *
 * 계정이 있는지는 화면이 알려 주지 않는다(서버도 같은 답을 준다). 비밀번호를
 * 바꿔도 2단계 인증은 그대로라, 메일만으로는 로그인할 수 없다.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"email" | "code" | "password" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = (p: Promise<unknown>) => {
    setBusy(true);
    setError("");
    return p
      .catch((e) => {
        setError(e instanceof HttpError && e.message ? e.message : "Something went wrong. Please try again.");
        throw e;
      })
      .finally(() => setBusy(false));
  };

  return (
    <Page>
      <Logo size="large" />
      <Form>
        {stage === "email" && (
          <>
            <Title>Reset your password</Title>
            <Lead>Enter the email address on your account. We'll send you a 6-digit code.</Lead>
            <LoginInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
            {error && <ErrorText>{error}</ErrorText>}
            <PrimaryAction
              disabled={busy || !email.includes("@")}
              onClick={() => run(sendPasswordResetCode(email)).then(() => setStage("code"), () => {})}
            >
              Send code
            </PrimaryAction>
          </>
        )}

        {stage === "code" && (
          <>
            <Title>Check your email</Title>
            <Lead>
              If {email} belongs to an account, a code is on its way. It expires in 5 minutes.
            </Lead>
            <LoginInput
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {error && <ErrorText>{error}</ErrorText>}
            <PrimaryAction
              disabled={busy || code.length !== 6}
              onClick={() =>
                run(verifyPasswordResetCode(email, code)).then(
                  (r) => {
                    setTicket((r as { ticket: string }).ticket);
                    setStage("password");
                  },
                  () => {},
                )
              }
            >
              Verify
            </PrimaryAction>
            <Back onClick={() => run(sendPasswordResetCode(email)).catch(() => {})}>Send the code again</Back>
          </>
        )}

        {stage === "password" && (
          <>
            <Title>Choose a new password</Title>
            <LoginInput type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <LoginInput
              type="password"
              placeholder="Confirm new password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
            <Small>{PASSWORD_RULE}</Small>
            {error && <ErrorText>{error}</ErrorText>}
            <PrimaryAction
              disabled={busy || !pw || !pw2}
              onClick={() => {
                if (pw !== pw2) {
                  setError("The two passwords do not match.");
                  return;
                }
                run(resetPassword(email, ticket, pw)).then(() => setStage("done"), () => {});
              }}
            >
              Change password
            </PrimaryAction>
          </>
        )}

        {stage === "done" && (
          <>
            <Title>Password changed</Title>
            <Lead>You've been signed out everywhere. Sign in with your new password.</Lead>
            <PrimaryAction onClick={() => navigate("/login")}>Go to sign in</PrimaryAction>
          </>
        )}

        {stage !== "done" && <Back onClick={() => navigate("/login")}>Back to sign in</Back>}
      </Form>
    </Page>
  );
}
