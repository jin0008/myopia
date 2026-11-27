import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";

import { UserContext } from "../../App";
import { getRxSettings } from "../../api/prescription";
import { hospitalDisplayName } from "../../lib/hospitalName";
import { DOC_CSS, Doc, OLD_DEFAULTS, PAPER, defaultSettings, type DocData, type PaperSize, type RxSettings } from "./doc";

/** 병원 양식. 서버에 없으면 기본값(병원 이름으로 채움). 저장돼 있으면 기본값 위에 덮는다. */
export function useRxSettings() {
  const { user } = useContext(UserContext);
  const hospital = user?.healthcare_professional?.hospital;
  const q = useQuery({ queryKey: ["rx-settings"], queryFn: getRxSettings, enabled: !!hospital && !!user?.rx_pilot });
  const base = defaultSettings({ name: hospital ? hospitalDisplayName(hospital, "ko") : "", address: hospital?.address ?? null, phone: hospital?.phone ?? null });
  const saved = { ...((q.data?.settings ?? {}) as Partial<RxSettings>) };
  for (const [k, v] of Object.entries(OLD_DEFAULTS)) if (saved[k as keyof RxSettings] === v) delete saved[k as keyof RxSettings];
  return { settings: { ...base, ...saved } as RxSettings, loading: q.isLoading, refetch: q.refetch };
}

/** 고른 출력 크기. 병원마다 늘 같은 크기를 쓸 테니 이 브라우저에 기억해 둔다. */
export function usePaperSize() {
  const [size, setSize] = useState<PaperSize>(() => {
    try {
      const v = localStorage.getItem("rx-paper");
      if (v === "a4" || v === "post" || v === "card") return v;
    } catch { /* 저장소를 못 쓰면 A4 */ }
    return "a4";
  });
  const choose = (v: PaperSize) => {
    setSize(v);
    try { localStorage.setItem("rx-paper", v); } catch { /* 기억만 못 한다 */ }
  };
  return [size, choose] as const;
}

export function SizePicker({ size, onChange }: { size: PaperSize; onChange: (v: PaperSize) => void }) {
  return (
    <div role="group" aria-label="출력 크기" style={{ display: "inline-flex", border: "1px solid #c8d1db", borderRadius: 6, overflow: "hidden" }}>
      {(Object.keys(PAPER) as PaperSize[]).map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={size === k}
          onClick={() => onChange(k)}
          title={`${PAPER[k].w}×${PAPER[k].h}mm`}
          style={{ padding: "7px 12px", border: 0, borderLeft: k === "a4" ? 0 : "1px solid #c8d1db", background: size === k ? "#1f5f8b" : "white", color: size === k ? "white" : "#334", fontWeight: size === k ? 600 : 400, cursor: "pointer" }}
        >
          {PAPER[k].label}
        </button>
      ))}
    </div>
  );
}

/** 실물 크기 미리보기. A4·엽서는 화면 폭에 맞춰 줄이고, 명함은 작아서 키워 보여 준다. */
export function Stage({ D, S, size }: { D: DocData; S: RxSettings; size: PaperSize }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // 설명란이 길면 엽서·A4 는 종이 밖으로 자라고, 명함은 잘린다. 미리보기에서 재서 알린다.
  // 너비 대비 높이로 재서 확대 배율과 상관없다.
  const inner = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const el = inner.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    setOver(size === "card" ? el.scrollHeight > el.clientHeight + 1 : el.offsetHeight > (el.offsetWidth * PAPER[size].h) / PAPER[size].w + 2);
  });
  const px = PAPER[size].w * 3.78;
  const zoom = Math.min(size === "card" ? 2 : 1, (w - 48) / px);
  const hint = size === "a4" ? "A4, 배율 100%, '배경 그래픽' 켜기로 인쇄하세요." : `A4 용지에 실제 크기(${PAPER[size].w}×${PAPER[size].h}mm)로 찍힙니다. 배율 100%로 인쇄하고 점선을 따라 자르세요.`;
  return (
    <div ref={wrap} className="rxdoc-root" style={{ background: "#e9edf1", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <style>{DOC_CSS}</style>
      <div ref={inner} style={{ zoom }}>
        <Doc D={D} S={S} size={size} />
      </div>
      {over && (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: "#b3261e", fontWeight: 600, textAlign: "center" }}>
          {PAPER[size].label} 한 장에 다 들어가지 않습니다. REMARKS·설명란을 줄이{size === "a4" ? "세요." : "거나 더 큰 크기를 고르세요."}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 12.5, color: "#5d6b7a", textAlign: "center" }}>{hint}</p>
    </div>
  );
}

/** 인쇄할 때만 보이는 영역. body 바로 아래에 두고 나머지 화면은 인쇄에서 숨긴다. */
export function PrintArea({ D, S, size }: { D: DocData; S: RxSettings; size: PaperSize }) {
  return createPortal(
    <div id="rx-print-area" className="rxdoc-root">
      <style>{DOC_CSS + "@page{size:210mm 297mm;margin:0}"}</style>
      {size === "a4" ? (
        <Doc D={D} S={S} size={size} />
      ) : (
        <div className="sheet">
          <div className="cut"><Doc D={D} S={S} size={size} /></div>
        </div>
      )}
    </div>,
    document.body,
  );
}

/** 로고·도장을 작게 줄여 data URL 로. 원본 사진을 그대로 넣으면 양식 저장이 거절된다. */
export function shrinkImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
