import styled from "styled-components";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { LoginInput } from "../components/input";
import {
  PASSWORD_RULE,
  changePasswordAtLogin,
  confirmTwoFactorSetup,
  startTwoFactorSetup,
  verifyTwoFactor,
  type LoginStep,
} from "../api/auth";
import { HttpError } from "../lib/fetch";
import theme from "../theme";

/**
 * 로그인 두 번째 단계 화면들. 첫 단계(아이디·비밀번호 또는 Google)가 맞으면
 * 서버가 다음 단계를 알려 주고, 여기서 그 단계를 보여 준다.
 */

const Title = styled.h2`
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: ${theme.textPrimary};
`;

const Lead = styled.p`
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: ${theme.textSecondary};
`;

const Hint = styled.p`
  margin: 2px 0 12px;
  font-size: 13px;
  color: ${theme.textSecondary};
`;

const ErrorText = styled.p`
  margin: 4px 0 12px;
  font-size: 13px;
  color: #b3261e;
`;

export const PrimaryAction = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background-color: ${theme.primary};
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    background-color: #e8e8e8;
    color: #999;
    cursor: default;
  }
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-top: 16px;
  color: ${theme.textSecondary};
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
`;

const QrBox = styled.div`
  display: flex;
  justify-content: center;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
`;

const SecretText = styled.code`
  display: block;
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f5f5f7;
  font-size: 13px;
  letter-spacing: 1px;
  word-break: break-all;
`;

const CodeGrid = styled.ol`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
  margin: 0 0 16px;
  padding: 16px 16px 16px 36px;
  border-radius: 12px;
  background: #f5f5f7;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 15px;
`;

const RememberRow = styled.label`
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 2px 0 14px;
  font-size: 14px;
  color: ${theme.textPrimary};
  cursor: pointer;
