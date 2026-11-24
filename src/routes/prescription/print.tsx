import { useCallback, useContext, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { UserContext } from "../../App";
import NotLoggedIn from "../../components/not_logged_in";
import { APP_DOWNLOAD_URL } from "../../components/app_download_qr";
import { createLinkInvite } from "../../api/patient";
import { getPrescription, type EyeRx } from "../../api/prescription";
import { ageAt, ageStr, fmtD } from "../../lib/rx";
import { FOOT_PRESETS, type DocData, type Row } from "./doc";
import { PrintArea, PrintOptsBar, Stage, usePrintOpts, useRxSettings } from "./stage";

/** 저장된 숫자 → 찍을 글자. */
function rowsOf(e: EyeRx): { od: Row; os: Row } {
  const r = (eye: "od" | "os"): Row => ({
    sph: fmtD(e[`sph_${eye}`]),
    cyl: fmtD(e[`cyl_${eye}`]),
    axis: e[`axis_${eye}`] != null ? String(e[`axis_${eye}`]) : "",
    prism: e[`prism_${eye}`] != null ? String(e[`prism_${eye}`]) : "",
    base: e[`base_${eye}`] ?? "",
  });
  return { od: r("od"), os: r("os") };
}

/**
 * 발행한 처방전 다시 인쇄. 이름은 서버에 없어 다시 적는다.
 * 연동 링크도 서버에 없다(지금 한 번만 존재한다) - 미연동이면 앱 설치 QR 이
 * 찍히고, 바로 연동되게 하려면 새로 발급한다(앞서 준 링크는 무효).
 */
export default function PrescriptionPrint() {
  const { id = "" } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { settings: S } = useRxSettings();
  const [opts, setOpts] = usePrintOpts();
  const { data: rx, error } = useQuery({ queryKey: ["prescription", id], queryFn: () => getPrescription(id), enabled: !!user });
  const [name, setName] = useState("");
  const [valid, setValid] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ url: string; expires_at: string } | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [remPt, setRemPt] = useState(6.5);
  const onFit = useCallback((pt: number) => setRemPt(pt), []);

  if (user == null) return <NotLoggedIn />;
  if (error) return <p style={{ padding: 32 }}>처방전을 찾을 수 없습니다.</p>;
  if (!rx) return <p style={{ padding: 32 }}>불러오는 중…</p>;

  const far = rowsOf(rx.far);
  const near = rowsOf(rx.near);
  const nearOn = Object.values(rx.near).some((v) => v != null) || rx.add_od != null;
  const D: DocData = {
    name,
    age: ageStr(ageAt(rx.patient.date_of_birth.slice(0, 10), rx.prescribed_on)),
    date: rx.prescribed_on,
    pd: rx.pd_far != null ? String(rx.pd_far) : "",
    npd: rx.pd_near != null ? String(rx.pd_near) : "",
    add: fmtD(rx.add_od),
    nearOn,
    d_od: far.od, d_os: far.os, n_od: near.od, n_os: near.os,
    remarks: rx.note ?? "",
    // 고른 처방의의 도장은 설정에서 이름으로 다시 찾는다.
    doc: { name: rx.prescriber_name, license: rx.prescriber_license ?? "", stamp: S.doctors.find((d) => d.name === rx.prescriber_name)?.stamp ?? "" },
    valid: valid ?? S.valid,
    qrUrl: invite?.url ?? APP_DOWNLOAD_URL,
  };

  const issueInvite = async () => {
    setIssuing(true);
    try {
      const r = await createLinkInvite(rx.patient_id);
      setInvite({ url: r.url, expires_at: r.expiresAt });
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div style={{ background: "#eef1f4", minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #d5dce4", background: "white", flexWrap: "wrap" }}>
        <button type="button" onClick={() => navigate("/prescription")} style={{ padding: "7px 12px" }}>← 처방전 발행</button>
        <h1 style={{ fontSize: 17, margin: 0 }}>다시 인쇄 · {rx.patient.registration_number} · {rx.prescribed_on}</h1>
        <PrintOptsBar opts={opts} set={setOpts} />
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => window.print()} style={{ padding: "8px 16px", background: "#1f5f8b", color: "white", border: 0, borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
          인쇄
        </button>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 380px) 1fr", gap: 20, padding: 20, alignItems: "start" }}>
        <div style={{ background: "white", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
          <label>
            이름 (인쇄용, 저장 안 함)
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 7, boxSizing: "border-box" }} />
          </label>
          {!rx.patient.linked && !invite && (
            <div style={{ background: "#fff7e6", border: "1px solid #f0d9a8", borderRadius: 8, padding: 10 }}>
              앱 미연동 환자입니다. 지금은 앱 설치 QR 이 찍힙니다.
              <br />
              <button type="button" onClick={issueInvite} disabled={issuing} style={{ marginTop: 6, padding: "6px 10px" }}>
                {issuing ? "발급 중…" : "연동 QR 새로 발급"}
              </button>
              <div style={{ color: "#8a5a00", fontSize: 12, marginTop: 4 }}>새로 발급하면 앞서 준 연동 QR 은 못 쓰게 됩니다.</div>
            </div>
          )}
          {invite && <div style={{ color: "#00875a" }}>연동 QR 을 발급했습니다 ({invite.expires_at.slice(0, 10)}까지).</div>}
          {opts.mode === "a4" && (
            <label>
              A4 하단 문구
              <select value="" onChange={(e) => { const p = FOOT_PRESETS.find((x) => x.name === e.target.value); if (p) setValid(p.text); }} style={{ width: "100%", padding: 6 }}>
                <option value="">상용구 선택…</option>
                {FOOT_PRESETS.map((p) => <option key={p.name}>{p.name}</option>)}
              </select>
            </label>
          )}
        </div>
        <Stage D={D} S={S} opts={opts} onFit={onFit} />
      </div>
      <PrintArea D={D} S={S} opts={opts} remPt={remPt} />
    </div>
  );
}
