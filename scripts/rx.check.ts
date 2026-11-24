// npx tsx scripts/rx.check.ts
import assert from "assert";
import { ageOn, cellProblem, fmtD, isQuarter, nearSph, parseNum } from "../src/lib/rx";

assert.equal(parseNum(""), null);
assert.equal(parseNum("+1.25"), 1.25);
assert.ok(Number.isNaN(parseNum("1.2.3") as number));
assert.ok(isQuarter(-2.75) && !isQuarter(-2.3));
assert.equal(fmtD(1.25), "+1.25");
assert.equal(fmtD(-0.5), "-0.50");
assert.equal(fmtD(0), "0.00");
assert.equal(ageOn("2015-03-02", "2026-03-01"), 10, "생일 전날");
assert.equal(ageOn("2015-03-02", "2026-03-02"), 11, "생일 당일");
assert.equal(nearSph(-2.0, 1.5), -0.5);
assert.equal(nearSph(null, 2), 2);
assert.equal(nearSph(-1, null), null);
assert.equal(cellProblem("sph", -2.3), "0.25 단위");
assert.equal(cellProblem("axis", 181), "0~180 정수");
assert.equal(cellProblem("pd", 62), null);
console.log("ok");
