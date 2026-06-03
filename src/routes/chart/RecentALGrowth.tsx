import { useMemo } from "react";
import styled from "styled-components";
import theme from "../../theme";
import type { Measurement } from "../../types/measurement";
import { useLanguage } from "../../lib/language_context";

const Box = styled.div`
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  background: white;
`;

const BoxTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 10px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  padding: 2px 0;
`;

const EyeLabel = styled.span`
  color: ${theme.textSecondary};
  font-weight: 600;
`;

const Value = styled.span<{ $warn?: boolean }>`
  font-weight: 700;
  color: ${(props) => (props.$warn ? "#d32f2f" : theme.primary)};
`;

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Annualized AL growth (mm/year) for one eye, computed from the two most
 * recent measurements that have a value for that eye. `sortedDesc` must be
 * sorted most-recent-first. Returns null when fewer than two values exist
 * or the two dates coincide.
 */
function annualGrowth(
  sortedDesc: Measurement[],
  eye: "od" | "os",
): number | null {
  const points = sortedDesc.filter((m) => m[eye] != null);
  if (points.length < 2) return null;
  const latest = points[0];
  const previous = points[1];
  const years =
    (new Date(latest.date).getTime() - new Date(previous.date).getTime()) /
    MS_PER_YEAR;
  if (years <= 0) return null;
  return ((latest[eye] as number) - (previous[eye] as number)) / years;
}

/**
 * Age-dependent fast-progression threshold (mm/yr), age taken at the most
 * recent visit:
 *   4–5세 ≥ 0.40 · 6세 ≥ 0.35 · 7–9세 ≥ 0.30 · 10세 이상 ≥ 0.25
 * Under 4세 no threshold is applied (no highlight).
 */
function thresholdForAge(ageYears: number): number | null {
  if (ageYears >= 10) return 0.25;
  if (ageYears >= 7) return 0.3;
  if (ageYears >= 6) return 0.35;
  if (ageYears >= 4) return 0.4;
  return null;
}

/**
 * "최근의 안축장길이 성장 (Most recent AL growth)" box.
 * Shown under the axial-length entry list when the patient has at least two
 * usable measurements for either eye. Values at or above the age-dependent
 * threshold (see thresholdForAge) are highlighted in red.
 */
export function RecentALGrowth({
  measurement,
  dateOfBirth,
}: {
  measurement: Measurement[];
  dateOfBirth: string;
}) {
  const { language } = useLanguage();
  const ko = language === "ko";

  const od = useMemo(() => annualGrowth(measurement, "od"), [measurement]);
  const os = useMemo(() => annualGrowth(measurement, "os"), [measurement]);

  // Age at the last visit (= most recent measurement; list is sorted desc).
  const threshold = useMemo(() => {
    if (measurement.length === 0 || !dateOfBirth) return null;
    const lastVisit = new Date(measurement[0].date).getTime();
    const dob = new Date(dateOfBirth).getTime();
    if (Number.isNaN(lastVisit) || Number.isNaN(dob) || lastVisit <= dob)
      return null;
    return thresholdForAge((lastVisit - dob) / MS_PER_YEAR);
  }, [measurement, dateOfBirth]);

  if (od == null && os == null) return null;

  const fmt = (v: number | null) =>
    v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)} mm/yr`;
  const warn = (v: number | null) =>
    v != null && threshold != null && v >= threshold;

  return (
    <Box>
      <BoxTitle>
        {ko ? "최근의 안축장길이 성장" : "Most recent AL growth"}
      </BoxTitle>
      <Row>
        <EyeLabel>OD</EyeLabel>
        <Value $warn={warn(od)}>{fmt(od)}</Value>
      </Row>
      <Row>
        <EyeLabel>OS</EyeLabel>
        <Value $warn={warn(os)}>{fmt(os)}</Value>
      </Row>
    </Box>
  );
}
