import { useMemo } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import theme from "../../theme";
import type { Measurement } from "../../types/measurement";
import { getGrowthData } from "../../api/growth_data";
import { useLanguage } from "../../lib/language_context";

// OD(우안) = blue, OS(좌안) = red — matches the chart's data-point colors.
const OD_COLOR = "blue";
const OS_COLOR = "red";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const Section = styled.div`
  margin: 12px 0 8px;
  padding: 20px 24px 24px;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  background: white;
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.textPrimary};
`;

const Sub = styled.div`
  font-size: 12px;
  color: ${theme.textSecondary};
  margin-top: 2px;
  margin-bottom: 18px;
`;

const Eyes = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Eye = styled.div`
  padding: 16px 22px 18px;
  border-radius: 14px;
  background: #fafafa;
  border: 1px solid #eee;
`;

const EyeTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const EyeLabel = styled.div<{ $color: string }>`
  font-size: 32px;
  font-weight: 700;
  color: ${(p) => p.$color};
  white-space: nowrap;
`;

const Big = styled.div<{ $color: string }>`
  font-size: 54px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
  color: ${(p) => p.$color};
  white-space: nowrap;
`;

const Suffix = styled.span`
  font-size: 22px;
  font-weight: 700;
  vertical-align: super;
  margin-left: 2px;
`;

const Caption = styled.div`
  font-size: 12.5px;
  color: ${theme.textSecondary};
  margin-top: 6px;
`;

// --- inverse normal CDF (probit), Acklam's algorithm ---
function probit(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number, r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= phigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return s * y;
}

function normCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

type GrowthRow = { percentile: number; age: number; value: number };

// Interpolate each percentile curve's value at an exact age, then read off the
// child's percentile on the z-score scale. Returns a display string; the edge
// cases ("<p" / ">p") mean the value is outside the reference table's range.
function percentileFor(
  rows: GrowthRow[],
  age: number,
  al: number,
): { label: string; value: number | null; edge: "low" | "high" | null } | null {
  if (!rows.length) return null;

  const byPct = new Map<number, GrowthRow[]>();
  rows.forEach((r) => {
    if (!byPct.has(r.percentile)) byPct.set(r.percentile, []);
    byPct.get(r.percentile)!.push(r);
  });

  const pairs: { v: number; z: number; p: number }[] = [];
  for (const [p, arr] of byPct.entries()) {
    const sorted = [...arr].sort((a, b) => a.age - b.age);
    const ages = sorted.map((e) => e.age);
    const clamped = Math.max(ages[0], Math.min(age, ages[ages.length - 1]));
    let a0 = sorted[0],
      a1 = sorted[sorted.length - 1];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (clamped >= sorted[i].age && clamped <= sorted[i + 1].age) {
        a0 = sorted[i];
        a1 = sorted[i + 1];
        break;
      }
    }
    const f = a1.age === a0.age ? 0 : (clamped - a0.age) / (a1.age - a0.age);
    const v = a0.value + (a1.value - a0.value) * f;
    pairs.push({ v, z: probit(p / 100), p });
  }
  pairs.sort((a, b) => a.v - b.v);

  const lowest = pairs[0];
  const highest = pairs[pairs.length - 1];
  if (al <= lowest.v) return { label: `<${lowest.p}`, value: null, edge: "low" };
  if (al >= highest.v)
    return { label: `>${highest.p}`, value: null, edge: "high" };

  let lo = pairs[0],
    hi = pairs[pairs.length - 1];
  for (let i = 0; i < pairs.length - 1; i++) {
    if (al >= pairs[i].v && al <= pairs[i + 1].v) {
      lo = pairs[i];
      hi = pairs[i + 1];
      break;
    }
  }
  const f = (al - lo.v) / (hi.v - lo.v);
  const z = lo.z + (hi.z - lo.z) * f;
  const pct = normCdf(z) * 100;
  const label = pct >= 10 ? String(Math.round(pct)) : String(Math.round(pct * 10) / 10);
  return { label, value: pct, edge: null };
}

