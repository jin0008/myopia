import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import QRCode from "qrcode";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 창을 닫았다 다시 열면 앞 환자의 링크가 남아 있으면 안 된다.
  useEffect(() => {
    if (!open) {
      setEmail("");
      setResult(null);
      setError(null);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (result && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, result.url, { width: 200, margin: 1 });
    }
  }, [result]);

  const issue = async () => {
    if (patientId == null) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await createLinkInvite(patientId, email.trim() || undefined));
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
              주소를 적으면 안내 메일이 나갑니다. 비워 두면 링크와 QR 만
              만들어 그 자리에서 보여 줄 수 있습니다.
            </Hint>
          </>
        ) : (
          <>
            <Canvas ref={canvasRef} />
            <Url>{result.url}</Url>
            <Hint>
              {result.expiresAt.slice(0, 10)}까지 유효하며 한 번만 사용할 수
              있습니다.
              {result.emailSent
                ? " 안내 메일을 보냈습니다."
                : email.trim()
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
const Canvas = styled.canvas`
  display: block;
  margin: 0 auto 12px;
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
const ErrorText = styled.p`
  font-size: 13px;
  color: #c62828;
  margin: 10px 0 0;
`;
