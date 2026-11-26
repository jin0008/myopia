import { QRCodeSVG } from "qrcode.react";
import type { CSSProperties } from "react";

import { dateKo } from "../../lib/rx";

/* ------------------------------------------------------------------ *
 * 처방전 출력물(A4 한 장). 마이오닥 가입 QR 은 하단에만. 교수님 양식(안경처방전.html)의 배치와
 * CSS 를 그대로 옮겼다. 출력물은 화면 테마와 상관없이 늘 흰 종이다.
 * QR 만 다르다 - 고정 이미지 대신, 연동 링크가 있으면 그 아이 전용 QR
 * (찍으면 바로 연동), 없으면 앱 설치 QR 을 그린다.
 * ------------------------------------------------------------------ */

export interface Doctor {
  id: string;
  name: string;
  license: string;
  /** 도장 이미지(data URL). */
  stamp: string;
}
export interface Block {
  on: boolean;
  title: string;
  body: string;
}
export interface RxSettings {
  hospital: string;
  sub: string;
  logo: string;
  doctors: Doctor[];
  title: string;
  accent: string;
  valid: string;
  qrOn: boolean;
  qrText: string;
  blocks: Block[];
  remChips: string[];
}

export const PRESETS: Record<string, string> = {
  "처음 안경 착용 안내":
    "처음 1~2주는 바닥이 기울어 보이거나 어지러울 수 있으며 대부분 적응됩니다.\n2주 이상 두통·복시·어지러움이 지속되면 안경을 쓰고 내원하여 처방과 조제(광학중심·PD)를 확인받으십시오.",
  "소아 굴절이상·약시":
    "약시·조절내사시 치료 목적의 안경은 잠잘 때를 제외하고 항상 착용해야 효과가 있습니다.\n성장기에는 도수가 변하므로 3~6개월마다 정기검진을 받으십시오. 처방은 조절마비 굴절검사 결과를 반영하였습니다.",
  "근시 진행 억제 렌즈":
    "근시 진행 억제 효과는 착용 시간에 비례합니다. 하루 10시간 이상 착용을 권합니다.\n주간 야외활동 2시간, 근거리 작업 30분마다 휴식(20-20-20 규칙)을 함께 지켜 주십시오.",
  "누진다초점 렌즈":
    "먼 곳은 렌즈 위쪽, 가까운 곳은 렌즈 아래쪽으로 보며, 옆을 볼 때는 눈보다 고개를 돌리십시오.\n계단을 내려갈 때는 고개를 숙여 렌즈 위쪽으로 발밑을 확인하십시오. 적응에 2~4주가 걸릴 수 있습니다.",
  "프리즘 안경":
    "프리즘은 사시·복시 증상 완화를 위한 처방입니다. 광학중심과 BASE 방향을 처방대로 정확히 조제해야 합니다.\n착용 후 복시가 남거나 새로 생기면 내원하십시오.",
  "안경원 조제 참고":
    "처방된 PD에 맞추어 광학중심을 조제하여 주십시오.\n고도 난시(≥2.00D) 또는 부등시가 있는 경우 경사각·정점간거리를 확인 바랍니다.",
};

