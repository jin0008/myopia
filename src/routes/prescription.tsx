import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

import { UserContext } from "../App";
import NotLoggedIn from "../components/not_logged_in";
import { BlackButton, PrimaryButton, PrimaryNagativeButton } from "../components/button";
import { HttpError } from "../lib/fetch";
import { ageOn, cellProblem, fmtD, nearSph, parseNum } from "../lib/rx";
import { createLinkInvite } from "../api/patient";
import {
  getPrescription,
  issuePrescription,
  listPrescriptions,
  lookupPatient,
  type Base,
  type EyeRx,
  type PrescriptionDetail,
} from "../api/prescription";

/* ------------------------------------------------------------------ *
 * 안경처방전 발행. 진료실에서 바로 쓰는 화면이라 환자 등록과 처방을 한 번에
 * 받는다. 등록번호를 넣으면 기존 환자의 생년월일·성별을 채운다.
 * 이름은 저장하지 않는다 - 이 서비스는 환자를 이름 없이 다룬다. 인쇄할
 * 때만 쓰고 버린다.
 * ------------------------------------------------------------------ */

const EYES = ["od", "os"] as const;
const COLS = ["sph", "cyl", "axis", "prism"] as const;
type Eye = (typeof EYES)[number];
type Col = (typeof COLS)[number];
type Grid = Record<`${Col}_${Eye}`, string> & Record<`base_${Eye}`, Base | "">;

const emptyGrid = (): Grid => ({
  sph_od: "", sph_os: "", cyl_od: "", cyl_os: "", axis_od: "", axis_os: "",
  prism_od: "", prism_os: "", base_od: "", base_os: "",
});

const todayKst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const cellStyle = (bad: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "8px 6px",
  border: `1px solid ${bad ? "#e53935" : "#d0d0d0"}`,
  background: bad ? "#fff1f0" : "white",
  borderRadius: 6,
  fontSize: 15,
  textAlign: "center",
  boxSizing: "border-box",
});

function gridToRx(g: Grid): Partial<EyeRx> {
  const out: Record<string, unknown> = {};
  for (const e of EYES) {
    for (const c of COLS) out[`${c}_${e}`] = parseNum(g[`${c}_${e}`]);
    out[`base_${e}`] = g[`base_${e}`] || null;
  }
  return out as Partial<EyeRx>;
}

/** 칸마다 문제를 찾는다. 프리즘이 있는데 BASE 가 없으면 BASE 칸이 빨갛다. */
function gridProblems(g: Grid): Set<string> {
  const bad = new Set<string>();
  for (const e of EYES) {
    for (const c of COLS) if (cellProblem(c, parseNum(g[`${c}_${e}`]))) bad.add(`${c}_${e}`);
    const prism = parseNum(g[`prism_${e}`]);
    if (prism && !g[`base_${e}`]) bad.add(`base_${e}`);
    if (parseNum(g[`cyl_${e}`]) && parseNum(g[`axis_${e}`]) == null) bad.add(`axis_${e}`);
  }
  return bad;
}

