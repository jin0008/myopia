import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { getCurrentUser, submitConsent } from "../api/auth";
import { HttpError } from "../lib/fetch";
import { PrimaryButton } from "./button";
import ConsentChecklist, {
  ConsentValue,
  isRequiredAgreed,
} from "./consent_checklist";

// Blocking re-consent prompt for existing users. When the logged-in user is
// missing the required consents at the current version (user.needs_consent),
// this modal forces them to agree before continuing. It cannot be dismissed
// without agreeing.
export default function ConsentGate() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  const [consent, setConsent] = useState<ConsentValue>({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Only show for a logged-in user that still needs consent.
  if (!user || !user.needs_consent) return null;

  function handleSubmit() {
    if (!isRequiredAgreed(consent) || submitting) return;
    setSubmitting(true);
    submitConsent({
      agree_terms: true,
      agree_privacy: true,
      agree_marketing: consent.marketing,
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["currentUser"] }))
      .catch((e: HttpError) => {
        console.error(e);
        alert("동의 처리에 실패했습니다. 다시 시도해 주세요.");
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <Dialog open disableEscapeKeyDown maxWidth="sm" fullWidth>
      <DialogTitle>약관 및 개인정보 처리 동의</DialogTitle>
      <DialogContent>
        <p style={{ fontSize: 14, color: "#555", marginTop: 0 }}>
          서비스 이용을 위해 아래 약관에 동의해 주세요. 필수 항목에 동의하셔야
          계속 이용하실 수 있습니다.
        </p>
        <ConsentChecklist value={consent} onChange={setConsent} />
      </DialogContent>
      <DialogActions>
        <PrimaryButton
          onClick={handleSubmit}
          disabled={!isRequiredAgreed(consent) || submitting}
        >
          {submitting ? "처리 중…" : "동의하고 계속하기"}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