export const FOOT_PRESETS: { name: string; text: string }[] = [
  { name: "기본(유효기간)", text: "본 처방전은 처방일로부터 3개월 이내에 맞추세요. 맞춘 후 불편감이 있으면 내원하십시오." },
  { name: "근시", text: "[근시] 소아·청소년기 근시는 성장 중 진행하므로 6개월마다 굴절검사를 받으십시오. 하루 2시간 이상 야외활동, 근거리 작업 시 30cm 이상 거리 유지와 30분마다 휴식을 권합니다. 고도근시(-6.00D 이상)는 망막 정기검진이 필요합니다." },
  { name: "약시", text: "[약시] 약시 치료용 안경은 잠잘 때를 제외하고 항상 착용해야 합니다. 치료 효과는 시력 발달기(대개 8세 이전)에 가장 크므로 처방된 가림치료와 함께 정해진 날짜에 반드시 재진하십시오." },
  { name: "원시", text: "[원시] 원시 안경은 가까운 곳뿐 아니라 먼 곳을 볼 때도 눈의 조절 부담을 줄여 줍니다. 처음에는 먼 곳이 흐리게 느껴질 수 있으나 대부분 1~2주 내 적응합니다. 내사시가 동반된 경우(조절내사시) 상시 착용이 필수입니다." },
  { name: "난시", text: "[난시] 난시 렌즈는 축(AXIS) 방향이 정확해야 효과가 있습니다. 처음에는 사물이 기울거나 바닥이 휘어 보일 수 있으며, 2주 이상 지속되면 안경을 지참하여 내원하십시오." },
  { name: "노안", text: "[노안] 돋보기·근용 안경은 처방된 작업 거리에 맞춘 것입니다. 원거리 보행 시에는 벗거나 원근 겸용(누진) 렌즈를 사용하십시오. 노안 도수는 수년에 걸쳐 변하므로 1~2년마다 재검하십시오." },
  { name: "부등시", text: "[부등시] 양안 도수 차이가 커서 초기에 상 크기 차이·어지러움을 느낄 수 있습니다. 소아는 약시 예방을 위해 상시 착용하고, 불편이 지속되면 콘택트렌즈 등 대안을 상의하십시오." },
  { name: "사시·프리즘", text: "[사시·프리즘] 프리즘 안경은 복시·안정피로 완화를 위한 처방입니다. 광학중심과 BASE 방향대로 정확히 조제해야 하며, 복시가 남거나 새로 생기면 내원하십시오." },
];

export const REM_CHIPS = [
  "상시 착용", "원거리용", "근거리용", "컴퓨터용", "누진다초점", "이중초점", "근시억제렌즈",
  "호야 마이오스마트", "호야 마이오스마트IQ", "에실로 스텔리스트", "블루라이트차단", "변색렌즈",
];

/** 예전 기본 문구. 병원 양식에 이 글 그대로 저장돼 있으면 새 기본값으로 바꿔 보인다
 *  (손대지 않은 기본값이 저장된 것이라, 병원이 고친 글은 건드리지 않는다). */
export const OLD_DEFAULTS: Partial<Record<keyof RxSettings, string>> = {
  valid: "본 처방전은 처방일로부터 3개월 이내에 조제하십시오.\n조제 후 불편감이 있으면 내원하십시오.",
  qrText: "마이오닥 앱에 가입하면 아이의 안경 처방과 근시 진행을 한곳에서 볼 수 있습니다.",
};

export function defaultSettings(hospital: { name: string; address: string | null; phone: string | null }): RxSettings {
  return {
    hospital: hospital.name,
    sub: [hospital.address, hospital.phone ? `Tel. ${hospital.phone}` : ""].filter(Boolean).join("\n"),
    logo: "",
    doctors: [],
    title: "안 경 처 방 전",
    accent: "#1f5f8b",
    valid: "본 처방전은 처방일로부터 3개월 이내에 맞추세요.\n맞춘 후 불편감이 있으면 내원하십시오.",
    qrOn: true,
    qrText: "마이오닥 앱에 가입하면 처방전을 확인할 수 있습니다.",
    blocks: [{ on: true, title: "처음 안경 착용 안내", body: PRESETS["처음 안경 착용 안내"] }],
    remChips: REM_CHIPS.slice(),
  };
}

/** 출력 크기. 엽서는 A6(105×148), 명함은 90×50. 둘 다 A4 용지에 실제 크기로 찍고 점선대로 자른다. */
export type PaperSize = "a4" | "post" | "card";
export const PAPER: Record<PaperSize, { label: string; w: number; h: number }> = {
  a4: { label: "A4", w: 210, h: 297 },
  post: { label: "엽서", w: 105, h: 148 },
  card: { label: "명함", w: 90, h: 50 },
};

/** 출력물 한 장에 필요한 값. 모두 찍을 글자 그대로. */
export interface Row {
  sph: string;
  cyl: string;
  axis: string;
  prism: string;
  base: string;
}
export const emptyRow = (): Row => ({ sph: "", cyl: "", axis: "", prism: "", base: "" });

export interface DocData {
  name: string;
  age: string;
  date: string;
  pd: string;
  npd: string;
  add: string;
  nearOn: boolean;
  d_od: Row;
  d_os: Row;
  n_od: Row;
  n_os: Row;
  remarks: string;
  doc: { name: string; license: string; stamp: string } | null;
  /** A4 하단 문구. 상용구에서 고르면 이번 처방에만 바뀐다. */
  valid: string;
  /** QR 이 가리킬 주소. */
  qrUrl: string;
}

