import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";

import { UserContext } from "../../App";
import { getRxSettings } from "../../api/prescription";
import { hospitalDisplayName } from "../../lib/hospitalName";
import { A4, DOC_CSS, defaultSettings, type DocData, type RxSettings } from "./doc";

/** 병원 양식. 서버에 없으면 기본값(병원 이름으로 채움). 저장돼 있으면 기본값 위에 덮는다. */
export function useRxSettings() {
  const { user } = useContext(UserContext);
  const hospital = user?.healthcare_professional?.hospital;
  const q = useQuery({ queryKey: ["rx-settings"], queryFn: getRxSettings, enabled: !!hospital && !!user?.rx_pilot });
  const base = defaultSettings({ name: hospital ? hospitalDisplayName(hospital, "ko") : "", address: hospital?.address ?? null, phone: hospital?.phone ?? null });
  const saved = (q.data?.settings ?? null) as Partial<RxSettings> | null;
  return { settings: { ...base, ...(saved ?? {}) } as RxSettings, loading: q.isLoading, refetch: q.refetch };
}

/** 실물 크기 미리보기. 화면 폭에 맞춰 줄인다. */
export function Stage({ D, S }: { D: DocData; S: RxSettings }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const zoom = Math.min(1, (w - 48) / 794);
  return (
    <div ref={wrap} className="rxdoc-root" style={{ background: "#e9edf1", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <style>{DOC_CSS}</style>
      <div style={{ zoom }}>
        <A4 D={D} S={S} />
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: "#5d6b7a" }}>A4, 배율 100%, '배경 그래픽' 켜기로 인쇄하세요.</p>
    </div>
  );
}

/** 인쇄할 때만 보이는 영역. body 바로 아래에 두고 나머지 화면은 인쇄에서 숨긴다. */
export function PrintArea({ D, S }: { D: DocData; S: RxSettings }) {
  return createPortal(
    <div id="rx-print-area" className="rxdoc-root">
      <style>{DOC_CSS + "@page{size:210mm 297mm;margin:0}"}</style>
      <A4 D={D} S={S} />
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
