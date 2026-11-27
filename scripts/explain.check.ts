// npx tsx scripts/explain.check.ts
import assert from "assert";
import { ageKo, beforeAfter, lastChange, treatmentKo, yearlyRate } from "../src/lib/explain";

assert.equal(treatmentKo("0.05% atropine"), "저농도 아트로핀 0.05%");
assert.equal(treatmentKo("1% atropine"), "아트로핀 1%");
assert.equal(treatmentKo("Ortho-K"), "드림렌즈");
assert.equal(treatmentKo("DIMS"), "근시 억제 안경렌즈(DIMS)");
assert.equal(treatmentKo("MiSight"), "MiSight");

// 1년에 0.4mm 씩 곧게 자라면 0.4
const near = (a: number | null, b: number) => assert.ok(a != null && Math.abs(a - b) < 0.01, `${a} != ${b}`);
near(yearlyRate([{ date: "2024-01-01", v: 24 }, { date: "2025-01-01", v: 24.4 }, { date: "2026-01-01", v: 24.8 }]), 0.4);
// 점 하나, 3개월 미만은 못 낸다
assert.equal(yearlyRate([{ date: "2024-01-01", v: 24 }]), null);
assert.equal(yearlyRate([{ date: "2024-01-01", v: 24 }, { date: "2024-02-01", v: 24.1 }]), null);

// 치료 전 1년 0.5, 치료 후 1년 0.2. 시작 직전 측정은 양쪽 출발점.
const pts = [
  { date: "2024-01-01", v: 24.0 },
  { date: "2025-01-01", v: 24.5 },
  { date: "2025-07-01", v: 24.6 },
  { date: "2026-01-01", v: 24.7 },
];
const ba = beforeAfter(pts, "2025-01-10");
near(ba.before, 0.5);
near(ba.after, 0.2);
// 치료 전 기록이 없으면 전은 null
assert.equal(beforeAfter(pts, "2023-06-01").before, null);

assert.deepEqual(lastChange(pts), { delta: 0.1, months: 6 });
assert.equal(lastChange(pts.slice(0, 1)), null);

assert.equal(ageKo("2016-07-15", "2026-11-27"), "10세 4개월");
assert.equal(ageKo("2026-01-01", "2026-11-27"), "10개월");

console.log("explain ok");
