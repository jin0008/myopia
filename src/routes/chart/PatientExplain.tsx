import { useEffect, useMemo } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import annotation from "chartjs-plugin-annotation";
import { Scatter } from "react-chartjs-2";
import { getGrowthData } from "../../api/growth_data";
import { getTreatmentList } from "../../api/static";
import type { Measurement, RefractiveError } from "../../types/measurement";
import type { Treatment } from "../../types/treatment";
import { ageKo, beforeAfter, lastChange, treatmentKo, ym, type Pt } from "../../lib/explain";
import { percentileFor, type GrowthRow } from "./PercentileSummary";
import { thresholdForAge } from "./RecentALGrowth";
import { AppDownloadQr } from "../../components/app_download_qr";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Filler, annotation);

/**
 * 진료실에서 화면을 돌려 보호자에게 설명할 때 쓰는 화면.
 * 의사용 차트의 영어·입력 도구를 다 걷어내고, 한국어 큰 글씨로
 * "지금 어디쯤인가 / 얼마나 자랐나 / 치료가 듣고 있나" 세 가지만 보여준다.
 * 단계(정상·주의 등) 판정은 하지 않는다 - 기준은 교수님 답을 받아 넣는다.
 * 성장 속도의 나이별 기준만 진료 차트(RecentALGrowth)에 이미 있는 것을 쓴다.
 */

const BLUE = "#2563eb";
const RED = "#dc2626";
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const EYES = [
  { key: "od" as const, name: "오른쪽 눈", color: BLUE },
  { key: "os" as const, name: "왼쪽 눈", color: RED },
];

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: #f6f7f9;
  overflow-y: auto;
  color: #1d1d1f;
  font-size: 20px;
  line-height: 1.5;
`;
const Inner = styled.div`
  max-width: 1360px;
  margin: 0 auto;
  padding: 28px 32px 48px;
  @media (max-width: 720px) {
    padding: 16px;
  }
`;
const Top = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;
const H1 = styled.h1`
  font-size: 34px;
  font-weight: 800;
  margin: 0;
`;
const Meta = styled.div`
  color: #5b6472;
  font-size: 20px;
`;
const Close = styled.button`
  margin-left: auto;
  font-size: 18px;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid #cfd5dd;
  background: white;
  cursor: pointer;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
  gap: 20px;
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;
const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;
const CardTitle = styled.div`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 4px;
`;
const Hint = styled.div`
  color: #5b6472;
  font-size: 17px;
`;
const Legend = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 17px;
  margin: 8px 0 12px;
  color: #3a4250;
`;
const Swatch = styled.span<{ $bg: string; $border?: string }>`
  display: inline-block;
  width: 22px;
  height: 14px;
  border-radius: 4px;
  background: ${(p) => p.$bg};
  border: ${(p) => p.$border ?? "none"};
  margin-right: 6px;
  vertical-align: -1px;
`;
const EyeName = styled.div<{ $color: string }>`
  font-size: 22px;
  font-weight: 800;
  color: ${(p) => p.$color};
`;
const Big = styled.div`
  font-size: 40px;
  font-weight: 800;
  line-height: 1.2;
`;
const Unit = styled.span`
  font-size: 22px;
  font-weight: 600;
  margin-left: 4px;