function RxRows({ od, os, pd }: { od: Row; os: Row; pd: string }) {
  const pr = (r: Row) => (
    <>
      {r.prism}
      <span className="tri tr-r">△</span>
    </>
  );
  return (
    <table className="out">
      <colgroup>
        <col style={{ width: "11%" }} />
        <col />
        <col />
        <col style={{ width: "12%" }} />
        <col />
        <col style={{ width: "11%" }} />
        <col style={{ width: "14%" }} />
      </colgroup>
      <tbody>
        <tr><th /><th>SPH</th><th>CYL</th><th>AXIS</th><th>PRISM</th><th>BASE</th><th>PD</th></tr>
        <tr>
          <td className="eye">OD</td><td>{od.sph}</td><td>{od.cyl}</td><td>{od.axis}</td><td className="prc">{pr(od)}</td><td>{od.base}</td>
          <td rowSpan={2}>{pd}<br /><span className="tri">mm</span></td>
        </tr>
        <tr>
          <td className="eye">OS</td><td>{os.sph}</td><td>{os.cyl}</td><td>{os.axis}</td><td className="prc">{pr(os)}</td><td>{os.base}</td>
        </tr>
      </tbody>
    </table>
  );
}

const acc = (s: RxSettings) => ({ "--acc": s.accent }) as CSSProperties;
/** QR 은 이미지 대신 그린다. 픽셀 크기는 CSS 의 mm 로 덮는다. */
const Qr = ({ url, className }: { url: string; className: string }) => (
  <QRCodeSVG value={url} size={128} level="M" className={className} />
);

