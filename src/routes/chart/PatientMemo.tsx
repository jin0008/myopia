import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    mutationFn: (value: string) => updatePatient({ id: patientId, memo: value }),
    onSuccess: () => {
      // 목록 카드의 메모 표시도 함께 바뀌어야 한다.
      queryClient.invalidateQueries({ queryKey: ["patient"] });
      setDraft(null);
    },
    onError: () => alert("An error occured"),
  });

  if (draft != null) {
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <TextInput
          as="textarea"
          rows={3}
          maxLength={1000}
          autoFocus
          placeholder="병원 내부 메모 (환자·보호자에게 보이지 않음)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ fontFamily: "inherit", resize: "vertical", width: "100%", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <PrimaryNagativeButton onClick={() => setDraft(null)}>
            Cancel
          </PrimaryNagativeButton>
          <PrimaryButton
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(draft)}
          >
            Save
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDraft(memo ?? "")}
      title="메모 수정"
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "flex-start",
        gap: "6px",
        padding: "8px 12px",
        border: "1px solid #f5d9a8",
        borderRadius: "12px",
        background: memo ? "#fff8eb" : "white",
        color: memo ? "#5c4a1f" : "#999",
        fontSize: "14px",
        fontFamily: "inherit",
        textAlign: "left",
        whiteSpace: "pre-wrap",
        cursor: "pointer",
      }}
    >
      <StickyNote2 style={{ fontSize: "18px", color: "#f5a623", flexShrink: 0 }} />
      {memo || "메모 추가"}
    </button>
  );
}
