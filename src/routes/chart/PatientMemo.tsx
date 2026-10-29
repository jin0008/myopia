import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import StickyNote2 from "@mui/icons-material/StickyNote2";
import { updatePatient } from "../../api/patient";
import { TextInput } from "../../components/input";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";

/** 병원 내부 메모. 차트를 연 채로 바로 보고 고칠 수 있게 병록번호 옆에 둔다. */
export function PatientMemo({
  patientId,
  memo,
}: {
  patientId: string;
  memo: string | null;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) =>
      updatePatient({ id: patientId, memo: value }),
    onSuccess: () => {
      // 목록 카드의 메모 표시도 함께 바뀌어야 한다.
      queryClient.invalidateQueries({ queryKey: ["patient"] });
      setDraft(null);
    },
    onError: () => alert("An error occured"),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setDraft(memo ?? "")}
        title={memo || "메모 추가"}
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 12px",
          border: "1px solid #f5d9a8",
          borderRadius: "12px",
          background: memo ? "#fff8eb" : "white",
          color: memo ? "#5c4a1f" : "#999",
          fontSize: "14px",
          fontFamily: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <StickyNote2
          style={{ fontSize: "18px", color: "#f5a623", flexShrink: 0 }}
        />
        {/* 한 줄로만 보인다. 여러 줄이 되면 옆의 병록번호 칸까지 같이 늘어난다. */}
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {memo || "메모 추가"}
        </span>
      </button>
      {draft != null && (
        <Dialog
          open={true}
          onClose={() => setDraft(null)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Memo</DialogTitle>
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
            <PrimaryNagativeButton onClick={() => setDraft(null)}>
              Cancel
            </PrimaryNagativeButton>
            <PrimaryButton
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(draft)}
            >
              Save
            </PrimaryButton>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
