import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";

import { UserContext } from "../../App";
import { getRxSettings } from "../../api/prescription";
import { hospitalDisplayName } from "../../lib/hospitalName";
import { A4, CardBack, CardFront, DOC_CSS, defaultSettings, type DocData, type RxSettings } from "./doc";

export type Mode = "card" | "a4";
export interface PrintOpts {
  mode: Mode;
  cardBack: boolean;
  /** 명함 프린터가 없으면 A4 한 장에 명함 크기로 배치해 잘라 쓴다. */
  cardOnA4: boolean;
}

/** 병원 양식. 서버에 없으면 기본값(병원 이름으로 채움). 저장돼 있으면 기본값 위에 덮는다. */
export function useRxSettings() {
  const { user } = useContext(UserContext);
  const hospital = user?.healthcare_professional?.hospital;
  const q = useQuery({ queryKey: ["rx-settings"], queryFn: getRxSettings, enabled: !!hospital });
  const base = defaultSettings({ name: hospital ? hospitalDisplayName(hospital, "ko") : "", address: hospital?.address ?? null, phone: hospital?.phone ?? null });
  const saved = (q.data?.settings ?? null) as Partial<RxSettings> | null;
  return { settings: { ...base, ...(saved ?? {}) } as RxSettings, loading: q.isLoading, refetch: q.refetch };
}

/**
 * 명함 REMARKS 가 길면 명함 안에 들어오게 글자를 줄인다(6.5pt → 4.5pt).
 * 미리보기에서 잰 값을 인쇄에도 쓴다.
 */
function useFitCard(ref: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  const [pt, setPt] = useState(6.5);
  const [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const card = ref.current?.querySelector<HTMLElement>(".card:not(.back)");
    const rem = card?.querySelector<HTMLElement>(".c-rem");
    if (!card || !rem) return;
    let p = 6.5;
    rem.style.fontSize = `${p}pt`;
    while (card.scrollHeight > card.clientHeight + 1 && p > 4.5) {
      p -= 0.25;
      rem.style.fontSize = `${p}pt`;
    }
    setPt(p);
    setOverflow(card.scrollHeight > card.clientHeight + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 출력 내용이 바뀔 때마다 다시 잰다
  }, deps);
  return { pt, overflow };
}

/** 오른쪽 실물 크기 미리보기. 화면 폭에 맞춰 확대·축소한다. */
export function Stage({ D, S, opts, onFit }: { D: DocData; S: RxSettings; opts: PrintOpts; onFit?: (pt: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fit = useFitCard(wrap, [D, S, opts.mode, w]);
  useEffect(() => onFit?.(fit.pt), [fit.pt, onFit]);

  const zoom = opts.mode === "card" ? Math.max(0.6, Math.min(2.4, (w - 48) / 340)) : Math.min(1, (w - 48) / 794);
  return (
    <div ref={wrap} className="rxdoc-root" style={{ background: "#e9edf1", borderRadius: 12, padding: 24, minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <style>{DOC_CSS}</style>
      <div style={{ zoom, display: "flex", flexDirection: "column", gap: "6mm" }}>
        {opts.mode === "card" ? (
          <>
            <CardFront D={D} S={S} />
            {opts.cardBack && <CardBack D={D} S={S} />}
          </>
        ) : (
          <A4 D={D} S={S} />
        )}
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: fit.overflow ? "#b3261e" : "#5d6b7a" }}>
        {opts.mode === "a4"
          ? "A4, 배율 100%, '배경 그래픽' 켜기로 인쇄하세요."
          : fit.overflow
            ? "REMARKS 가 명함에 다 들어가지 않습니다. 줄이거나 A4 를 사용하세요."
            : opts.cardOnA4
              ? "A4 용지에 명함 크기로 배치되어 재단선과 함께 인쇄됩니다."
              : `인쇄 대화상자에서 용지를 90×50mm(명함/라벨 용지), 여백 '없음', 배율 100%로 고르세요.${fit.pt < 6.5 ? ` · REMARKS 글자 ${fit.pt}pt 로 줄임` : ""}`}
      </p>
    </div>
  );
}

/** 인쇄할 때만 보이는 영역. body 바로 아래에 두고 나머지 화면은 인쇄에서 숨긴다. */
export function PrintArea({ D, S, opts, remPt }: { D: DocData; S: RxSettings; opts: PrintOpts; remPt: number }) {
  const page = opts.mode === "a4" || opts.cardOnA4 ? "210mm 297mm" : "90mm 50mm";
  return createPortal(
    <div id="rx-print-area" className="rxdoc-root">
      <style>{DOC_CSS + `@page{size:${page};margin:0}`}</style>
      {opts.mode === "a4" ? (
        <div className="pg"><A4 D={D} S={S} /></div>
      ) : opts.cardOnA4 ? (
        <div className="pg sheet">
          <CardFront D={D} S={S} remPt={remPt} />
          {opts.cardBack && <CardBack D={D} S={S} />}
        </div>
      ) : (
        <>
          <div className="pg"><CardFront D={D} S={S} remPt={remPt} /></div>
          {opts.cardBack && <div className="pg"><CardBack D={D} S={S} /></div>}
        </>
      )}
    </div>,
    document.body,
  );
}

/** 인쇄 옵션 줄(명함/A4, 뒷면, A4 배치). 기기에 남긴다 - 진료실 프린터는 잘 안 바뀐다. */
export function usePrintOpts(): [PrintOpts, (p: Partial<PrintOpts>) => void] {
  const [o, setO] = useState<PrintOpts>(() => {
    try {
      return { mode: "card", cardBack: true, cardOnA4: false, ...JSON.parse(localStorage.getItem("rx_print_opts") ?? "{}") };
    } catch {
      return { mode: "card", cardBack: true, cardOnA4: false };
    }
  });
  const set = (p: Partial<PrintOpts>) =>
    setO((cur) => {
      const next = { ...cur, ...p };
      try {
        localStorage.setItem("rx_print_opts", JSON.stringify(next));
      } catch {
        /* 저장 못 해도 이번 화면에는 적용 */
      }
      return next;
    });
  return [o, set];
}

export function PrintOptsBar({ opts, set }: { opts: PrintOpts; set: (p: Partial<PrintOpts>) => void }) {
  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => set({ mode: m })}
      aria-pressed={opts.mode === m}
      style={{
        padding: "7px 14px",
        borderRadius: 6,
        border: `1px solid ${opts.mode === m ? "#1f5f8b" : "#d5dce4"}`,
        background: opts.mode === m ? "#1f5f8b" : "white",
        color: opts.mode === m ? "white" : "#1b2430",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
      {tab("card", "명함 (90×50mm)")}
      {tab("a4", "A4")}
      {opts.mode === "card" && (
        <>
          <label style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            <input type="checkbox" checked={opts.cardBack} onChange={(e) => set({ cardBack: e.target.checked })} /> 뒷면 포함
          </label>
          <label style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            <input type="checkbox" checked={opts.cardOnA4} onChange={(e) => set({ cardOnA4: e.target.checked })} /> A4 용지에 배치
          </label>
        </>
      )}
    </div>
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
