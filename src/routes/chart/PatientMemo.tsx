import { useState } from "react";
import StickyNote2 from "@mui/icons-material/StickyNote2";
import { MemoDialog } from "../../components/memo_dialog";

/** 병원 내부 메모. 차트를 연 채로 바로 보고 고칠 수 있게 병록번호 옆에 둔다. */
export function PatientMemo({
  patientId,
  memo,
}: {
  patientId: string;
  memo: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
          style={{
            fontSize: "18px",
            color: memo ? "#f5a623" : "#bbb",
            flexShrink: 0,
          }}
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
      {open && (
        <MemoDialog
          patientId={patientId}
          memo={memo}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