export function A4({ D, S, post = false }: { D: DocData; S: RxSettings; post?: boolean }) {
  const blocks = S.blocks.filter((b) => b.on && (b.title || b.body));
  return (
    <div className={"paper doc a4 b-single" + (post ? " a6" : "")} style={acc(S)}>
      <div className="head">
        {S.logo && <img className="logo" src={S.logo} alt="" />}
        <div>
          <div className="hosp">{S.hospital}</div>
          <div className="hsub">{S.sub}</div>
        </div>
      </div>
      <h1 className="t">{S.title}</h1>
      <div className="pt">
        <div><small>성명</small>{D.name || " "}</div>
        <div><small>나이 (만)</small>{D.age || " "}</div>
        <div><small>처방일</small>{dateKo(D.date)}</div>
      </div>
      <div>
        <div className="lbl"><span>DISTANCE</span></div>
        <RxRows od={D.d_od} os={D.d_os} pd={D.pd} />
      </div>
      {D.nearOn && (
        <div>
          <div className="lbl"><span>NEAR</span><span>ADD {D.add || "+"}</span></div>
          <RxRows od={D.n_od} os={D.n_os} pd={D.npd} />
        </div>
      )}
      <div>
        <div className="lbl"><span>REMARKS</span></div>
        <div className="rem">{D.remarks}</div>
      </div>
      {blocks.length > 0 && (
        <div className="blocks">
          {blocks.map((b, i) => (
            <div key={i} className="blk box">
              {b.title && <h3>{b.title}</h3>}
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      )}
      <div className="foot">
        <div className="valid">{D.valid}</div>
        <div className="sign">
          <div>
            <div style={{ fontSize: "8pt", color: "#666" }}>{D.doc?.license ? "면허번호 " + D.doc.license : ""}</div>
            처방의 <span className="dr">{D.doc ? D.doc.name : "   "}</span>
          </div>
          {D.doc?.stamp && <img className="stamp" src={D.doc.stamp} alt="" />}
        </div>
      </div>
      {S.qrOn && (
        <div className="qrband">
          <figure className="qf">
            <Qr url={D.qrUrl} className="qrband-img" />
            <figcaption>마이오닥</figcaption>
          </figure>
          <div>
            <b>마이오닥 myodoc.co.kr</b>
            <span>{S.qrText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** 명함(90×50). 교수님 양식의 명함 앞면 그대로 - 한 면에 처방과 QR. 면허번호·도장·설명란은 자리가 없어 뺀다. */
export function Card({ D, S }: { D: DocData; S: RxSettings }) {
  // ponytail: REMARKS 글자 크기를 글자 수로 정한다. 교수님 양식처럼 실제로 재서 줄이려면
  // 화면에 안 보이는 인쇄 영역도 따로 재야 해서 뺐다. 넘치면 화면에서 경고한다.
  const len = D.remarks.trim().length;
  const remPt = len <= 40 ? 6.5 : len <= 80 ? 5.5 : 4.5;
  return (
    <div className={"paper doc card" + (D.nearOn ? " near" : "")} style={acc(S)}>
      <div className="c-top">
        <div className="c-title">안경처방전</div>
        <div className="c-hosp">{S.hospital}{D.doc?.name ? " · " + D.doc.name : ""}</div>
      </div>
      <div className="c-pt">
        <span><b>{D.name || "\u00a0"}</b>{D.age ? ` (${D.age})` : ""}</span>
        <span className="dt">{dateKo(D.date)}</span>
      </div>
      <RxRows od={D.d_od} os={D.d_os} pd={D.pd} />
      {D.nearOn && (
        <>
          <div className="c-near"><b>NEAR</b><span>ADD {D.add}</span></div>
          <RxRows od={D.n_od} os={D.n_os} pd={D.npd} />
        </>
      )}
      <div className={"c-bot" + (S.qrOn ? " has-qr" : "")}>
        <div className="c-left">
          <div className="c-rem" style={{ fontSize: remPt + "pt" }}><b>REMARKS</b> {D.remarks.trim()}</div>
          {S.qrOn && <div className="c-qrtxt">{S.qrText}</div>}
        </div>
        {S.qrOn && (
          <div className="c-qrfig">
            <Qr url={D.qrUrl} className="c-qrimg" />
            <span>마이오닥</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** 명함 REMARKS 가 이보다 길면 잘릴 수 있다. */
export const CARD_REM_MAX = 110;

export function Doc({ D, S, size }: { D: DocData; S: RxSettings; size: PaperSize }) {
  if (size === "card") return <Card D={D} S={S} />;
  return <A4 D={D} S={S} post={size === "post"} />;
}

/** 출력물 CSS. 교수님 양식 그대로, 화면 앱 CSS 와 섞이지 않게 .doc 아래에만 건다. */
export const DOC_CSS = `
.rxdoc-root{--f-body:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;--f-display:var(--f-body)}
.paper{background:#fff;color:#111;box-shadow:0 2px 14px rgba(0,0,0,.18);flex:none;box-sizing:border-box}
.doc{--acc:#1f5f8b;font-family:var(--f-body);color:#111;position:relative;overflow:hidden}
.doc *{box-sizing:border-box}
.doc table.out{width:100%;border-collapse:collapse;table-layout:fixed}
.doc table.out th,.doc table.out td{border:1px solid #333;text-align:center;font-family:var(--f-body);font-variant-numeric:tabular-nums;font-weight:500}
.doc table.out th{font-weight:500;letter-spacing:.02em;background:color-mix(in srgb,var(--acc) 9%,#fff)}
.doc .tri{font-size:.85em;color:#555}
.doc td.prc{position:relative;padding-right:1.4em!important}
.doc .tri.tr-r{position:absolute;right:.35em;top:50%;transform:translateY(-50%)}
.a4{width:210mm;min-height:297mm;padding:16mm 16mm 14mm;display:flex;flex-direction:column;gap:6mm}
.a4.b-single{outline:.4mm solid var(--acc);outline-offset:-9mm}
.a4 .head{display:flex;align-items:center;gap:5mm;border-bottom:.8mm solid var(--acc);padding-bottom:4mm}
.a4 .head img.logo{max-height:16mm;max-width:40mm;object-fit:contain}
.a4 .hosp{font:700 15pt var(--f-display);color:var(--acc)}
.a4 .hsub{font-size:9.5pt;color:#555;white-space:pre-line}
.a4 h1.t{font:700 24pt var(--f-display);letter-spacing:.6em;text-align:center;margin:1mm 0 0;padding-left:.6em}
.a4 .pt{display:grid;grid-template-columns:2fr 1fr 2fr;border:.3mm solid #333}
.a4 .pt div{padding:2.5mm 4mm;border-right:.3mm solid #333;font-size:14pt;font-weight:500}
.a4 .pt div:first-child{font-size:17pt;font-weight:700}
.a4 .pt div:last-child{border-right:0}
.a4 .pt small{display:block;font-size:8.5pt;font-weight:500;color:#666;letter-spacing:.05em;margin-bottom:.5mm}
.a4 .lbl{font:600 10.5pt var(--f-body);color:var(--acc);letter-spacing:.1em;margin-bottom:1.5mm;display:flex;gap:6mm}
.a4 table.out th{font-size:11pt;padding:2mm 0}
.a4 table.out td{font-size:14pt;padding:2.6mm 0}
.a4 table.out th,.a4 table.out td{border-width:.3mm}
.a4 table.out td.eye{font-weight:600}
.a4 .rem{border:.3mm solid #333;padding:2mm 3mm;font-size:12pt;line-height:1.5;min-height:9mm;white-space:pre-line;word-break:keep-all;overflow-wrap:anywhere}
.a4 .blocks{display:flex;flex-direction:column;gap:3.5mm}
.a4 .blk h3{font:600 12pt var(--f-body);margin:0 0 1mm;color:var(--acc);display:flex;align-items:center;gap:2mm}
.a4 .blk h3::before{content:"";width:2.2mm;height:2.2mm;border:.4mm solid var(--acc);border-radius:50%}
.a4 .blk p{margin:0;font-size:11pt;line-height:1.65;white-space:pre-line;color:#222}
.a4 .blk.box{background:color-mix(in srgb,var(--acc) 6%,#fff);padding:3mm 4mm;border-radius:1.5mm}
.a4 .foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;border-top:.3mm solid #999;padding-top:4mm}
.a4 .valid{font-size:10pt;line-height:1.6;color:#444;white-space:pre-line;flex:1;min-width:0}
.a4 .sign{flex:none;display:flex;align-items:center;gap:3mm;font-size:11pt;position:relative;white-space:nowrap}
.a4 .sign .dr{font:600 14pt var(--f-display)}
.a4 .sign img.stamp{height:16mm;width:16mm;object-fit:contain;margin-left:-6mm;opacity:.9}
.a4 .qrband{display:flex;align-items:center;gap:4mm;padding:3mm 4mm;border:.3mm solid color-mix(in srgb,var(--acc) 40%,#fff);border-radius:2mm;margin-top:-1mm}
.a4 .qrband .qf{margin:0;display:flex;flex-direction:column;align-items:center;gap:.8mm;flex:none}
.a4 .qrband .qf figcaption{font-size:8.5pt;font-weight:600;color:var(--acc)}
.a4 .qrband-img{width:20mm;height:20mm;display:block}
.a4 .qrband div{display:flex;flex-direction:column;gap:1mm;font-size:11pt;line-height:1.4}
.a4 .qrband b{font-size:12.5pt;color:var(--acc);letter-spacing:.02em}
/* 엽서(A6): A4 배치를 그대로 두고 크기만 줄인다. */
.a4.a6{width:105mm;min-height:148mm;padding:8mm 8mm 7mm;gap:2.6mm}
.a4.a6.b-single{outline-width:.25mm;outline-offset:-4.5mm}
.a6 .head{gap:2.5mm;border-bottom-width:.5mm;padding-bottom:2mm}
.a6 .head img.logo{max-height:8mm;max-width:20mm}
.a6 .hosp{font-size:9pt}
.a6 .hsub{font-size:6pt}
.a6 h1.t{font-size:13pt;letter-spacing:.4em;padding-left:.4em;margin:0}
.a6 .pt div{padding:1.2mm 2mm;font-size:8pt}
.a6 .pt div:first-child{font-size:9.5pt}
.a6 .pt small{font-size:5.5pt}
.a6 .lbl{font-size:6.5pt;margin-bottom:.8mm;gap:4mm}
.a6 table.out th{font-size:6.5pt;padding:1mm 0}
.a6 table.out td{font-size:8pt;padding:1.4mm 0}
.a6 table.out th,.a6 table.out td{border-width:.2mm}
.a6 .rem{font-size:7pt;padding:1mm 1.5mm;min-height:5mm;border-width:.2mm}
.a6 .blocks{gap:1.8mm}
.a6 .blk h3{font-size:7pt;margin-bottom:.5mm}
.a6 .blk h3::before{width:1.4mm;height:1.4mm;border-width:.25mm}
.a6 .blk p{font-size:6.3pt;line-height:1.5}
.a6 .blk.box{padding:1.5mm 2mm;border-radius:1mm}
.a6 .foot{gap:3mm;padding-top:2mm}
.a6 .valid{font-size:6pt;line-height:1.5}
.a6 .sign{font-size:7pt;gap:1.5mm}
.a6 .sign .dr{font-size:8.5pt}
.a6 .sign img.stamp{height:9mm;width:9mm;margin-left:-3mm}
.a6 .qrband{gap:2mm;padding:1.5mm 2mm;border-radius:1mm;margin-top:0}
.a6 .qrband-img{width:12mm;height:12mm}
.a6 .qrband .qf figcaption{font-size:5.5pt}
.a6 .qrband div{font-size:6.3pt;gap:.5mm}
.a6 .qrband b{font-size:7.5pt}
/* 명함(90×50). 교수님 양식 그대로. */
.card{width:90mm;height:50mm;padding:2.4mm 3mm;display:flex;flex-direction:column;gap:.8mm}
.card .c-top{display:flex;align-items:baseline;justify-content:space-between;gap:2mm;line-height:1.2}
.card .c-pt,.card .c-near{line-height:1.25}
.card .c-title{font:700 9pt var(--f-display);letter-spacing:.3em}
.card .c-hosp{font-size:6pt;color:var(--acc);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .c-pt{display:flex;justify-content:space-between;align-items:baseline;font-size:8pt;border-bottom:.3mm solid var(--acc);padding-bottom:.6mm;gap:2mm}
.card .c-pt b{font-weight:700;font-size:10pt}
.card .c-pt .dt{font-size:7.5pt;font-weight:500}
.card table.out th{font-size:6pt;height:3.4mm;padding:0}
.card table.out td{font-size:7.6pt;height:4.4mm;padding:0}
.card table.out th,.card table.out td{border-width:.18mm}
.card.near{gap:.55mm;padding-block:2mm}
.card.near table.out td{font-size:6.6pt;height:3.2mm}
.card.near table.out th{height:2.7mm;font-size:5.4pt}
.card.near .c-pt b{font-size:9pt}
.card .c-near{font-size:6.5pt;display:flex;gap:4mm}
.card .c-rem{font-size:6.5pt;border:.18mm solid #333;padding:.4mm 1.2mm;flex:none;line-height:1.3;white-space:pre-line;word-break:keep-all;overflow-wrap:anywhere;overflow:hidden}
.card .c-rem b{font-size:5.5pt;color:#555;margin-right:1mm}
.card .c-bot{margin-top:auto;display:flex;align-items:stretch;gap:1.5mm;flex:none;min-height:0}
.card .c-left{flex:0 0 80%;min-width:0;display:flex;flex-direction:column;gap:.5mm}
.card .c-bot:not(.has-qr) .c-left{flex:1}
.card .c-left .c-rem{flex:1}
.card .c-qrtxt{font-size:5.4pt;line-height:1.2;color:#333;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .c-qrfig{margin-left:auto;align-self:flex-end;display:flex;flex-direction:column;align-items:center;gap:.2mm;flex:none}
.card .c-qrfig span{font-size:4.8pt;font-weight:600;line-height:1;color:var(--acc)}
.card .c-qrimg{width:10mm;height:10mm;display:block}
.card.near .c-qrimg{width:7.2mm;height:7.2mm}
.card.near .c-qrfig span{font-size:4.2pt}
.card.near .c-qrtxt{font-size:5pt}
/* 엽서·명함은 A4 용지 왼쪽 위에 실제 크기로 찍고 점선을 따라 자른다. */
.sheet{width:210mm;padding:12mm 15mm}
.sheet .cut{display:inline-block;border:.1mm dashed #999;line-height:0}
.sheet .cut>.paper{line-height:normal}
/* 화면에서는 숨기고 인쇄할 때만 보인다. */
#rx-print-area{display:none}
@media print{
  html,body{background:#fff!important}
  body>*:not(#rx-print-area){display:none!important}
  #rx-print-area{display:block}
  #rx-print-area .paper{box-shadow:none}
  .doc,.doc *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  #rx-print-area .pg{break-after:page}
  #rx-print-area .pg:last-child{break-after:auto}
}
`;
