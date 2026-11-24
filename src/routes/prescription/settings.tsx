import { useEffect, useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
import { saveRxSettings } from "../../api/prescription";
import { PRESETS, REM_CHIPS, type RxSettings } from "./doc";
import { shrinkImage } from "./stage";

/**
 * 처방전 양식 설정. 병원 단위로 서버에 저장한다 - 같은 병원 의사는 같은 양식을 쓴다.
 * 교수님 양식의 설정에서 병원 정보·처방의·문구·설명란·REMARKS 칩을 옮겼다.
 * ponytail: 테두리·워터마크·설명란 스타일/위치, 설정 내보내기/불러오기, 칩 순서 바꾸기는 뺐다. 요청이 오면 붙인다.
 */
export function SettingsDialog({ open, onClose, initial, onSaved }: { open: boolean; onClose: () => void; initial: RxSettings; onSaved: () => void }) {
  const [S, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChip, setNewChip] = useState("");
  useEffect(() => {
    if (open) setS(initial);
  }, [open, initial]);

  const set = (p: Partial<RxSettings>) => setS((s) => ({ ...s, ...p }));
  const field: React.CSSProperties = { width: "100%", padding: "7px 9px", border: "1px solid #d5dce4", borderRadius: 5, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" };
  const legend: React.CSSProperties = { fontSize: 12, fontWeight: 600, letterSpacing: ".1em", color: "#5d6b7a", padding: "0 6px" };
  const fs: React.CSSProperties = { border: "1px solid #d5dce4", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveRxSettings(S);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>처방전 양식 설정 <small style={{ fontSize: 12, color: "#888" }}>병원 전체가 같이 씁니다</small></DialogTitle>
      <DialogContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <fieldset style={fs}>
          <legend style={legend}>병원 정보</legend>
          <label>병원명<input style={field} value={S.hospital} onChange={(e) => set({ hospital: e.target.value })} /></label>
          <label>주소·연락처 (여러 줄)<textarea style={{ ...field, minHeight: 56 }} value={S.sub} onChange={(e) => set({ sub: e.target.value })} /></label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            로고 이미지
            <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ logo: await shrinkImage(f, 480) }); }} />
            {S.logo && (
              <>
                <img src={S.logo} alt="" style={{ maxHeight: 32 }} />
                <button type="button" onClick={() => set({ logo: "" })}>로고 삭제</button>
              </>
            )}
          </label>
        </fieldset>

        <fieldset style={fs}>
          <legend style={legend}>처방의 (입력 화면에서 눌러 고릅니다)</legend>
          {S.doctors.map((d, i) => (
            <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, alignItems: "center" }}>
              <input style={field} placeholder="이름" value={d.name} onChange={(e) => set({ doctors: S.doctors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <input style={field} placeholder="면허번호" value={d.license} onChange={(e) => set({ doctors: S.doctors.map((x, j) => (j === i ? { ...x, license: e.target.value } : x)) })} />
              <label style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 12 }}>
                {d.stamp ? <img src={d.stamp} alt="도장" style={{ height: 28 }} /> : "도장"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ width: 90 }}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const stamp = await shrinkImage(f, 240);
                    set({ doctors: S.doctors.map((x, j) => (j === i ? { ...x, stamp } : x)) });
                  }}
                />
              </label>
              <button type="button" onClick={() => set({ doctors: S.doctors.filter((_, j) => j !== i) })}>삭제</button>
            </div>
          ))}
          <button type="button" style={{ alignSelf: "flex-start" }} onClick={() => set({ doctors: [...S.doctors, { id: Math.random().toString(36).slice(2, 9), name: "", license: "", stamp: "" }] })}>
            + 의사 추가
          </button>
        </fieldset>

        <fieldset style={fs}>
          <legend style={legend}>디자인 · 문구</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <label>제목 (A4)<input style={field} value={S.title} onChange={(e) => set({ title: e.target.value })} /></label>
            <label>강조색<br /><input type="color" value={S.accent} onChange={(e) => set({ accent: e.target.value })} /></label>
          </div>
          <label>A4 하단 문구 기본값 (유효기간 등)<textarea style={{ ...field, minHeight: 56 }} value={S.valid} onChange={(e) => set({ valid: e.target.value })} /></label>
          <label>명함 뒷면 문구<input style={field} value={S.cardMsg} onChange={(e) => set({ cardMsg: e.target.value })} /></label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={S.qrOn} onChange={(e) => set({ qrOn: e.target.checked })} /> 마이오닥 QR 표시 (A4 하단·명함 앞뒷면)
          </label>
          <label>QR 안내 문구<input style={field} value={S.qrText} onChange={(e) => set({ qrText: e.target.value })} /></label>
        </fieldset>

        <fieldset style={fs}>
          <legend style={legend}>설명란 (A4)</legend>
          {S.blocks.map((b, i) => (
            <div key={i} style={{ border: "1px solid #d5dce4", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 6, background: "#f7f9fb" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={b.on} onChange={(e) => set({ blocks: S.blocks.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)) })} />
                <input style={field} placeholder="제목" value={b.title} onChange={(e) => set({ blocks: S.blocks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <button type="button" onClick={() => set({ blocks: S.blocks.filter((_, j) => j !== i) })}>삭제</button>
              </div>
              <textarea style={{ ...field, minHeight: 56 }} value={b.body} onChange={(e) => set({ blocks: S.blocks.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value=""
              onChange={(e) => {
                const k = e.target.value;
                if (k) set({ blocks: [...S.blocks, { on: true, title: k, body: PRESETS[k] }] });
              }}
            >
              <option value="">+ 템플릿 추가…</option>
              {Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
            </select>
            <button type="button" onClick={() => set({ blocks: [...S.blocks, { on: true, title: "", body: "" }] })}>+ 빈 설명란</button>
          </div>
        </fieldset>

        <fieldset style={fs}>
          <legend style={legend}>REMARKS 빠른입력</legend>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {S.remChips.map((c, i) => (
              <span key={c} style={{ border: "1px solid #d5dce4", borderRadius: 14, padding: "3px 4px 3px 10px", fontSize: 13 }}>
                {c} <button type="button" aria-label={`${c} 삭제`} onClick={() => set({ remChips: S.remChips.filter((_, j) => j !== i) })} style={{ border: 0, background: "none", cursor: "pointer" }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={field} placeholder="새 항목 (예: 렌즈 제품명)" value={newChip} onChange={(e) => setNewChip(e.target.value)} />
            <button type="button" onClick={() => { const v = newChip.trim(); if (v && !S.remChips.includes(v)) set({ remChips: [...S.remChips, v] }); setNewChip(""); }}>추가</button>
            <button type="button" onClick={() => set({ remChips: REM_CHIPS.slice() })}>기본값 복원</button>
          </div>
        </fieldset>
        {error && <p style={{ color: "#b3261e", margin: 0 }}>{error}</p>}
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>취소</PrimaryNagativeButton>
        <PrimaryButton onClick={save} disabled={busy}>{busy ? "저장 중…" : "저장"}</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
