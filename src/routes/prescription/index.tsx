import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { UserContext } from "../../App";
import NotLoggedIn from "../../components/not_logged_in";
import { APP_DOWNLOAD_URL } from "../../components/app_download_qr";
import { HttpError } from "../../lib/fetch";
import { isRealDate, maskDate, ageAt, ageStr, fmtD, fmtPow, hasTok, okAxis, okPow, parseNum, toggleTok, transpose } from "../../lib/rx";
import { issuePrescription, listPrescriptions, lookupPatient, type Base, type EyeRx } from "../../api/prescription";
import { FOOT_PRESETS, emptyRow, type DocData, type Row } from "./doc";
import { PrintArea, Stage, useRxSettings } from "./stage";
import { SettingsDialog } from "./settings";

/* ------------------------------------------------------------------ *
 * 안경처방전 발행. 교수님 양식(안경처방전.html)처럼 왼쪽 입력, 오른쪽 실물
 * 미리보기. 다른 점은 "발행" - 인쇄하기 전에 서버에 저장하고, 앱 미연동
 * 환자면 그 아이 전용 연동 QR 을 받아 찍는다.
 * 이름은 저장하지 않는다(이 서비스는 환자를 이름 없이 다룬다). 인쇄에만 쓴다.
 * ------------------------------------------------------------------ */

const todayKst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
type RowKey = "d_od" | "d_os" | "n_od" | "n_os";

/** 출력용 글자 → 서버 숫자. 근용이 꺼져 있으면 보내지 않는다. */
function toEye(od: Row, os: Row): Partial<EyeRx> {
  const n = (v: string) => parseNum(v);
  const b = (r: Row) => ((r.base || null) as Base | null);
  return {
    sph_od: n(od.sph), sph_os: n(os.sph), cyl_od: n(od.cyl), cyl_os: n(os.cyl),
    axis_od: n(od.axis), axis_os: n(os.axis), prism_od: n(od.prism), prism_os: n(os.prism),
    base_od: n(od.prism) ? b(od) : null, base_os: n(os.prism) ? b(os) : null,
  };
}

function rowBad(r: Row) {
  const p = parseNum(r.prism);
  return {
    sph: !okPow(r.sph),
    cyl: !okPow(r.cyl),
    axis: !okAxis(r.axis, r.cyl),
    prism: !!r.prism.trim() && (p == null || Number.isNaN(p) || p < 0),
    base: !!p && p > 0 && !r.base,
  };
}

const C = { line: "#d5dce4", muted: "#5d6b7a", accent: "#1f5f8b", danger: "#b3261e", field: "#f7f9fb" };
const inp = (bad = false): React.CSSProperties => ({
  width: "100%", minWidth: 0, boxSizing: "border-box", padding: "6px 8px", fontSize: 14, fontFamily: "inherit",
  border: `1px solid ${bad ? C.danger : C.line}`, background: bad ? "#fff1f0" : C.field, borderRadius: 5,
});
const h2: React.CSSProperties = { fontSize: 12, fontWeight: 600, letterSpacing: ".12em", color: C.muted, margin: "0 0 10px" };
const sec: React.CSSProperties = { paddingTop: 16, marginTop: 16, borderTop: `1px dashed ${C.line}` };
const chip = (on: boolean): React.CSSProperties => ({
  padding: "3px 10px", borderRadius: 14, fontSize: 13, cursor: "pointer",
  border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accent : "white", color: on ? "white" : "#1b2430",
});

