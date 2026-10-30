import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { updatePatient } from "../api/patient";
import { TextInput } from "./input";
import { PrimaryButton, PrimaryNagativeButton } from "./button";

/** 병원 내부 환자 메모를 쓰는 창. 목록 카드와 차트 화면이 함께 쓴다. */
export function MemoDialog({
  patientId,
  registration,
  memo,
  onClose,
}: {
  patientId: string;
  registration?: string;
  memo: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(memo ?? "");

  const mutation = useMutation({
    mutationFn: (value: string) =>
      updatePatient({ id: patientId, memo: value }),
    onSuccess: () => {
      // 목록 카드와 차트가 같은 키 아래에 있어 둘 다 새로 받는다.
      queryClient.invalidateQueries({ queryKey: ["patient"] });
      onClose();
    },
    onError: () => alert("An error occured"),
  });

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Memo{registration ? ` — ${registration}` : ""}</DialogTitle>
      <DialogContent>
        <TextInput
          as="textarea"
          rows={6}
          maxLength={1000}
          autoFocus
          placeholder="병원 내부 메모 (환자·보호자에게 보이지 않음)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ fontFamily: "inherit", resize: "vertical" }}
        />
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Cancel</PrimaryNagativeButton>
        <PrimaryButton
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(draft)}
        >
          Save
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
