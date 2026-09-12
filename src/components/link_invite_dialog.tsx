import { useEffect, useState } from "react";
import styled from "styled-components";

import { createLinkInvite, type LinkInviteResult } from "../api/patient";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import { PrimaryButton, PrimaryNagativeButton } from "./button";

/**
 * 보호자에게 건넬 연동 링크를 만든다.
 *
 * 지금까지는 보호자가 병원 등록번호를 앱에 입력해 연동했다. 등록번호는
 * 대개 연속된 숫자라 순서대로 대입하면 남의 아이 기록에 붙을 수 있었다.
 * 병원이 링크를 건네는 쪽으로 옮긴다.
 *
 * 메일 주소는 필수가 아니다. 자리에서 QR 을 보여 주는 편이 빠를 때가 있고,
 * 보호자가 메일을 안 쓰는 경우도 있다.
 */
/** 흔한 메일 도메인의 오타를 짚어 준다.
 *
 *  실제로 gmail.con 으로 초대를 보내 놓고 "연동이 안 된다"고 한 주를 보낸
 *  일이 있었다. SMTP 는 이런 주소도 일단 받아들이고 나중에 반송하므로
 *  화면에는 "메일을 보냈습니다"가 그대로 뜬다. 보내기 전에 묻는 수밖에
 *  없다.
 *
 *  맞는 주소를 틀렸다고 하면 안 되므로, 한 글자 차이일 때만 말한다. */
const KNOWN_DOMAINS = [
  "gmail.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "kakao.com",
  "nate.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "yahoo.com",
];

function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      // 두 글자가 뒤바뀐 것(gmial.com)은 가장 흔한 오타인데, 보통 거리로
      // 세면 2 가 되어 걸러지지 않는다. 한 번의 실수로 본다.
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

function suggestEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1) return null;
  const domain = value.slice(at + 1);
  if (domain === "" || KNOWN_DOMAINS.includes(domain)) return null;
  for (const known of KNOWN_DOMAINS) {
    if (editDistance(domain, known) === 1) {
      return value.slice(0, at + 1) + known;
    }
  }
  return null;
}

export function LinkInviteDialog({
  patientId,
  registration,
  open,
  onClose,
}: {
  patientId: string | null;
  registration?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LinkInviteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // 보낸 주소를 결과 화면에도 그대로 보여 주려면 붙잡아 둬야 한다.
  const [sentTo, setSentTo] = useState("");
  const typo = suggestEmail(email);

  // 창을 닫았다 다시 열면 앞 환자의 링크가 남아 있으면 안 된다.
  useEffect(() => {
    if (!open) {
      setEmail("");
      setResult(null);
      setError(null);
      setCopied(false);
      setSentTo("");
    }
  }, [open]);

  const issue = async () => {
    if (patientId == null) return;
    setBusy(true);
    setError(null);
    try {
      const to = email.trim();
      setSentTo(to);
      setResult(await createLinkInvite(patientId, to || undefined));
    } catch {
      setError("링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
    } catch {
      setError("복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>보호자 앱 연동 링크</DialogTitle>
      <DialogContent>
        {registration && <Meta>등록번호 {registration}</Meta>}

        {result == null ? (
          <>
            <Label htmlFor="invite-email">보호자 이메일 (선택)</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
            />
            <Hint>
              주소를 적으면 보호자에게 안내 메일이 나갑니다. 비워 두면
              링크만 만들어 직접 전달할 수 있습니다.
            </Hint>
            {typo && (
              <Warn>
                혹시 <b>{typo}</b> 아닌가요?{" "}
                <TypoFix type="button" onClick={() => setEmail(typo)}>
                  이걸로 바꾸기
                </TypoFix>
              </Warn>
            )}
          </>
        ) : (
          <>
            <Url>{result.url}</Url>
            <Hint>
              {result.expiresAt.slice(0, 10)}까지 유효하며 한 번만 사용할 수
              있습니다.
              {result.emailSent
                ? ` 안내 메일을 ${sentTo} 로 보냈습니다. 주소가 맞는지 한 번 더 봐 주세요 — 틀린 주소로도 발송 자체는 성공합니다.`
                : sentTo
                  ? " 다만 메일 전송에 실패했습니다 — 링크를 직접 전달해 주세요."
                  : ""}
            </Hint>
            <PrimaryButton onClick={copy}>
              {copied ? "복사했습니다" : "링크 복사"}
            </PrimaryButton>
          </>
        )}

        {error && <ErrorText>{error}</ErrorText>}
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>
          {result ? "닫기" : "취소"}
        </PrimaryNagativeButton>
        {result == null && (
          <PrimaryButton onClick={issue} disabled={busy}>
            {busy ? "만드는 중…" : "링크 만들기"}
          </PrimaryButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

const Meta = styled.p`
  margin: 0 0 12px;
  font-size: 13px;
  color: #666;
`;
const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
`;
const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
`;
const Hint = styled.p`
  font-size: 12.5px;
  line-height: 1.6;
  color: #666;
  margin: 10px 0 14px;
`;
const Url = styled.p`
  font-size: 12px;
  color: #444;
  word-break: break-all;
  background: #f6f7f9;
  border-radius: 8px;
  padding: 10px;
  margin: 0 0 4px;
`;
const Warn = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #9a5b00;
`;

const TypoFix = styled.button`
  border: 0;
  background: none;
  padding: 0;
  color: #1a73e8;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: #c62828;
  margin: 10px 0 0;
`;