function RxGrid({ title, value, onChange, pd, onPd, bad }: {
  title: string;
  value: Grid;
  onChange: (g: Grid) => void;
  pd: string;
  onPd: (v: string) => void;
  bad: Set<string>;
}) {
  const set = (k: keyof Grid, v: string) => onChange({ ...value, [k]: v });
  // 다 치고 나가면 부호·소수 둘째 자리로 정리한다(1.5 → +1.50).
  const tidy = (k: `${Col}_${Eye}`) => {
    const n = parseNum(value[k]);
    if (n == null || Number.isNaN(n)) return;
    if (k.startsWith("sph") || k.startsWith("cyl")) set(k, fmtD(n));
  };
  return (
    <section style={{ marginTop: 20 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{title}</h3>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 6 }}>
        <thead>
          <tr style={{ fontSize: 13, color: "#555" }}>
            <th />
            <th>SPH</th><th>CYL</th><th>AXIS</th><th>PRISM △</th><th>BASE</th>
          </tr>
        </thead>
        <tbody>
          {EYES.map((e) => (
            <tr key={e}>
              <th style={{ width: 40 }}>{e.toUpperCase()}</th>
              {COLS.map((c) => (
                <td key={c}>
                  <input
                    inputMode="decimal"
                    value={value[`${c}_${e}`]}
                    onChange={(ev) => set(`${c}_${e}`, ev.target.value)}
                    onBlur={() => tidy(`${c}_${e}`)}
                    style={cellStyle(bad.has(`${c}_${e}`))}
                    aria-label={`${title} ${e.toUpperCase()} ${c.toUpperCase()}`}
                  />
                </td>
              ))}
              <td>
                <select
                  value={value[`base_${e}`]}
                  onChange={(ev) => set(`base_${e}`, ev.target.value)}
                  style={cellStyle(bad.has(`base_${e}`))}
                  aria-label={`${title} ${e.toUpperCase()} BASE`}
                >
                  <option value="">-</option>
                  {(["BI", "BO", "BU", "BD"] as const).map((b) => <option key={b}>{b}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginTop: 4, fontSize: 14 }}>
        PD (mm)
        <input inputMode="decimal" value={pd} onChange={(e) => onPd(e.target.value)} style={{ ...cellStyle(!!cellProblem("pd", parseNum(pd))), width: 90 }} />
      </label>
    </section>
  );
}

export default function PrescriptionPage() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [regNo, setRegNo] = useState(params.get("reg") ?? "");
  const [found, setFound] = useState<null | { linked: boolean }>(null);
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"" | "male" | "female">("");
  const [name, setName] = useState("");
  const [on, setOn] = useState(todayKst());
  const [far, setFar] = useState<Grid>(emptyGrid);
  const [near, setNear] = useState<Grid>(emptyGrid);
  const [pdFar, setPdFar] = useState("");
  const [pdNear, setPdNear] = useState("");
  const [addOd, setAddOd] = useState("");
  const [addOs, setAddOs] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recent = useQuery({ queryKey: ["prescriptions"], queryFn: () => listPrescriptions(), enabled: !!user?.healthcare_professional?.approved });

  // 등록번호를 다 치고 나가면 찾는다. 기존 환자면 생년월일·성별을 채우고 잠근다 -
  // 다르게 적으면 서버가 어차피 거절한다.
  const lookup = async () => {
    setFound(null);
    if (!regNo.trim()) return;
    try {
      const r = await lookupPatient(regNo.trim());
      if (r.exists) {
        setFound({ linked: r.patient.linked });
        setDob(r.patient.date_of_birth.slice(0, 10));
        setSex(r.patient.sex);
      }
    } catch {
      /* 못 찾으면 새 환자로 적게 둔다 */
    }
  };

  const badFar = useMemo(() => gridProblems(far), [far]);
  const badNear = useMemo(() => gridProblems(near), [near]);
  const addBad = !!cellProblem("add", parseNum(addOd)) || !!cellProblem("add", parseNum(addOs));

  /** 원용 + ADD 로 근용을 채운다. CYL·AXIS 는 원용 그대로. */
  const fillNear = () => {
    const next = { ...near };
    for (const e of EYES) {
      const add = parseNum(e === "od" ? addOd : addOs);
      if (add == null || Number.isNaN(add)) continue;
      const s = nearSph(parseNum(far[`sph_${e}`]), add);
      next[`sph_${e}`] = fmtD(s);
      next[`cyl_${e}`] = far[`cyl_${e}`];
      next[`axis_${e}`] = far[`axis_${e}`];
    }
    setNear(next);
    if (!pdNear && parseNum(pdFar)) setPdNear(String(Number(pdFar) - 3)); // 근용 PD 는 보통 원용보다 2~4mm 짧다
  };

  if (user == null) return <NotLoggedIn />;
  if (!user.healthcare_professional?.approved) return <p style={{ padding: 32 }}>승인된 의료인만 처방전을 발행할 수 있습니다.</p>;

  const canSubmit = regNo.trim() && dob && sex && on && !badFar.size && !badNear.size && !addBad && !busy;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await issuePrescription({
        registration_number: regNo.trim(),
        date_of_birth: dob,
        sex: sex as "male" | "female",
        prescribed_on: on,
        far: gridToRx(far),
        near: gridToRx(near),
        pd_far: parseNum(pdFar),
        pd_near: parseNum(pdNear),
        add_od: parseNum(addOd),
        add_os: parseNum(addOs),
        note: note.trim() || null,
      });
      // 이름과 초대 링크는 서버에 없다(링크는 지금 한 번만 존재한다). 인쇄 화면으로 넘겨 준다.
      navigate(`/prescription/${r.prescription.id}/print`, { state: { name, invite: r.invite } });
    } catch (e) {
      if (e instanceof HttpError) {
        setError(
          e.code === 409
            ? "이 등록번호의 환자 생년월일·성별이 다릅니다. 등록번호를 다시 확인해 주세요."
            : (e.fields?.map((f) => `${f.path}: ${f.message}`).join(", ") || e.message || "저장하지 못했습니다."),
        );
      } else setError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const label: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#555" };
  const input: React.CSSProperties = { padding: "9px 10px", border: "1px solid #d0d0d0", borderRadius: 6, fontSize: 15 };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 16px 64px" }}>
      <h1 style={{ fontSize: 28, margin: "0 0 4px" }}>안경처방전 발행</h1>
      <p style={{ color: "#666", margin: 0, fontSize: 14 }}>
        이름은 인쇄에만 쓰고 저장하지 않습니다. 등록번호가 없는 환자면 발행하면서 새로 등록됩니다.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 }}>
        <label style={label}>
          등록번호 *
          <input style={input} value={regNo} onChange={(e) => { setRegNo(e.target.value); setFound(null); }} onBlur={lookup} />
        </label>
        <label style={label}>
          이름 (인쇄용)
          <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label style={label}>
          생년월일 *
          <input type="date" style={input} value={dob} disabled={!!found} onChange={(e) => setDob(e.target.value)} />
        </label>
        <label style={label}>
          성별 *
          <select style={input} value={sex} disabled={!!found} onChange={(e) => setSex(e.target.value as "male" | "female")}>
            <option value="">-</option>
            <option value="male">남</option>
            <option value="female">여</option>
          </select>
        </label>
        <label style={label}>
          처방일 *
          <input type="date" style={input} value={on} max={todayKst()} onChange={(e) => setOn(e.target.value)} />
        </label>
      </section>
      {found && (
        <p style={{ fontSize: 13, color: "#00875a", margin: "8px 0 0" }}>
          등록된 환자입니다. {found.linked ? "보호자 앱과 연동되어 있어 처방이 앱에도 보입니다." : "앱 미연동 - 처방전에 연동 QR 이 찍힙니다."}
        </p>
      )}

      <RxGrid title="원용 (Distance)" value={far} onChange={setFar} pd={pdFar} onPd={setPdFar} bad={badFar} />

      <section style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
        <label style={label}>
          ADD OD
          <input inputMode="decimal" value={addOd} onChange={(e) => setAddOd(e.target.value)} style={{ ...cellStyle(!!cellProblem("add", parseNum(addOd))), width: 90 }} />
        </label>
        <label style={label}>
          ADD OS
          <input inputMode="decimal" value={addOs} onChange={(e) => setAddOs(e.target.value)} style={{ ...cellStyle(!!cellProblem("add", parseNum(addOs))), width: 90 }} />
        </label>
        <PrimaryNagativeButton type="button" onClick={fillNear} disabled={!addOd && !addOs}>
          원용 + ADD → 근용 채우기
        </PrimaryNagativeButton>
      </section>

      <RxGrid title="근용 (Near)" value={near} onChange={setNear} pd={pdNear} onPd={setPdNear} bad={badNear} />

      <label style={{ ...label, marginTop: 20 }}>
        안내 (처방전과 보호자 앱에 보입니다)
        <textarea style={{ ...input, minHeight: 64 }} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      <p style={{ fontSize: 12.5, color: "#888" }}>
        SPH·CYL 은 0.25D 단위, AXIS 는 0~180. CYL 을 넣으면 AXIS, PRISM 을 넣으면 BASE 가 필요합니다. 빨간 칸을 확인해 주세요.
      </p>
      {error && <p style={{ color: "#e53935" }}>{error}</p>}
      <PrimaryButton onClick={submit} disabled={!canSubmit}>
        {busy ? "발행 중…" : "발행하고 인쇄하기"}
      </PrimaryButton>

      <h2 style={{ fontSize: 20, marginTop: 48 }}>최근 발행</h2>
      {recent.isLoading && <p>불러오는 중…</p>}
      {recent.data?.length === 0 && <p style={{ color: "#888" }}>아직 발행한 처방전이 없습니다.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {recent.data?.map((r) => (
          <li key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee", gap: 12 }}>
            <span>
              <b>{r.registration_number}</b> · {r.prescribed_on} · {r.prescriber_name}
              <span style={{ color: "#888", fontSize: 13 }}> · OD {fmtD(r.far.sph_od) || "-"} / OS {fmtD(r.far.sph_os) || "-"}</span>
            </span>
            <BlackButton onClick={() => navigate(`/prescription/${r.id}/print`)}>다시 인쇄</BlackButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 인쇄. A4 와 명함(90×50mm). 병원 로고·주소·하단 문구는 이 PC 에 저장한다
 * (진료실 PC 마다 프린터·양식이 달라 계정보다 기기에 붙는 설정이다).
 * ------------------------------------------------------------------ */

interface PrintSettings {
  logo: string | null;
  contact: string;
  footer: string;
  appGuide: string;
}
const DEFAULT_SETTINGS: PrintSettings = {
  logo: null,
  contact: "",
  footer: "본 처방전은 발행일로부터 3개월 이내 안경 제작에 사용하시기 바랍니다.",
  appGuide: "마이오닥 앱에서 QR 을 찍으면 아이의 처방 기록을 계속 볼 수 있습니다.",
};
// ponytail: 설정은 이 브라우저에만 남는다. 병원 단위로 공유해야 하면 서버 hospital_profile 로 옮긴다.
const settingsKey = (hospitalId: string) => `rx_print_settings:${hospitalId}`;
function loadSettings(hospitalId: string): PrintSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(settingsKey(hospitalId)) ?? "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const sexKo = (s: string) => (s === "male" ? "남" : "여");

function RxTable({ rx, compact }: { rx: PrescriptionDetail; compact?: boolean }) {
  const rows: { label: string; e: EyeRx; pd: number | null; eye: Eye }[] = [];
  const has = (e: EyeRx) => Object.values(e).some((v) => v != null);
  for (const [label, e, pd] of [["원용", rx.far, rx.pd_far], ["근용", rx.near, rx.pd_near]] as const) {
    if (!has(e) && pd == null) continue;
    for (const eye of EYES) rows.push({ label, e, pd, eye });
  }
  if (compact) {
    // 명함은 칸이 모자라 PRISM 은 있을 때만 붙인다.
    return (
      <table className="rx-table compact">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th>{r.eye === "od" ? `${r.label} R` : "L"}</th>
              <td>{fmtD(r.e[`sph_${r.eye}`])}</td>
              <td>{fmtD(r.e[`cyl_${r.eye}`])}</td>
              <td>{r.e[`axis_${r.eye}`] ?? ""}</td>
              <td>{r.e[`prism_${r.eye}`] ? `${r.e[`prism_${r.eye}`]}△${r.e[`base_${r.eye}`] ?? ""}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return (
    <table className="rx-table">
      <thead>
        <tr><th /><th /><th>SPH</th><th>CYL</th><th>AXIS</th><th>PRISM △</th><th>BASE</th><th>PD</th></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.eye === "od" && <th rowSpan={2}>{r.label}</th>}
            <th>{r.eye.toUpperCase()}</th>
            <td>{fmtD(r.e[`sph_${r.eye}`])}</td>
            <td>{fmtD(r.e[`cyl_${r.eye}`])}</td>
            <td>{r.e[`axis_${r.eye}`] ?? ""}</td>
            <td>{r.e[`prism_${r.eye}`] ?? ""}</td>
            <td>{r.e[`base_${r.eye}`] ?? ""}</td>
            {r.eye === "od" && <td rowSpan={2}>{r.pd ?? ""}</td>}
          </tr>
        ))}
        {(rx.add_od != null || rx.add_os != null) && (
          <tr>
            <th colSpan={2}>ADD</th>
            <td colSpan={6} style={{ textAlign: "left" }}>OD {fmtD(rx.add_od)} &nbsp; OS {fmtD(rx.add_os)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

const PRINT_CSS = `
.rx-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.rx-table th, .rx-table td { border: 1px solid #333; padding: 6px 4px; text-align: center; }
.rx-table.compact { font-size: 7.5pt; }
.rx-table.compact th, .rx-table.compact td { padding: 1px 2px; border-color: #777; }
.rx-a4 { width: 190mm; min-height: 270mm; padding: 10mm; box-sizing: border-box; background: white; color: #111; font-family: -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; display: flex; flex-direction: column; gap: 14px; }
.rx-card { width: 90mm; height: 50mm; padding: 3.5mm; box-sizing: border-box; background: white; color: #111; font-family: -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 7.5pt; overflow: hidden; border: 1px dashed #bbb; }
.rx-sheet { box-shadow: 0 2px 12px rgba(0,0,0,.12); }
@media print {
  body * { visibility: hidden !important; }
  .rx-print, .rx-print * { visibility: visible !important; }
  .rx-print { position: absolute; left: 0; top: 0; }
  .rx-sheet { box-shadow: none; }
  .rx-card { border: none; page-break-after: always; }
  .rx-noprint { display: none !important; }
}
`;

export function PrescriptionPrint() {
  const { id = "" } = useParams();
  const { user } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as { name?: string; invite?: { url: string; expires_at: string } | null };
  const hospitalId: string = user?.healthcare_professional?.hospital_id ?? "";

  const { data: rx, error } = useQuery({ queryKey: ["prescription", id], queryFn: () => getPrescription(id), enabled: !!user });
  const [mode, setMode] = useState<"a4" | "card">("a4");
  const [name, setName] = useState(state.name ?? "");
  const [invite, setInvite] = useState(state.invite ?? null);
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (hospitalId) setSettings(loadSettings(hospitalId));
  }, [hospitalId]);
  const save = (next: PrintSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(settingsKey(hospitalId), JSON.stringify(next));
    } catch {
      /* 로고가 너무 크면 저장이 거절된다 - 이번 인쇄에는 그대로 쓴다 */
    }
  };

  if (user == null) return <NotLoggedIn />;
  if (error) return <p style={{ padding: 32 }}>처방전을 찾을 수 없습니다.</p>;
  if (!rx) return <p style={{ padding: 32 }}>불러오는 중…</p>;

  const age = ageOn(rx.patient.date_of_birth.slice(0, 10), rx.prescribed_on);
  const who = `${name || " ".repeat(12)}  (만 ${age ?? "-"}세 · ${sexKo(rx.patient.sex)})`;
  // 다시 인쇄할 때는 링크가 없다(서버는 링크를 저장하지 않는다). 미연동이면 새로 받는다 -
  // 새로 받으면 앞서 준 링크는 못 쓰게 된다.
  const needQr = !rx.patient.linked;
  const issueInvite = async () => {
    setIssuing(true);
    try {
      const r = await createLinkInvite(rx.patient_id);
      setInvite({ url: r.url, expires_at: r.expiresAt });
    } finally {
      setIssuing(false);
    }
  };

  const qr = invite && (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <QRCodeSVG value={invite.url} size={mode === "a4" ? 96 : 110} level="M" />
      <div style={{ fontSize: mode === "a4" ? 12 : "7pt", lineHeight: 1.5 }}>
        {settings.appGuide}
        <br />
        <span style={{ color: "#666" }}>QR 유효기간 {invite.expires_at.slice(0, 10)}까지 · 지나면 병원에 새 QR 을 요청하세요.</span>
      </div>
    </div>
  );

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {settings.logo && <img src={settings.logo} alt="" style={{ maxHeight: mode === "a4" ? 48 : 22, maxWidth: mode === "a4" ? 160 : 70 }} />}
      <div>
        <div style={{ fontWeight: 800, fontSize: mode === "a4" ? 18 : "9pt" }}>{rx.hospital.name}</div>
        <div style={{ whiteSpace: "pre-line", color: "#555", fontSize: mode === "a4" ? 12 : "6.5pt" }}>
          {settings.contact || [rx.hospital.address, rx.hospital.phone].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "24px 16px 64px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, background: "#f4f5f7", minHeight: "100vh" }}>
      <style>{PRINT_CSS + (mode === "a4" ? "@page { size: A4; margin: 10mm; }" : "@page { size: 90mm 50mm; margin: 0; }")}</style>

      <div className="rx-noprint" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
        <PrimaryNagativeButton onClick={() => navigate("/prescription")}>← 처방전 목록</PrimaryNagativeButton>
        <select value={mode} onChange={(e) => setMode(e.target.value as "a4" | "card")} style={{ padding: 8, borderRadius: 8 }}>
          <option value="a4">A4</option>
          <option value="card">명함 (90×50mm)</option>
        </select>
        <input placeholder="이름 (인쇄용, 저장 안 함)" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }} />
        <PrimaryNagativeButton onClick={() => setShowSettings((v) => !v)}>양식 설정</PrimaryNagativeButton>
        {needQr && !invite && (
          <PrimaryNagativeButton onClick={issueInvite} disabled={issuing}>
            {issuing ? "발급 중…" : "연동 QR 새로 발급"}
          </PrimaryNagativeButton>
        )}
        <PrimaryButton onClick={() => window.print()}>인쇄</PrimaryButton>
      </div>
      {needQr && !invite && (
        <p className="rx-noprint" style={{ margin: 0, fontSize: 13, color: "#8a5a00" }}>
          앱 미연동 환자입니다. 다시 인쇄할 때는 연동 QR 을 새로 발급해야 찍힙니다(이전 QR 은 못 쓰게 됩니다).
        </p>
      )}

      {showSettings && (
        <div className="rx-noprint" style={{ background: "white", padding: 16, borderRadius: 12, width: "min(640px, 100%)", display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
          <label>
            로고 &nbsp;
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => save({ ...settings, logo: String(reader.result) });
                reader.readAsDataURL(f);
              }}
            />
            {settings.logo && <button onClick={() => save({ ...settings, logo: null })}>로고 지우기</button>}
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            주소·연락처 (비우면 병원 정보 사용)
            <textarea value={settings.contact} onChange={(e) => save({ ...settings, contact: e.target.value })} rows={2} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            하단 문구
            <textarea value={settings.footer} onChange={(e) => save({ ...settings, footer: e.target.value })} rows={2} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            앱 연동 안내 문구
            <textarea value={settings.appGuide} onChange={(e) => save({ ...settings, appGuide: e.target.value })} rows={2} />
          </label>
          <small style={{ color: "#888" }}>설정은 이 컴퓨터의 브라우저에 저장됩니다.</small>
        </div>
      )}

      <div className="rx-print">
        {mode === "a4" ? (
          <div className="rx-a4 rx-sheet">
            {header}
            <h1 style={{ textAlign: "center", fontSize: 26, letterSpacing: 8, margin: "8px 0" }}>안경 처방전</h1>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span>환자: {who}</span>
              <span>처방일: {rx.prescribed_on}</span>
            </div>
            <RxTable rx={rx} />
            {rx.note && (
              <div style={{ border: "1px solid #333", padding: 10, fontSize: 13, whiteSpace: "pre-line" }}>
                <b>REMARKS</b>
                <br />
                {rx.note}
              </div>
            )}
            <div style={{ textAlign: "right", fontSize: 15, marginTop: 8 }}>처방의: {rx.prescriber_name} (인)</div>
            <div style={{ flex: 1 }} />
            {qr}
            <div style={{ fontSize: 12, color: "#555", borderTop: "1px solid #ccc", paddingTop: 8, whiteSpace: "pre-line" }}>{settings.footer}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="rx-card rx-sheet" style={{ display: "flex", flexDirection: "column", gap: "1.5mm" }}>
              {header}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{who}</span>
                <span>{rx.prescribed_on}</span>
              </div>
              <RxTable rx={rx} compact />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>PD {rx.pd_far ?? "-"}{rx.pd_near != null ? ` / ${rx.pd_near}` : ""}{rx.add_od != null || rx.add_os != null ? ` · ADD ${fmtD(rx.add_od)}/${fmtD(rx.add_os)}` : ""}</span>
                <span>처방의 {rx.prescriber_name}</span>
              </div>
            </div>
            {/* 뒷면: 연동 QR 과 하단 문구. 양면 인쇄 시 둘째 장. */}
            <div className="rx-card rx-sheet" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "2mm" }}>
              {qr}
              <div style={{ color: "#555", whiteSpace: "pre-line" }}>{settings.footer}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