export function PercentileSummary({
  sortedAxialLengthMeasurement,
  patientBirthday,
  patientSex,
  referenceEthnicity,
}: {
  sortedAxialLengthMeasurement: Measurement[];
  patientBirthday: Date;
  patientSex: "male" | "female";
  referenceEthnicity: string;
}) {
  const { language } = useLanguage();
  const ko = language === "ko";

  // Same query key as the chart, so this reuses the cached reference data and
  // follows the "reference data" dropdown selection.
  const growthData = useQuery<GrowthRow[]>({
    queryKey: ["growthData", { sex: patientSex, ethnicity: referenceEthnicity }],
    queryFn: () => getGrowthData(patientSex, referenceEthnicity),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // The most recent measurement that actually has a value (list is sorted desc).
  const latest = useMemo(() => {
    const od = sortedAxialLengthMeasurement.find((m) => m.od != null);
    const os = sortedAxialLengthMeasurement.find((m) => m.os != null);
    return { od, os };
  }, [sortedAxialLengthMeasurement]);

  const ageAt = (m?: Measurement) => {
    if (!m) return null;
    const years =
      (new Date(m.date).getTime() - patientBirthday.getTime()) / MS_PER_YEAR;
    return years > 0 ? years : null;
  };

  const rows = growthData.data ?? [];
  const odAge = ageAt(latest.od);
  const osAge = ageAt(latest.os);
  const odResult =
    latest.od?.od != null && odAge != null
      ? percentileFor(rows, odAge, latest.od.od)
      : null;
  const osResult =
    latest.os?.os != null && osAge != null
      ? percentileFor(rows, osAge, latest.os.os)
      : null;

  if (!rows.length) return null;
  if (!odResult && !osResult) return null;

  const peer = ko
    ? patientSex === "male"
      ? "남아"
      : "여아"
    : patientSex === "male"
      ? "boys"
      : "girls";

  const captionFor = (
    r: { value: number | null; edge: "low" | "high" | null } | null,
  ) => {
    if (!r) return ko ? "측정값 없음" : "No measurement";
    if (r.edge === "low")
      return ko
        ? `참조표 최저 백분위보다 짧습니다`
        : `Below the lowest reference percentile`;
    if (r.edge === "high")
      return ko
        ? `참조표 최고 백분위보다 깁니다`
        : `Above the highest reference percentile`;
    const n = Math.round(r.value as number);
    return ko
      ? `또래 ${peer} 100명 중 안축장이 약 ${n}번째로 긴 위치`
      : `About the ${n}th longest axial length among 100 ${peer} of the same age`;
  };

  const measuredDate =
    latest.od?.date ?? latest.os?.date
      ? new Date(latest.od?.date ?? latest.os!.date).toLocaleDateString()
      : "";

  return (
    <Section>
      <Title>
        {ko ? "우리 아이 안축장 백분위" : "Your child's axial length percentile"}
      </Title>
      <Sub>
        {ko ? "마지막 측정값 기준" : "Based on the last measurement"}
        {measuredDate ? ` · ${measuredDate}` : ""}
        {` · ${referenceEthnicity}`}
      </Sub>
      <Eyes>
        <Eye>
          <EyeTop>
            <EyeLabel $color={OD_COLOR}>
              {ko ? "우안 (오른눈)" : "OD (right eye)"}
            </EyeLabel>
            <Big $color={OD_COLOR}>
              {odResult ? (
                <>
                  {odResult.label}
                  <Suffix>th</Suffix>
                </>
              ) : (
                "—"
              )}
            </Big>
          </EyeTop>
          <Caption>{captionFor(odResult)}</Caption>
        </Eye>
        <Eye>
          <EyeTop>
            <EyeLabel $color={OS_COLOR}>
              {ko ? "좌안 (왼눈)" : "OS (left eye)"}
            </EyeLabel>
            <Big $color={OS_COLOR}>
              {osResult ? (
                <>
                  {osResult.label}
                  <Suffix>th</Suffix>
                </>
              ) : (
                "—"
              )}
            </Big>
          </EyeTop>
          <Caption>{captionFor(osResult)}</Caption>
        </Eye>
      </Eyes>
    </Section>
  );
}