`;

/** 기본은 끈다. 공용 PC 에서 켜 두면 다음 사람이 코드 없이 들어온다. */
function RememberDevice({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <>
      <RememberRow>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        Remember this browser for 30 days
      </RememberRow>
      {value && <Hint style={{ marginTop: -8 }}>Don't use this on a shared or public computer.</Hint>}
    </>
  );
}

const messageOf = (e: unknown) =>
  e instanceof HttpError && e.message ? e.message : "Something went wrong. Please try again.";

const sixDigits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

export function LoginStepView({
  step,
  onStep,
  onBackupCodes,
  onDone,
  onRestart,
}: {
  step: LoginStep;
  onStep: (s: LoginStep) => void;
  onBackupCodes: (codes: string[]) => void;
  onDone: () => void;
  onRestart: () => void;
}) {
  // 티켓이 10분이라 그 사이에 끝내지 못하면 처음부터 다시 해야 한다.
  // 그때 서버는 401 을 주고, 첫 화면으로 돌려보낸다.
  const handle = (e: unknown, setError: (m: string) => void) => {
    if (e instanceof HttpError && e.code === 401 && /expired/i.test(e.message)) {
      alert(e.message);
      onRestart();
      return;
    }
    setError(messageOf(e));
  };

  if (step.next === "change_password")
    return <ChangePassword ticket={step.ticket} onStep={onStep} onError={handle} onRestart={onRestart} />;
  if (step.next === "setup_2fa")
    return (
      <SetupTwoFactor
        ticket={step.ticket}
        onBackupCodes={onBackupCodes}
        onError={handle}
        onRestart={onRestart}
      />
    );
  return <VerifyTwoFactor ticket={step.ticket} onDone={onDone} onError={handle} onRestart={onRestart} />;
}

type ErrorHandler = (e: unknown, setError: (m: string) => void) => void;

function ChangePassword({
  ticket,
  onStep,
  onError,
  onRestart,
}: {
  ticket: string;
  onStep: (s: LoginStep) => void;
  onError: ErrorHandler;
  onRestart: () => void;
}) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (pw !== pw2) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    changePasswordAtLogin(ticket, pw)
      .then(onStep)
      .catch((e) => onError(e, setError))
      .finally(() => setBusy(false));
  };

  return (
    <>
      <Title>Set a new password</Title>
      <Lead>
        Your password no longer meets the security rules for this site. Please choose a new one to
        continue.
      </Lead>
      <LoginInput type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
      <LoginInput
        type="password"
        placeholder="Confirm new password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <Hint>{PASSWORD_RULE}</Hint>
      {error && <ErrorText>{error}</ErrorText>}
      <PrimaryAction disabled={busy || !pw || !pw2} onClick={submit}>
        Change password
      </PrimaryAction>
      <LinkButton onClick={onRestart}>Back to sign in</LinkButton>
    </>
  );
}

function SetupTwoFactor({
  ticket,
  onBackupCodes,
  onError,
  onRestart,
}: {
  ticket: string;
  onBackupCodes: (codes: string[]) => void;
  onError: ErrorHandler;
  onRestart: () => void;
}) {
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    startTwoFactorSetup(ticket)
      .then(setSetup)
      .catch((e) => onError(e, setError));
    // 티켓 하나에 한 번만 키를 만든다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  const submit = () => {
    setBusy(true);
    confirmTwoFactorSetup(ticket, code, remember)
      .then((r) => onBackupCodes(r.backupCodes))
      .catch((e) => onError(e, setError))
      .finally(() => setBusy(false));
  };

  return (
    <>
      <Title>Set up two-factor authentication</Title>
      <Lead>
        Scan this QR code with an authenticator app such as Google Authenticator or Microsoft
        Authenticator, then enter the 6-digit code it shows.
      </Lead>
      {setup ? (
        <>
          <QrBox>
            <QRCodeSVG value={setup.otpauthUrl} size={176} />
          </QrBox>
          <Hint>Can't scan it? Enter this key in the app instead:</Hint>
          <SecretText>{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</SecretText>
        </>
      ) : (
        !error && <Hint>Preparing…</Hint>
      )}
      <LoginInput
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="6-digit code"
        value={code}
        onChange={(e) => setCode(sixDigits(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && code.length === 6 && submit()}
      />
      {error && <ErrorText>{error}</ErrorText>}
      <RememberDevice value={remember} onChange={setRemember} />
      <PrimaryAction disabled={busy || !setup || code.length !== 6} onClick={submit}>
        Verify and continue
      </PrimaryAction>
      <LinkButton onClick={onRestart}>Back to sign in</LinkButton>
    </>
  );
}

function VerifyTwoFactor({
  ticket,
  onDone,
  onError,
  onRestart,
}: {
  ticket: string;
  onDone: () => void;
  onError: ErrorHandler;
  onRestart: () => void;
}) {
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = useBackup ? code.trim().length >= 10 : code.length === 6;

  const submit = () => {
    setBusy(true);
    verifyTwoFactor(ticket, code, remember)
      .then((r) => {
        if (r.backupCodesLeft != null && r.backupCodesLeft <= 3) {
          alert(
            `You have ${r.backupCodesLeft} backup code${r.backupCodesLeft === 1 ? "" : "s"} left. ` +
              "Ask a site administrator to reset two-factor authentication if you have lost your phone.",
          );
        }
        onDone();
      })
      .catch((e) => onError(e, setError))
      .finally(() => setBusy(false));
  };

  return (
    <>
      <Title>Two-factor authentication</Title>
      <Lead>
        {useBackup
          ? "Enter one of the backup codes you saved when you set up two-factor authentication. Each code works once."
          : "Enter the 6-digit code from your authenticator app."}
      </Lead>
      <LoginInput
        autoFocus
        inputMode={useBackup ? "text" : "numeric"}
        autoComplete="one-time-code"
        placeholder={useBackup ? "Backup code (XXXXX-XXXXX)" : "6-digit code"}
        value={code}
        onChange={(e) => setCode(useBackup ? e.target.value.toUpperCase() : sixDigits(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && ready && submit()}
      />
      {error && <ErrorText>{error}</ErrorText>}
      <RememberDevice value={remember} onChange={setRemember} />
      <PrimaryAction disabled={busy || !ready} onClick={submit}>
        Sign in
      </PrimaryAction>
      <LinkButton
        onClick={() => {
          setUseBackup(!useBackup);
          setCode("");
          setError("");
        }}
      >
        {useBackup ? "Use the authenticator app instead" : "Lost your phone? Use a backup code"}
      </LinkButton>
      <br />
      <LinkButton onClick={onRestart}>Back to sign in</LinkButton>
    </>
  );
}

/** 등록 직후 한 번만 보여 준다. 서버는 해시만 갖고 있어 다시 볼 수 없다. */
export function BackupCodesView({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const text = codes.join("\n");

  return (
    <>
      <Title>Save your backup codes</Title>
      <Lead>
        If you lose your phone, you can sign in with one of these codes. Each code works once. This
        is the only time they will be shown.
      </Lead>
      <CodeGrid>
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </CodeGrid>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <PrimaryAction
          type="button"
          style={{ background: "#f5f5f7", color: theme.textPrimary }}
          onClick={() => navigator.clipboard.writeText(text).then(() => setSaved(true))}
        >
          Copy
        </PrimaryAction>
        <PrimaryAction
          type="button"
          style={{ background: "#f5f5f7", color: theme.textPrimary }}
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([text + "\n"], { type: "text/plain" }));
            a.download = "myopiamanage-backup-codes.txt";
            a.click();
            setSaved(true);
          }}
        >
          Download
        </PrimaryAction>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, fontSize: 14 }}>
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        I have saved these codes somewhere safe.
      </label>
      <PrimaryAction disabled={!saved} onClick={onDone}>
        Continue
      </PrimaryAction>
    </>
  );
}