function RxTable({ rows, value, onChange, readOnly, disabled }: {
  rows: [RowKey, RowKey];
  value: Record<RowKey, Row>;
  onChange: (k: RowKey, r: Row) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  const tidy = (k: RowKey, f: keyof Row) => {
    const r = value[k];
    const v = r[f];
    if (!v) return;
    if (f === "sph" || f === "cyl") onChange(k, { ...r, [f]: fmtPow(v) });
    if (f === "axis" && Number(v) === 0) onChange(k, { ...r, axis: "180" }); // 0 은 180. 범위 밖(200 등)은 바꾸지 않고 빨갛게 둔다 - 오타를 다른 축으로 바꾸면 안 된다
  };
  return (
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 4, tableLayout: "fixed" }}>
      <thead>
        <tr style={{ fontSize: 12, color: C.muted }}>
          <th style={{ width: 34 }} /><th>SPH</th><th>CYL</th><th style={{ width: 54 }}>AXIS</th><th style={{ width: 54 }}>PRISM △</th><th style={{ width: 62 }}>BASE</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((k) => {
          const bad = rowBad(value[k]);
          return (
            <tr key={k}>
              <th style={{ fontSize: 13 }}>{k.endsWith("od") ? "OD" : "OS"}</th>
              {(["sph", "cyl", "axis", "prism"] as const).map((f) => (
                <td key={f}>
                  <input
                    inputMode="decimal"
                    aria-label={`${k} ${f}`}
                    value={value[k][f]}
                    readOnly={readOnly}
                    disabled={disabled}
                    onChange={(e) => onChange(k, { ...value[k], [f]: e.target.value })}
                    onBlur={() => tidy(k, f)}
                    style={{ ...inp(bad[f]), textAlign: "center", padding: "6px 2px", ...(readOnly ? { background: "#eef1f4" } : {}) }}
                  />
                </td>
              ))}
              <td>
                <select
                  aria-label={`${k} base`}
                  value={value[k].base}
                  disabled={readOnly || disabled}
                  onChange={(e) => onChange(k, { ...value[k], base: e.target.value })}
                  style={{ ...inp(bad.base), padding: "6px 2px" }}
                >
                  <option value="" />
                  {["BI", "BO", "BU", "BD"].map((b) => <option key={b}>{b}</option>)}
                </select>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function PrescriptionPage() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { settings: S, refetch } = useRxSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 미리보기는 눌러야 펼친다. 입력이 주 화면이고, 미리보기는 확인할 때만 본다.
  const [preview, setPreview] = useState(false);

  // 환자
  const [regNo, setRegNo] = useState("");
  const regNoRef = useRef(regNo);
  regNoRef.current = regNo;
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"" | "male" | "female">("");
  const [dob, setDob] = useState("");
  const [date, setDate] = useState(todayKst());
  const [found, setFound] = useState<null | { linked: boolean }>(null);
  // 처방의: 설정의 목록에서 고른다. 기기에 기억해 둔다(그 PC 는 대개 같은 의사가 쓴다).
  const [docId, setDocId] = useState(() => localStorage.getItem("rx_doc") ?? "");
  // 처방
  const [rows, setRows] = useState<Record<RowKey, Row>>({ d_od: emptyRow(), d_os: emptyRow(), n_od: emptyRow(), n_os: emptyRow() });
  const [pd, setPd] = useState("");
  const [nearOn, setNearOn] = useState(false);
  const [nearAuto, setNearAuto] = useState(true);
  const [add, setAdd] = useState("");
  const [npd, setNpd] = useState("");
  const [remarks, setRemarks] = useState("");
  const [valid, setValid] = useState<string | null>(null);
  // 발행
  const [issued, setIssued] = useState<null | { id: string; invite: { url: string; expires_at: string } | null }>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [printNonce, setPrintNonce] = useState(0);
  const [showMissing, setShowMissing] = useState(false);

  const recent = useQuery({ queryKey: ["prescriptions"], queryFn: () => listPrescriptions(), enabled: !!user?.healthcare_professional?.approved && !!user?.rx_pilot });
  const doc = S.doctors.find((d) => d.id === docId) ?? null;
  const locked = issued != null;

  // 근용 자동: 원용 + ADD. CYL·AXIS·PRISM 은 원용 그대로.
  const near = useMemo(() => {
    if (!nearOn || !nearAuto) return { n_od: rows.n_od, n_os: rows.n_os };
    const a = parseFloat(fmtPow(add)) || 0;
    const mk = (d: Row): Row => ({ ...d, sph: d.sph || add ? fmtD(Math.round(((parseFloat(d.sph) || 0) + a) * 4) / 4) : "" });
    return { n_od: mk(rows.d_od), n_os: mk(rows.d_os) };
  }, [nearOn, nearAuto, add, rows]);
  const allRows = { ...rows, ...near };

  const age = ageStr(ageAt(dob, date));
  const D: DocData = {
    name, age, date, pd, npd, add: fmtPow(add), nearOn,
    d_od: rows.d_od, d_os: rows.d_os, n_od: near.n_od, n_os: near.n_os,
    // 처방의를 안 고르면 서버가 로그인한 의료인으로 기록한다 - 종이에도 같게 찍어야 다시 인쇄와 어긋나지 않는다.
    remarks, doc: doc ? { name: doc.name, license: doc.license, stamp: doc.stamp } : { name: user?.healthcare_professional?.name ?? "", license: "", stamp: "" },
    valid: valid ?? S.valid,
    qrUrl: issued?.invite?.url ?? APP_DOWNLOAD_URL,
  };

  // 발행이 끝나 연동 QR 이 화면에 그려진 다음에 인쇄 대화상자를 연다.
  useEffect(() => {
    if (printNonce) window.print();
  }, [printNonce]);

  const lookup = async () => {
    setFound(null);
    if (!regNo.trim() || locked) return;
    try {
      const asked = regNo.trim();
      const r = await lookupPatient(asked);
      // 그 사이 번호를 바꿨으면 늦게 온 답을 버린다 - 다른 환자 생년월일로 잠기면 안 된다.
      if (asked !== regNoRef.current.trim()) return;
      if (r.exists) {
        setFound({ linked: r.patient.linked });
        setDob(r.patient.date_of_birth.slice(0, 10));
        setSex(r.patient.sex);
      }
    } catch {
      /* 못 찾으면 새 환자로 적는다 */
    }
  };

  if (user == null) return <NotLoggedIn />;
  // 먼저 보여 줄 사람만(백엔드 RX_PILOT_EMAILS). 주소를 직접 쳐도 막는다 - API 도 404.
  if (!user.rx_pilot) return <p style={{ padding: 32 }}>준비 중인 기능입니다.</p>;
  if (!user.healthcare_professional?.approved) return <p style={{ padding: 32 }}>승인된 의료인만 처방전을 발행할 수 있습니다.</p>;

  // PD·ADD 도 막는다. 숫자가 아니면 서버엔 null 로 가고 종이엔 친 글자가 찍혀 둘이 어긋난다.
  const pdBad = (v: string) => { const n = parseNum(v); return n != null && (Number.isNaN(n) || n < 40 || n > 80); };
  const extraBad = pdBad(pd) || (nearOn && (pdBad(npd) || !okPow(add) || (parseNum(add) ?? 0) < 0 || (parseNum(add) ?? 0) > 4));
  const anyBad = extraBad || (nearOn ? (["d_od", "d_os", "n_od", "n_os"] as const) : (["d_od", "d_os"] as const)).some((k) =>
    Object.values(rowBad(allRows[k])).some(Boolean),
  );
  const missing = [
    !regNo.trim() && "차트번호",
    !name.trim() && "이름",
    !sex && "성별",
    !isRealDate(dob) && "생년월일",
    (!isRealDate(date) || date > todayKst()) && "처방일",
  ].filter(Boolean) as string[];

  const setRow = (k: RowKey, r: Row) => setRows((cur) => ({ ...cur, [k]: r }));

  const issueAndPrint = async () => {
    if (locked) { setPrintNonce((n) => n + 1); return; }
    if (missing.length) { setShowMissing(true); setMsg("필수 입력 누락: " + missing.join(", ")); return; }
    if (anyBad) { setMsg("빨간 칸을 확인해 주세요."); return; }
    setBusy(true);
    setMsg(null);
    try {
      const a = nearOn ? parseNum(fmtPow(add)) : null;
      const r = await issuePrescription({
        registration_number: regNo.trim(),
        date_of_birth: dob,
        sex: sex as "male" | "female",
        prescribed_on: date,
        far: toEye(rows.d_od, rows.d_os),
        near: nearOn ? toEye(near.n_od, near.n_os) : {},
        pd_far: parseNum(pd),
        pd_near: nearOn ? parseNum(npd) : null,
        add_od: a,
        add_os: a,
        note: remarks.trim() || null,
        remark_tags: S.remChips.filter((c) => hasTok(remarks, c)),
        ...(doc ? { prescriber_name: doc.name, prescriber_license: doc.license || null } : {}),
      });
      setIssued({ id: r.prescription.id, invite: r.invite });
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      setPrintNonce((n) => n + 1);
    } catch (e) {
      if (e instanceof HttpError) {
        setMsg(
          e.code === 409
            ? e.message || "이 차트번호의 환자 생년월일·성별이 다릅니다. 차트번호를 다시 확인해 주세요."
            : e.fields?.map((f) => f.message).filter(Boolean).join(", ") || e.message || "발행하지 못했습니다.",
        );
      } else setMsg("발행하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setRegNo(""); setName(""); setSex(""); setDob(""); setDate(todayKst()); setFound(null);
    setRows({ d_od: emptyRow(), d_os: emptyRow(), n_od: emptyRow(), n_os: emptyRow() });
    setPd(""); setNearOn(false); setAdd(""); setNpd(""); setRemarks(""); setValid(null);
    setIssued(null); setMsg(null); setShowMissing(false);
  };

  const miss = (bad: boolean) => showMissing && bad;

  return (
    <div style={{ background: "#eef1f4", minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${C.line}`, background: "white", flexWrap: "wrap", position: "sticky", top: 0, zIndex: 5 }}>
        <h1 style={{ fontSize: 19, margin: 0 }}>안경처방전 <span style={{ color: "#c98a1a" }}>발행</span></h1>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={reset} style={{ padding: "7px 12px" }}>새 처방</button>
        <button type="button" onClick={() => setPreview((v) => !v)} aria-expanded={preview} style={{ padding: "7px 12px" }}>
          {preview ? "미리보기 닫기" : "미리보기"}
        </button>
        <button type="button" onClick={() => setSettingsOpen(true)} style={{ padding: "7px 12px" }}>설정</button>
        <button
          type="button"
          onClick={issueAndPrint}
          disabled={busy}
          style={{ padding: "8px 16px", background: C.accent, color: "white", border: 0, borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
        >
          {busy ? "발행 중…" : locked ? "다시 인쇄" : "발행하고 인쇄"}
        </button>
      </header>

      <div
        className="rx-app"
        style={{
          display: "grid",
          gridTemplateColumns: preview ? "minmax(340px, 460px) 1fr" : "minmax(0, 560px)",
          justifyContent: preview ? undefined : "center",
          gap: 20,
          padding: 20,
          alignItems: "start",
        }}
      >
        <style>{"@media (max-width: 900px){.rx-app{grid-template-columns:1fr!important}}"}</style>
        <div style={{ background: "white", borderRadius: 12, padding: 18, border: `1px solid ${C.line}` }}>
          {msg && <p role="alert" style={{ color: C.danger, margin: "0 0 10px", fontSize: 13.5 }}>{msg}</p>}
          {locked && (
            <div style={{ background: "#e8f5ee", border: "1px solid #b7e1c8", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13.5 }}>
              발행했습니다. {issued?.invite ? "처방전에 이 아이 전용 연동 QR 이 찍힙니다." : "보호자 앱에도 바로 보입니다."}
              <br />
              고치려면 <b>새 처방</b>으로 다시 발행하세요.
            </div>
          )}

          <h2 style={h2}>환자 정보</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ fontSize: 12, color: C.muted }}>
              차트번호 * <small>(병원 등록번호)</small>
              <input style={inp(miss(!regNo.trim()))} value={regNo} disabled={locked} onChange={(e) => { setRegNo(e.target.value); setFound(null); }} onBlur={lookup} />
            </label>
            <label style={{ fontSize: 12, color: C.muted }}>
              이름 * <small>(인쇄용, 저장 안 함)</small>
              <input style={inp(miss(!name.trim()))} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label style={{ fontSize: 12, color: C.muted }}>
              성별 *
              <select style={inp(miss(!sex))} value={sex} disabled={locked || !!found} onChange={(e) => setSex(e.target.value as "male" | "female")}>
                <option value="">-</option>
                <option value="male">남</option>
                <option value="female">여</option>
              </select>
            </label>
            <label style={{ fontSize: 12, color: C.muted }}>
              생년월일 * <span style={{ color: C.accent }}>{age && `만 ${age}`}</span>
              <input inputMode="numeric" placeholder="YYYY-MM-DD" maxLength={10} style={inp(miss(!isRealDate(dob)) || (dob.length === 10 && !isRealDate(dob)))} value={dob} disabled={locked || !!found} onChange={(e) => setDob(maskDate(e.target.value, dob))} />
            </label>
            <label style={{ fontSize: 12, color: C.muted }}>
              처방일 *
              <input inputMode="numeric" placeholder="YYYY-MM-DD" maxLength={10} style={inp(miss(!isRealDate(date)) || (date.length === 10 && (!isRealDate(date) || date > todayKst())))} value={date} disabled={locked} onChange={(e) => setDate(maskDate(e.target.value, date))} />
            </label>
          </div>
          {found && (
            <p style={{ fontSize: 12.5, color: "#00875a", margin: "6px 0 0" }}>
              등록된 환자입니다. {found.linked ? "보호자 앱과 연동되어 있어 처방이 앱에도 보입니다." : "앱 미연동 - 이 아이 전용 연동 QR 이 찍힙니다."}
            </p>
          )}
          <p style={{ fontSize: 11.5, color: C.muted, margin: "6px 0 0" }}>차트번호·성별·생년월일은 기록용이며, 처방전에는 이름과 처방일 기준 만 나이만 인쇄됩니다.</p>

          <div style={sec}>
            <h2 style={h2}>처방의</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {S.doctors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={d.id === docId}
                  style={chip(d.id === docId)}
                  onClick={() => { const v = d.id === docId ? "" : d.id; setDocId(v); localStorage.setItem("rx_doc", v); }}
                >
                  {d.name || "(이름 없음)"} {d.license && <small style={{ opacity: 0.75 }}>{d.license}</small>}
                </button>
              ))}
              <button type="button" style={{ ...chip(false), borderStyle: "dashed" }} onClick={() => setSettingsOpen(true)}>
                {S.doctors.length ? "관리" : "+ 처방의 등록"}
              </button>
            </div>
            {!doc && <p style={{ fontSize: 11.5, color: C.muted, margin: "6px 0 0" }}>고르지 않으면 로그인한 의료인({user.healthcare_professional.name})으로 기록됩니다.</p>}
          </div>

          <div style={sec}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ ...h2, margin: 0 }}>원용 (DISTANCE)</h2>
              <button
                type="button"
                disabled={locked}
                title="SPH+CYL, -CYL, AXIS±90"
                style={{ fontSize: 12, padding: "3px 8px" }}
                onClick={() => (["d_od", "d_os"] as const).forEach((k) => { const t = transpose(rows[k].sph, rows[k].cyl, rows[k].axis); if (t) setRow(k, { ...rows[k], ...t }); })}
              >
                ±Cyl 변환
              </button>
            </div>
            <RxTable rows={["d_od", "d_os"]} value={allRows} onChange={setRow} disabled={locked} />
            <label style={{ fontSize: 12, color: C.muted, display: "inline-flex", alignItems: "center", gap: 6 }}>
              PD (mm) <input style={{ ...inp(pdBad(pd)), width: 80 }} inputMode="decimal" value={pd} disabled={locked} onChange={(e) => setPd(e.target.value)} />
            </label>
          </div>

          <div style={sec}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600 }}>
              <input type="checkbox" checked={nearOn} disabled={locked} onChange={(e) => setNearOn(e.target.checked)} /> 근용 처방 (NEAR)
            </label>
            {nearOn && (
              <>
                <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "8px 0", fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    ADD+ <input autoFocus style={{ ...inp(!okPow(add)), width: 80 }} inputMode="decimal" value={add} disabled={locked} onChange={(e) => setAdd(e.target.value)} onBlur={() => setAdd(fmtPow(add))} />
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input type="checkbox" checked={nearAuto} disabled={locked} onChange={(e) => { setNearAuto(e.target.checked); if (!e.target.checked) setRows((cur) => ({ ...cur, ...near })); }} /> 원용 + ADD 자동계산
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    PD (mm) <input style={{ ...inp(pdBad(npd)), width: 80 }} inputMode="decimal" value={npd} disabled={locked} onChange={(e) => setNpd(e.target.value)} />
                  </label>
                </div>
                <RxTable rows={["n_od", "n_os"]} value={allRows} onChange={setRow} readOnly={nearAuto} disabled={locked} />
              </>
            )}
          </div>

          <div style={sec}>
            <h2 style={h2}>REMARKS</h2>
            <textarea style={{ ...inp(), minHeight: 56, resize: "vertical" }} value={remarks} disabled={locked} onChange={(e) => setRemarks(e.target.value)} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {S.remChips.map((c) => (
                <button key={c} type="button" disabled={locked} aria-pressed={hasTok(remarks, c)} style={chip(hasTok(remarks, c))} onClick={() => setRemarks(toggleTok(remarks, c))}>
                  {c}
                </button>
              ))}
              <button type="button" style={{ ...chip(false), borderStyle: "dashed" }} onClick={() => setSettingsOpen(true)}>편집</button>
            </div>
            <p style={{ fontSize: 11.5, color: C.muted, margin: "6px 0 0" }}>
              버튼을 누르면 추가되고, 한 번 더 누르면 지워집니다. SPH·CYL 은 0.25D 단위로 자동 정리, AXIS 는 1–180. 빨간 칸은 값 확인 필요.
            </p>
          </div>

          {(
            <div style={sec}>
              <h2 style={h2}>A4 하단 문구</h2>
              <select
                style={inp()}
                value=""
                onChange={(e) => { const p = FOOT_PRESETS.find((x) => x.name === e.target.value); if (p) setValid(p.text); }}
              >
                <option value="">상용구 선택…</option>
                {FOOT_PRESETS.map((p) => <option key={p.name}>{p.name}</option>)}
              </select>
              <textarea style={{ ...inp(), minHeight: 56, marginTop: 6 }} value={valid ?? S.valid} onChange={(e) => setValid(e.target.value)} />
              <p style={{ fontSize: 11.5, color: C.muted, margin: "6px 0 0" }}>설명란(착용 안내 등)은 설정에서 켜고 끕니다.</p>
            </div>
          )}
        </div>

        {preview && (
          <div style={{ position: "sticky", top: 80 }}>
            <Stage D={D} S={S} />
          </div>
        )}
      </div>

      <section style={{ padding: "0 20px 48px", maxWidth: 1100 }}>
        <h2 style={{ fontSize: 17 }}>최근 발행</h2>
        {recent.data?.length === 0 && <p style={{ color: "#888" }}>아직 발행한 처방전이 없습니다.</p>}
        <ul style={{ listStyle: "none", padding: 0, margin: 0, background: "white", borderRadius: 12 }}>
          {recent.data?.map((r) => (
            <li key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid #eee`, gap: 12 }}>
              <span>
                <b>{r.registration_number}</b> · {r.prescribed_on} · {r.prescriber_name}
                <span style={{ color: "#888", fontSize: 13 }}> · OD {fmtD(r.far.sph_od) || "-"} / OS {fmtD(r.far.sph_os) || "-"}{r.remark_tags.length ? ` · ${r.remark_tags.join(", ")}` : ""}</span>
              </span>
              <button type="button" onClick={() => navigate(`/prescription/${r.id}/print`)} style={{ padding: "6px 12px" }}>다시 인쇄</button>
            </li>
          ))}
        </ul>
      </section>

      <PrintArea D={D} S={S} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} initial={S} onSaved={() => refetch()} canEdit={!!user.healthcare_professional.is_admin} />
    </div>
  );
}

