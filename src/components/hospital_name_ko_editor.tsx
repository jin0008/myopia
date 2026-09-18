import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TextInput } from "./input";
import { OutlinedButton, PrimaryButton } from "./button";
import type { HospitalNames } from "../lib/hospitalName";

/**
 * 병원 한글 표시 이름 편집.
 *
 * 원래 이름(가입 때 이름)은 바꾸지 않고 보여 주기만 한다. 한글 이름을
 * 비우고 저장하면 원래 이름이 그대로 쓰인다.
 */
export default function HospitalNameKoEditor({
  hospital,
  onSave,
}: {
  hospital: HospitalNames;
  onSave: (nameKo: string | null) => Promise<unknown>;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(hospital.name_ko ?? "");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setValue(hospital.name_ko ?? "");
    setMessage(null);
  }, [hospital.name, hospital.name_ko]);

  const mutation = useMutation({
    mutationFn: (nameKo: string | null) => onSave(nameKo),
    onSuccess: (_data, nameKo) => {
      queryClient.invalidateQueries({ queryKey: ["hospital"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setMessage(nameKo ? "저장했습니다." : "한글 이름을 비웠습니다. 원래 이름이 표시됩니다.");
    },
    onError: () => setMessage("저장하지 못했습니다. 다시 시도해 주세요."),
  });

  const trimmed = value.trim();
  const unchanged = trimmed === (hospital.name_ko ?? "").trim();

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "12px 14px",
        margin: "8px 0 16px",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>병원 이름</div>
      <div style={{ fontSize: 14, color: "#374151", marginBottom: 8 }}>
        가입 때 이름: <strong>{hospital.name}</strong>
      </div>
      <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
        한글 이름 (선택 — 비워 두면 가입 때 이름이 그대로 표시됩니다)
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <TextInput
          value={value}
          maxLength={100}
          placeholder="예: 세브란스병원"
          onChange={(e) => {
            setValue(e.target.value);
            setMessage(null);
          }}
          style={{ flex: 1, minWidth: 200 }}
        />
        <PrimaryButton
          disabled={unchanged || mutation.isPending}
          onClick={() => mutation.mutate(trimmed || null)}
        >
          저장
        </PrimaryButton>
        {hospital.name_ko && (
          <OutlinedButton
            disabled={mutation.isPending}
            onClick={() => {
              setValue("");
              mutation.mutate(null);
            }}
          >
            비우기
          </OutlinedButton>
        )}
      </div>
      {message && (
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{message}</div>
      )}
    </div>
  );
}