`;
const Track = styled.div`
  position: relative;
  height: 14px;
  border-radius: 999px;
  margin: 14px 0 6px;
  background: linear-gradient(90deg, #e7ecf2 0%, #e7ecf2 25%, #d6f0e2 25%, #d6f0e2 75%, #e7ecf2 75%);
`;
const Dot = styled.div<{ $left: number; $color: string }>`
  position: absolute;
  top: 50%;
  left: ${(p) => p.$left}%;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  border: 3px solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
`;
const TrackLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  color: #7b8492;
`;
const Pill = styled.span<{ $warn: boolean }>`
  display: inline-block;
  padding: 2px 12px;
  border-radius: 999px;
  font-size: 17px;
  font-weight: 700;
  background: ${(p) => (p.$warn ? "#fff1e6" : "#e6f6ee")};
  color: ${(p) => (p.$warn ? "#c2410c" : "#047857")};
`;
const Row = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 20px;
  & > * {
    flex: 1 1 360px;
  }
`;
const Bar = styled.div<{ $w: number; $bg: string }>`
  height: 26px;
  width: ${(p) => Math.max(2, p.$w)}%;
  background: ${(p) => p.$bg};
  border-radius: 6px;
`;

const pctOf = (rows: GrowthRow[], age: number, al: number) => {
  const r = percentileFor(rows, age, al);
  if (!r) return null;
  // 막대 위의 점 위치. 표 밖이면 양 끝에 붙인다.
  const pos = r.edge === "low" ? 1 : r.edge === "high" ? 99 : Math.min(99, Math.max(1, r.value as number));
  return { ...r, pos };
};

const signed = (v: number, digits = 2) => `${v > 0 ? "+" : ""}${v.toFixed(digits)}`;

export function PatientExplain({
  dateOfBirth,
  sex,
  referenceEthnicity,
  axialLength,
  refractiveError,
  treatments,
  onClose,
}: {
  dateOfBirth: string;
  sex: "male" | "female";
  referenceEthnicity: string;
  axialLength: Measurement[];
  refractiveError: RefractiveError[];
  treatments: Treatment[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // 뒤 페이지가 같이 스크롤되면 큰 화면에서 설명하다 자리를 잃는다.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const growth = useQuery<GrowthRow[]>({
    queryKey: ["growthData", { sex, ethnicity: referenceEthnicity }],
    queryFn: () => getGrowthData(sex, referenceEthnicity),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const treatmentList = useQuery({
    queryKey: ["treatment"],
    queryFn: getTreatmentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const rows = growth.data ?? [];
  const dob = new Date(dateOfBirth).getTime();
  const ageOf = (d: string) => (new Date(d).getTime() - dob) / MS_PER_YEAR;
  const peer = sex === "male" ? "남아" : "여아";

  const series = useMemo(
    () =>
      Object.fromEntries(
        EYES.map(({ key }) => [
          key,
          axialLength
            .filter((m) => m[key] != null)
            .map((m) => ({ date: m.date, v: m[key] as number }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        ]),
      ) as Record<"od" | "os", Pt[]>,
    [axialLength],
  );

  // 치료: 시작 순서대로, 보호자가 아는 이름으로. "None" 은 치료가 아니다.
  const tx = useMemo(
    () =>
      treatments
        .map((t) => ({
          ...t,
          name: treatmentKo(treatmentList.data?.find((x: { id: string }) => x.id === t.treatment_id)?.name ?? ""),
        }))
        .filter((t) => t.name && t.name !== "치료 없음")
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
    [treatments, treatmentList.data],
  );
  const firstStart = tx[0]?.start_date;

  const allPts = [...series.od, ...series.os];
  const lastDate = allPts.length ? allPts.reduce((a, b) => (a.date > b.date ? a : b)).date : null;
  const threshold = lastDate ? thresholdForAge(ageOf(lastDate)) : null;

  // ── 그래프 ────────────────────────────────────────────────
  const chart = useMemo(() => {
    if (!rows.length) return null;
    const byP = new Map<number, { x: number; y: number }[]>();
    rows.forEach((r) => {
      if (!byP.has(r.percentile)) byP.set(r.percentile, []);
      byP.get(r.percentile)!.push({ x: r.age, y: r.value });
    });
    byP.forEach((v) => v.sort((a, b) => a.x - b.x));
    const ps = [...byP.keys()];
    // 표마다 백분위 단계가 달라 가장 가까운 것을 고른다.
    const nearest = (want: number) => ps.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    const curve = (p: number) => byP.get(nearest(p))!;
    const ages = allPts.map((p) => ageOf(p.date));
    const refMin = Math.min(...rows.map((r) => r.age));
    const refMax = Math.max(...rows.map((r) => r.age));
    const minX = Math.max(0, Math.floor(Math.min(refMin, ...ages)));
    const maxX = Math.max(Math.min(refMax, Math.ceil(Math.max(...ages, refMin)) + 3), minX + 4);
    const inX = (pts: { x: number; y: number }[]) => pts.filter((p) => p.x >= minX - 1 && p.x <= maxX + 1);
    const ys = [
      ...inX(curve(3)).map((p) => p.y),
      ...inX(curve(97)).map((p) => p.y),
      ...allPts.map((p) => p.v),
    ];
    const ref = (p: number, extra: object) => ({
      data: curve(p),
      showLine: true,
      pointRadius: 0,
      borderWidth: 1.5,
      // Chart.js 는 order 가 큰 것부터 깐다. 띠가 아이 점을 덮지 않게 아래로.
      order: 10,
      ...extra,
    });
    const datasets: any[] = [
      ref(3, { label: "또래 하위", borderColor: "#c3cad4", backgroundColor: "rgba(231,236,242,0.6)" }),
      ref(97, { label: "또래 상위", borderColor: "#c3cad4", backgroundColor: "rgba(231,236,242,0.6)", fill: "-1" }),
      ref(25, { label: "평균 범위 하단", borderColor: "#7fcfa5", backgroundColor: "rgba(16,185,129,0.18)" }),
      ref(75, { label: "평균 범위 상단", borderColor: "#7fcfa5", backgroundColor: "rgba(16,185,129,0.18)", fill: "-1" }),
      ref(50, { label: "또래 한가운데", borderColor: "#10b981", borderDash: [6, 6], borderWidth: 2 }),
      ...EYES.map(({ key, name, color }) => ({
        label: name,
        data: series[key].map((p) => ({ x: ageOf(p.date), y: p.v })),
        showLine: true,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 3,
        pointRadius: 7,
        pointHoverRadius: 9,
        order: 0,
      })),
    ];
    const annotations = tx.map((t, i) => ({
      type: "line" as const,
      xMin: ageOf(t.start_date),
      xMax: ageOf(t.start_date),
      borderColor: "#7c3aed",
      borderWidth: 2,
      borderDash: [4, 4],
      label: {
        display: true,
        content: `${t.name} 시작`,
        position: (i % 2 ? "end" : "start") as "start" | "end",
        backgroundColor: "#7c3aed",
        color: "white",
        font: { size: 15, weight: "bold" as const },
      },
    }));
    return {
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false as const,
        plugins: {
          legend: { display: false },
          autocolors: { enabled: false },
          annotation: { annotations },
          tooltip: {
            filter: (item: any) => item.datasetIndex >= 5,
            callbacks: {
              label: (item: any) => `${item.dataset.label} ${item.parsed.y.toFixed(2)}mm (${item.parsed.x.toFixed(1)}세)`,
            },
          },
        },
        scales: {
          x: {
            type: "linear" as const,
            min: minX,
            max: maxX,
            ticks: { stepSize: 1, font: { size: 16 }, callback: (v: any) => `${v}세` },
            title: { display: true, text: "나이", font: { size: 17 } },
          },
          y: {
            min: Math.floor((Math.min(...ys) - 0.3) * 2) / 2,
            max: Math.ceil((Math.max(...ys) + 0.3) * 2) / 2,
            ticks: { font: { size: 16 }, callback: (v: any) => `${v}` },
            title: { display: true, text: "안축장 (눈 길이, mm)", font: { size: 17 } },
          },
        },
      },
    };
  }, [rows, series, tx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 굴절력(최근 검사, 구면대응) ─────────────────────────────
  const refr = useMemo(() => {
    const se = (s: number | null, c: number | null) => (s == null ? null : s + (c ?? 0) / 2);
    const sorted = [...refractiveError].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const pick = (key: "od" | "os") =>
      sorted
        .map((r) => ({ date: r.date, v: se(r[`${key}_sph`], r[`${key}_cyl`]) }))
        .filter((r): r is Pt => r.v != null);
    return { od: pick("od"), os: pick("os") };
  }, [refractiveError]);

  const ba = firstStart
    ? Object.fromEntries(EYES.map(({ key }) => [key, beforeAfter(series[key], firstStart)]))
    : null;
  const hasBA = !!ba && EYES.some(({ key }) => ba[key].before != null && ba[key].after != null);

  // 설명을 듣고 바로 찍어 가게 - 같은 기록을 집에서 앱으로 다시 본다.
  const qr = (
    <Card>
      <AppDownloadQr
        size={132}
        title="집에서도 마이오닥 앱으로 확인하세요"
        description="휴대폰 카메라로 QR을 찍으면 아이폰은 App Store, 안드로이드는 Google Play로 연결됩니다."
      />
    </Card>
  );

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="환자 설명">
      <Inner>
        <Top>
          <H1>근시성장곡선</H1>
          <Meta>
            {sex === "male" ? "남아" : "여아"} · 만 {ageKo(dateOfBirth)}
            {lastDate ? ` · 최근 검사 ${new Date(lastDate).toLocaleDateString("ko-KR")}` : ""}
          </Meta>
          <Close onClick={onClose}>닫기 (Esc)</Close>
        </Top>

        {allPts.length === 0 ? (
          <>
          <Card>
            <CardTitle>아직 안축장 검사 기록이 없습니다</CardTitle>
            <Hint>검사를 하면 또래와 비교한 그래프가 여기에 그려집니다.</Hint>
          </Card>
          <div style={{ marginTop: 20 }}>{qr}</div>
          </>
        ) : (
          <Grid>
            <Card>
              <CardTitle>또래 아이들과 비교한 눈 길이</CardTitle>
              <Hint>근시는 눈이 앞뒤로 길어지면서 생깁니다. 점이 위로 빨리 올라갈수록 근시가 빨리 진행하는 것입니다.</Hint>
              <Legend>
                <span><Swatch $bg={BLUE} />오른쪽 눈</span>
                <span><Swatch $bg={RED} />왼쪽 눈</span>
                <span><Swatch $bg="rgba(16,185,129,0.25)" $border="1px solid #7fcfa5" />또래 평균 범위 (100명 중 25~75번째)</span>
                <span><Swatch $bg="rgba(231,236,242,1)" $border="1px solid #c3cad4" />또래 대부분 (100명 중 3~97번째)</span>
                {tx.length > 0 && <span><Swatch $bg="transparent" $border="2px dashed #7c3aed" />치료 시작</span>}
              </Legend>
              <div style={{ height: 520 }}>
                {chart ? (
                  <Scatter data={chart.data} options={chart.options as any} />
                ) : (
                  <Hint>
                    {growth.isFetching
                      ? "또래 기준 자료를 불러오는 중…"
                      : `기준표(${referenceEthnicity})에 또래 자료가 없습니다. 차트 화면의 reference data 를 바꿔 주세요.`}
                  </Hint>
                )}
              </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {EYES.map(({ key, name, color }) => {
                const pts = series[key];
                const last = pts[pts.length - 1];
                if (!last) {
                  return (
                    <Card key={key}>
                      <EyeName $color={color}>{name}</EyeName>
                      <Hint>검사 기록이 없습니다.</Hint>
                    </Card>
                  );
                }
                const p = rows.length ? pctOf(rows, ageOf(last.date), last.v) : null;
                const ch = lastChange(pts);
                const yearly = ch ? (ch.delta / ch.months) * 12 : null;
                const fast = yearly != null && threshold != null && yearly >= threshold;
                return (
                  <Card key={key}>
                    <EyeName $color={color}>{name}</EyeName>
                    <Big>
                      {last.v.toFixed(2)}
                      <Unit>mm</Unit>
                    </Big>
                    {p && (
                      <>
                        <div style={{ fontSize: 21, fontWeight: 700, marginTop: 6 }}>
                          {p.edge === "low"
                            ? `또래 ${peer} 대부분보다 짧습니다`
                            : p.edge === "high"
                              ? `또래 ${peer} 대부분보다 깁니다`
                              : `또래 ${peer} 100명 중 약 ${Math.round(p.value as number)}명보다 깁니다`}
                        </div>
                        <Track>
                          <Dot $left={p.pos} $color={color} />
                        </Track>
                        <TrackLabels>
                          <span>짧은 편</span>
                          <span>평균</span>
                          <span>긴 편</span>
                        </TrackLabels>
                      </>
                    )}
                    {ch && (
                      <div style={{ marginTop: 14 }}>
                        지난 검사({ch.months}개월 전)보다 <b>{signed(ch.delta)}mm</b>
                        {ch.months === 12 && threshold != null && yearly != null && (
                          <Pill $warn={fast} style={{ marginLeft: 10 }}>
                            {fast ? "나이에 비해 빠른 편" : "나이 기준 이내"}
                          </Pill>
                        )}
                        {yearly != null && ch.months >= 3 && ch.months !== 12 && (
                          <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <span>1년으로 치면 {yearly.toFixed(2)}mm</span>
                            {threshold != null && (
                              <Pill $warn={fast}>{fast ? "나이에 비해 빠른 편" : "나이 기준 이내"}</Pill>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
              {qr}
            </div>
          </Grid>
        )}

        <Row>
          {tx.length > 0 && (
            <Card>
              <CardTitle>치료 효과</CardTitle>
              <Hint>
                {tx.map((t) => `${t.name} (${ym(t.start_date)} ~ ${t.end_date ? ym(t.end_date) : "현재"})`).join(" · ")}
              </Hint>
              {hasBA ? (
                EYES.map(({ key, name, color }) => {
                  const { before, after } = ba![key];
                  if (before == null || after == null) return null;
                  const max = Math.max(before, after, 0.01);
                  const drop = before > 0 ? Math.round((1 - after / before) * 100) : null;
                  return (
                    <div key={key} style={{ marginTop: 18 }}>
                      <div style={{ fontWeight: 800, color }}>{name}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "92px 1fr 120px", gap: 10, alignItems: "center", marginTop: 6 }}>
                        <span>치료 전</span>
                        <Bar $w={(Math.max(before, 0) / max) * 100} $bg="#cbd2dc" />
                        <span>1년 {before.toFixed(2)}mm</span>
                        <span>치료 후</span>
                        <Bar $w={(Math.max(after, 0) / max) * 100} $bg={color} />
                        <span>1년 {after.toFixed(2)}mm</span>
                      </div>
                      {drop != null && drop > 0 && (
                        <div style={{ marginTop: 6, fontWeight: 700 }}>치료 후 자라는 속도가 약 {drop}% 느려졌습니다</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <Hint style={{ marginTop: 12 }}>
                  치료 전후를 비교하려면 치료 시작 전과 후에 각각 3개월 이상 간격의 검사가 2번 이상 필요합니다.
                </Hint>
              )}
            </Card>
          )}
          {(refr.od.length > 0 || refr.os.length > 0) && (
            <Card>
              <CardTitle>근시 정도 (굴절검사)</CardTitle>
              <Hint>마이너스(−) 숫자가 클수록 근시가 심한 것입니다. 단위는 디옵터(D)입니다.</Hint>
              {EYES.map(({ key, name, color }) => {
                const r = refr[key];
                if (!r.length) return null;
                const prev = r[1];
                return (
                  <div key={key} style={{ marginTop: 14, display: "flex", gap: 16, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, color, minWidth: 100 }}>{name}</span>
                    <span style={{ fontSize: 30, fontWeight: 800 }}>{signed(r[0].v)}D</span>
                    {prev && <span style={{ color: "#5b6472" }}>지난 검사 {signed(prev.v)}D</span>}
                  </div>
                );
              })}
            </Card>
          )}
        </Row>
      </Inner>
    </Overlay>
  );
}
