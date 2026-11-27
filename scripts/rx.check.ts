// npx tsx scripts/rx.check.ts
import assert from "assert";
import { hasPower, isRealDate, parseEmrRx, maskDate, ageAt, ageStr, fmtD, fmtPow, hasTok, normAxis, okAxis, okPow, parseNum, toggleTok, transpose } from "../src/lib/rx";

assert.equal(parseNum(""), null);
assert.equal(parseNum("+1.25"), 1.25);
assert.equal(fmtD(-0.5), "-0.50");
assert.equal(fmtPow("1.5"), "+1.50");
assert.equal(fmtPow("-2.3"), "-2.25", "0.25 단위로 맞춘다");
assert.equal(fmtPow("0"), "0.00");
assert.ok(okPow("-2.75") && !okPow("-2.3") && !okPow("-31"));
assert.ok(okAxis("", "") && !okAxis("", "-0.5") && okAxis("180", "-0.5") && !okAxis("0", "-0.5"));
assert.equal(normAxis(270), 90);
assert.equal(normAxis(180), 180);
assert.deepEqual(transpose("-2.00", "-1.00", "180"), { sph: "-3.00", cyl: "+1.00", axis: "90" });
assert.equal(transpose("-2", "", "180"), null);
assert.equal(ageStr(ageAt("2015-03-02", "2026-03-01")), "10세", "생일 전날");
assert.equal(ageStr(ageAt("2024-05-10", "2025-11-10")), "1세 6개월");
assert.equal(ageStr(ageAt("2025-08-01", "2025-11-24")), "3개월");
let t = toggleTok("", "상시 착용");
t = toggleTok(t, "호야 마이오스마트");
assert.equal(t, "상시 착용, 호야 마이오스마트");
assert.ok(hasTok(t, "호야 마이오스마트") && !hasTok(t, "호야 마이오스마트IQ"), "앞부분이 같은 칩을 헷갈리지 않는다");
assert.equal(toggleTok(t, "상시 착용"), "호야 마이오스마트");
assert.equal(maskDate("2015", "201"), "2015-", "연도 4자리 치면 월로");
assert.equal(maskDate("2015-03", "2015-0"), "2015-03-", "월 2자리 치면 일로");
assert.equal(maskDate("2015-03-02", "2015-03-0"), "2015-03-02");
assert.equal(maskDate("201503021", "20150302"), "2015-03-02", "8자리에서 멈춘다");
assert.equal(maskDate("2015", "2015-"), "2015", "지울 때는 '-' 를 다시 붙이지 않는다");
assert.equal(maskDate("20150302", ""), "2015-03-02", "붙여넣기");
assert.ok(isRealDate("2015-03-02") && !isRealDate("2015-02-30") && !isRealDate("2015-3-2"));
const E = { sph: "", cyl: "" };
assert.ok(!hasPower([E, E]), "도수 없으면 거절");
assert.ok(hasPower([E, { sph: "0.00", cyl: "" }]), "0.00 은 도수");
assert.ok(hasPower([E, E], "+1.50"), "ADD 만");
// EMR 차트 붙여넣기 - 교수님 예시 그대로.
const E1 = parseEmrRx(`MR pd=54******************처방
R: +1.25 -1.50 180 (x1.0)
L: +3.00 -1.00 10    (x1.0)

CR
R: -2.00 -1.00 180
L:              -2.00 180`);
assert.equal(E1.pd, "54");
assert.deepEqual(E1.od, { sph: "+1.25", cyl: "-1.50", axis: "180", prism: "", base: "" }, "처방 덩어리를 고른다");
assert.deepEqual(E1.os, { sph: "+3.00", cyl: "-1.00", axis: "10", prism: "", base: "" });
const cr = parseEmrRx(`CR
R: -2.00 -1.00 180
L:              -2.00 180`);
assert.deepEqual(cr.os, { sph: "", cyl: "-2.00", axis: "180", prism: "", base: "" }, "SPH 없는 난시");
const E3 = parseEmrRx(`MR*************처방
R: -3.00  (x1.0)
L: -3.25    (x1.0)`);
assert.equal(E3.od?.sph, "-3.00"); assert.equal(E3.od?.cyl, ""); assert.equal(E3.od?.axis, "", "축 없는 근시, 시력 (x1.0) 은 버린다");
const E4 = parseEmrRx(`MR*************처방
R: -2.00 -1.00 140 4Δ BO (x1.0)
L: -3.25    4Δ BO                  (x1.0)`);
assert.deepEqual(E4.od, { sph: "-2.00", cyl: "-1.00", axis: "140", prism: "4", base: "BO" });
assert.deepEqual(E4.os, { sph: "-3.25", cyl: "", axis: "", prism: "4", base: "BO" });
const E5 = parseEmrRx(`MR*************처방
R: -1.00 -1.00 140 2Δ BI 
L: -1.00 -0.25 40    2Δ BI`);
assert.deepEqual(E5.os, { sph: "-1.00", cyl: "-0.25", axis: "40", prism: "2", base: "BI" });
const bad = parseEmrRx("R: -2.30 -1.00 190\nL: +1.00 0");
assert.equal(bad.od?.sph, ""); assert.equal(bad.od?.axis, ""); assert.equal(bad.warn.length, 2, "0.25 단위·축 범위 경고");
assert.equal(bad.os?.axis, "180", "축 0 은 180");
console.log("ok");
