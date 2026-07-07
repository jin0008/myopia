import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import { UserContext } from "../../App";
import { TopDiv } from "../../components/div";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
import { TextInput } from "../../components/input";
import { getPatientDetail } from "../../api/patient";
import {
  getInstrumentList,
  getRefractiveErrorMethodList,
} from "../../api/static";
import {
  createVisit,
  getEnrollment,
  updateVisit,
  type VisitInput,
} from "../../api/study";

const Section = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 16px 20px;
  margin-bottom: 16px;
`;

const SectionHead = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
`;

const EyeRow = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
`;

const Field = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #374151;
`;

const NarrowInput = styled(TextInput)`
  width: 90px;
`;

const VisitRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
`;

const methodNameMap: Record<string, "Auto" | "MR" | "CR"> = {
  Autorefraction: "Auto",
  "Cycloplegic refraction": "CR",
  "Manifest refraction": "MR",
};

/**
 * Parse a numeric field. Empty → null (N.D.). Returns ok=false if invalid.
 * When `maxDecimals` is given, more than that many decimal places is rejected
 * (e.g. VA/IOP/accommodation are limited to one decimal place).
 */
function parseNum(
  v: string,
  min: number,
  max: number,
  maxDecimals?: number,
): { ok: boolean; value: number | null } {
  if (v.trim() === "") return { ok: true, value: null };
  const n = Number(v);
  if (Number.isNaN(n) || n < min || n > max) return { ok: false, value: null };
  if (maxDecimals != null) {
    const decimals = (v.split(".")[1] ?? "").length;
    if (decimals > maxDecimals) return { ok: false, value: null };
  }
  return { ok: true, value: n };
}

function parseAxis(v: string): { ok: boolean; value: number | null } {
  if (v.trim() === "") return { ok: true, value: null };
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 180) return { ok: false, value: null };
  return { ok: true, value: n };
}

const nd = (v: number | null | undefined) => (v == null ? "N.D." : String(v));

const EMPTY_FORM = {
  va_od: "",
  va_os: "",
  bcva_od: "",
  bcva_os: "",
  ref_od_sph: "",
  ref_od_cyl: "",
  ref_od_axis: "",
  ref_os_sph: "",
  ref_os_cyl: "",
  ref_os_axis: "",
  iop_od: "",
  iop_os: "",
  accom_od: "",
  accom_os: "",
  al_od: "",
  al_os: "",
  slit_od_finding: "",
  slit_os_finding: "",
  concomitant_meds: "",
  adverse_event: "",
};

export default function StudyVisit() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useContext(UserContext);

  // Local date (YYYY-MM-DD). Using toISOString() would give the UTC date,
  // which in KST mornings (before 09:00) resolves to the previous day.
  const today = new Date().toLocaleDateString("sv-SE");

  const enrollmentQuery = useQuery({
    queryKey: ["study", "enrollment", "detail", enrollmentId],
    queryFn: () => getEnrollment(enrollmentId!),
    enabled: !!enrollmentId,
  });
  const patientId = enrollmentQuery.data?.patient_id;
  const visits = enrollmentQuery.data?.visits ?? [];

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientDetail(patientId!),
    enabled: !!patientId,
  });

  const instrumentQuery = useQuery({
    queryKey: ["instrument"],
    queryFn: getInstrumentList,
    staleTime: Infinity,
  });
  const methodListQuery = useQuery({
    queryKey: ["refractive_error_method"],
    queryFn: getRefractiveErrorMethodList,
    staleTime: Infinity,
  });

  const sortedMeasurements = useMemo(
    () =>
      [...(patientQuery.data?.measurement ?? [])].sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [patientQuery.data],
  );
  const latestMeasurement = sortedMeasurements[0];
  const todayMeasurement = useMemo(
    () => sortedMeasurements.find((m: any) => m.date.split("T")[0] === today),
    [sortedMeasurements, today],
  );

  const latestRE = useMemo(() => {
    const list = [...(patientQuery.data?.refractive_error ?? [])].sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return list[0];
  }, [patientQuery.data]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [method, setMethod] = useState<"Auto" | "MR" | "CR" | null>(null);
  const [slitOdNormal, setSlitOdNormal] = useState<boolean | null>(null);
  const [slitOsNormal, setSlitOsNormal] = useState<boolean | null>(null);
  const [instrumentId, setInstrumentId] = useState<string>();
  const [alInitial, setAlInitial] = useState({ od: "", os: "" });
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);

  const set =
    (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // Fresh "new visit" form, prefilled from the most recent chart data.
  const applyNewMode = useCallback(() => {
    setEditingVisitId(null);
    setSlitOdNormal(null);
    setSlitOsNormal(null);
    const next = { ...EMPTY_FORM };
    if (latestMeasurement) {
      next.al_od = latestMeasurement.od?.toString() ?? "";
      next.al_os = latestMeasurement.os?.toString() ?? "";
    }
    if (latestRE) {
      next.ref_od_sph = latestRE.od_sph?.toString() ?? "";
      next.ref_od_cyl = latestRE.od_cyl?.toString() ?? "";
      next.ref_os_sph = latestRE.os_sph?.toString() ?? "";
      next.ref_os_cyl = latestRE.os_cyl?.toString() ?? "";
    }
    setForm(next);
    setAlInitial({ od: next.al_od, os: next.al_os });
    const name = methodListQuery.data?.find(
      (m: any) => m.id === latestRE?.method_id,
    )?.name;
    setMethod(name && methodNameMap[name] ? methodNameMap[name] : null);
  }, [latestMeasurement, latestRE, methodListQuery.data]);

  // One-time prefill once patient data is available.
  const initialized = useRef(false);
  useEffect(() => {
    // Wait for BOTH queries: applyNewMode needs the method list to prefill the
    // refraction method, otherwise a slower methodListQuery misses the one-shot.
    if (
      !initialized.current &&
      patientQuery.isSuccess &&
      methodListQuery.isSuccess
    ) {
      initialized.current = true;
      applyNewMode();
    }
  }, [patientQuery.isSuccess, methodListQuery.isSuccess, applyNewMode]);

  useEffect(() => {
    setInstrumentId(
      user?.healthcare_professional?.default_instrument_id ??
        instrumentQuery.data?.[0]?.id,
    );
  }, [instrumentQuery.data, user]);

  // Load an existing visit into the form for editing.
  const loadVisit = (v: any) => {
    const linked = sortedMeasurements.find((m: any) => m.id === v.measurement_id);
    setForm({
      va_od: v.va_od?.toString() ?? "",
      va_os: v.va_os?.toString() ?? "",
      bcva_od: v.bcva_od?.toString() ?? "",
      bcva_os: v.bcva_os?.toString() ?? "",
      ref_od_sph: v.ref_od_sph?.toString() ?? "",
      ref_od_cyl: v.ref_od_cyl?.toString() ?? "",
      ref_od_axis: v.ref_od_axis?.toString() ?? "",
      ref_os_sph: v.ref_os_sph?.toString() ?? "",
      ref_os_cyl: v.ref_os_cyl?.toString() ?? "",
      ref_os_axis: v.ref_os_axis?.toString() ?? "",
      iop_od: v.iop_od?.toString() ?? "",
      iop_os: v.iop_os?.toString() ?? "",
      accom_od: v.accom_od?.toString() ?? "",
      accom_os: v.accom_os?.toString() ?? "",
      al_od: linked?.od?.toString() ?? "",
      al_os: linked?.os?.toString() ?? "",
      slit_od_finding: v.slitlamp_od_finding ?? "",
      slit_os_finding: v.slitlamp_os_finding ?? "",
      concomitant_meds: v.concomitant_meds ?? "",
      adverse_event: v.adverse_event ?? "",
    });
    setAlInitial({
      od: linked?.od?.toString() ?? "",
      os: linked?.os?.toString() ?? "",
    });
    setMethod(v.refraction_method ?? null);
    setSlitOdNormal(v.slitlamp_od_normal);
    setSlitOsNormal(v.slitlamp_os_normal);
    setEditingVisitId(v.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mutation = useMutation({
    mutationFn: (data: VisitInput) =>
      editingVisitId
        ? updateVisit(enrollmentId!, editingVisitId, data)
        : createVisit(enrollmentId!, data),
    onSuccess: () => {
      alert("저장되었습니다.");
      queryClient.invalidateQueries({
        queryKey: ["study", "enrollment", "detail", enrollmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      applyNewMode();
    },
    onError: (e: any) => alert(e?.message ?? "저장에 실패했습니다."),
  });

  const handleSubmit = () => {
    const errors: string[] = [];
    const num = (
      key: keyof typeof EMPTY_FORM,
      min: number,
      max: number,
      maxDecimals?: number,
    ) => {
      const r = parseNum(form[key], min, max, maxDecimals);
      if (!r.ok) {
        const dec =
          maxDecimals != null ? `, 소수점 ${maxDecimals}자리까지` : "";
        errors.push(`${key}: ${min}~${max}${dec} 숫자만 입력하세요.`);
      }
      return r.value;
    };
    const axis = (key: keyof typeof EMPTY_FORM) => {
      const r = parseAxis(form[key]);
      if (!r.ok) errors.push(`${key}: 0~180 정수만 입력하세요.`);
      return r.value;
    };

    const visitDate = editingVisitId
      ? visits.find((v: any) => v.id === editingVisitId)?.visit_date.split("T")[0] ??
        today
      : today;

    const payload: VisitInput = {
      visit_date: visitDate,
      va_od: num("va_od", 0, 1.5, 1),
      va_os: num("va_os", 0, 1.5, 1),
      bcva_od: num("bcva_od", 0, 1.5, 1),
      bcva_os: num("bcva_os", 0, 1.5, 1),
      refraction_method: method,
      ref_od_sph: num("ref_od_sph", -30, 30),
      ref_od_cyl: num("ref_od_cyl", -30, 30),
      ref_od_axis: axis("ref_od_axis"),
      ref_os_sph: num("ref_os_sph", -30, 30),
      ref_os_cyl: num("ref_os_cyl", -30, 30),
      ref_os_axis: axis("ref_os_axis"),
      slitlamp_od_normal: slitOdNormal,
      slitlamp_od_finding:
        slitOdNormal === false ? form.slit_od_finding || null : null,
      slitlamp_os_normal: slitOsNormal,
      slitlamp_os_finding:
        slitOsNormal === false ? form.slit_os_finding || null : null,
      iop_od: num("iop_od", 0, 50, 1),
      iop_os: num("iop_os", 0, 50, 1),
      accom_od: num("accom_od", 0, 20, 1),
      accom_os: num("accom_os", 0, 20, 1),
      concomitant_meds: form.concomitant_meds || null,
      adverse_event: form.adverse_event || null,
    };

    // 7) Axial length write-back.
    const alOd = num("al_od", 15, 40);
    const alOs = num("al_os", 15, 40);
    const alUnchanged =
      form.al_od === alInitial.od && form.al_os === alInitial.os;
    const editingVisit = visits.find((v: any) => v.id === editingVisitId);
    const linkedId = editingVisit?.measurement_id ?? todayMeasurement?.id ?? null;
    if (alOd != null || alOs != null) {
      if (linkedId) {
        payload.axial_length = { measurement_id: linkedId, od: alOd, os: alOs };
      } else if (!editingVisitId && latestMeasurement && alUnchanged) {
        payload.axial_length = {
          measurement_id: latestMeasurement.id,
          od: alOd,
          os: alOs,
        };
      } else if (instrumentId) {
        payload.axial_length = { instrument_id: instrumentId, od: alOd, os: alOs };
      } else {
        errors.push("Axial length 저장을 위한 측정기기를 선택하세요.");
      }
    }

    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }
    mutation.mutate(payload);
  };

  if (enrollmentQuery.isLoading) return <TopDiv>Loading...</TopDiv>;
  if (enrollmentQuery.isError || !enrollmentQuery.data)
    return <TopDiv>연구 등록 정보를 불러올 수 없습니다.</TopDiv>;

  const study = enrollmentQuery.data.study;

  return (
    <TopDiv>
      <div style={{ width: "min(760px, 92%)", padding: "16px 0 48px" }}>
        <h1 style={{ marginBottom: 4 }}>{study.name}</h1>
        <p style={{ color: "#6b7280", marginTop: 0 }}>
          {editingVisitId ? (
            <>
              <b>방문 수정 중</b> — 저장하면 해당 방문이 덮어써집니다.{" "}
              <span
                style={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={applyNewMode}
              >
                새 방문으로 전환
              </span>
            </>
          ) : (
            <>
              측정일(금일): <b>{today}</b> · 미입력 항목은 N.D.로 저장됩니다.
            </>
          )}
        </p>

        {/* 1) Snellen VA */}
        <Section>
          <SectionHead>
            1) 시력검사 (Snellen visual acuity) · 0~1.5 · 소수점 1자리
          </SectionHead>
          <EyeRow>
            <Field>
              OD
              <NarrowInput inputMode="decimal" value={form.va_od} onChange={set("va_od")} />
            </Field>
            <Field>
              OS
              <NarrowInput inputMode="decimal" value={form.va_os} onChange={set("va_os")} />
            </Field>
          </EyeRow>
        </Section>

        {/* 2) BCVA */}
        <Section>
          <SectionHead>
            2) 최대교정시력 (Best corrected visual acuity) · 0~1.5 · 소수점 1자리
          </SectionHead>
          <EyeRow>
            <Field>
              OD
              <NarrowInput inputMode="decimal" value={form.bcva_od} onChange={set("bcva_od")} />
            </Field>
            <Field>
              OS
              <NarrowInput inputMode="decimal" value={form.bcva_os} onChange={set("bcva_os")} />
            </Field>
          </EyeRow>
        </Section>

        {/* 3) Refraction */}
        <Section>
          <SectionHead>3) 굴절검사</SectionHead>
          {latestRE && !editingVisitId && (
            <p style={{ color: "#6b7280", marginTop: 0, fontSize: 13 }}>
              가장 최근 굴절값({latestRE.date.split("T")[0]})의 sph/cyl/method를
              불러왔습니다. axis는 기존 데이터에 없어 빈칸입니다.
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["Auto", "MR", "CR"] as const).map((m) => (
              <PrimaryButton
                key={m}
                style={{ opacity: method === m ? 1 : 0.45, padding: "4px 16px" }}
                onClick={() => setMethod(method === m ? null : m)}
              >
                {m}
              </PrimaryButton>
            ))}
          </div>
          {(["od", "os"] as const).map((eye) => (
            <EyeRow key={eye} style={{ marginBottom: 8 }}>
              <b style={{ width: 28 }}>{eye.toUpperCase()}</b>
              <Field>
                sph
                <NarrowInput
                  inputMode="decimal"
                  value={form[`ref_${eye}_sph` as keyof typeof EMPTY_FORM]}
                  onChange={set(`ref_${eye}_sph` as keyof typeof EMPTY_FORM)}
                />
              </Field>
              <Field>
                cyl
                <NarrowInput
                  inputMode="decimal"
                  value={form[`ref_${eye}_cyl` as keyof typeof EMPTY_FORM]}
                  onChange={set(`ref_${eye}_cyl` as keyof typeof EMPTY_FORM)}
                />
              </Field>
              <Field>
                axis
                <NarrowInput
                  inputMode="numeric"
                  value={form[`ref_${eye}_axis` as keyof typeof EMPTY_FORM]}
                  onChange={set(`ref_${eye}_axis` as keyof typeof EMPTY_FORM)}
                />
              </Field>
            </EyeRow>
          ))}
        </Section>

        {/* 4) Slit lamp */}
        <Section>
          <SectionHead>4) 세극등 검사 (전안부)</SectionHead>
          {(
            [
              ["od", slitOdNormal, setSlitOdNormal, "slit_od_finding"],
              ["os", slitOsNormal, setSlitOsNormal, "slit_os_finding"],
            ] as const
          ).map(([eye, value, setValue, findingKey]) => (
            <div key={eye} style={{ marginBottom: 10 }}>
              <EyeRow>
                <b style={{ width: 28 }}>{eye.toUpperCase()}</b>
                <PrimaryButton
                  style={{ opacity: value === true ? 1 : 0.45, padding: "4px 14px" }}
                  onClick={() => setValue(value === true ? null : true)}
                >
                  정상
                </PrimaryButton>
                <PrimaryNagativeButton
                  style={{ opacity: value === false ? 1 : 0.45, padding: "4px 14px" }}
                  onClick={() => setValue(value === false ? null : false)}
                >
                  비정상
                </PrimaryNagativeButton>
                {value === false && (
                  <TextInput
                    style={{ flex: 1, minWidth: 180 }}
                    placeholder="소견 (free text)"
                    value={form[findingKey]}
                    onChange={set(findingKey)}
                  />
                )}
              </EyeRow>
            </div>
          ))}
        </Section>

        {/* 5) IOP */}
        <Section>
          <SectionHead>5) 안압검사 (mmHg) · 0.0~50.0 · 소수점 1자리</SectionHead>
          <EyeRow>
            <Field>
              OD
              <NarrowInput inputMode="decimal" value={form.iop_od} onChange={set("iop_od")} />
            </Field>
            <Field>
              OS
              <NarrowInput inputMode="decimal" value={form.iop_os} onChange={set("iop_os")} />
            </Field>
          </EyeRow>
        </Section>

        {/* 6) Accommodation */}
        <Section>
          <SectionHead>6) 조절력검사 (Diopters) · 0.0~20.0 · 소수점 1자리</SectionHead>
          <EyeRow>
            <Field>
              OD
              <NarrowInput inputMode="decimal" value={form.accom_od} onChange={set("accom_od")} />
            </Field>
            <Field>
              OS
              <NarrowInput inputMode="decimal" value={form.accom_os} onChange={set("accom_os")} />
            </Field>
          </EyeRow>
        </Section>

        {/* 7) Axial length */}
        <Section>
          <SectionHead>7) Axial length (mm) · 15~40</SectionHead>
          <p style={{ color: "#6b7280", marginTop: 0, fontSize: 13 }}>
            {editingVisitId
              ? "이 방문에 연결된 측정값입니다. 수정 시 해당 측정 데이터가 갱신됩니다."
              : todayMeasurement
                ? "오늘 측정된 값을 불러왔습니다. 수정 시 오늘 데이터가 갱신됩니다."
                : latestMeasurement
                  ? `가장 최근 측정값(${latestMeasurement.date.split("T")[0]})을 불러왔습니다. 값을 바꾸면 오늘자 측정으로 새로 저장됩니다.`
                  : "측정값이 없습니다. 입력하면 오늘자 측정으로 저장됩니다."}
          </p>
          <EyeRow>
            <Field>
              OD
              <NarrowInput inputMode="decimal" value={form.al_od} onChange={set("al_od")} />
            </Field>
            <Field>
              OS
              <NarrowInput inputMode="decimal" value={form.al_os} onChange={set("al_os")} />
            </Field>
            {!todayMeasurement && !editingVisitId && (
              <Field>
                측정기기
                <TextInput
                  as="select"
                  value={instrumentId}
                  onChange={(e: any) => setInstrumentId(e.target.value)}
                >
                  {instrumentQuery.data?.map((i: any) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </TextInput>
              </Field>
            )}
          </EyeRow>
        </Section>

        {/* 8) Concomitant meds */}
        <Section>
          <SectionHead>8) 병용약물</SectionHead>
          <TextInput
            style={{ width: "100%" }}
            placeholder="free text"
            value={form.concomitant_meds}
            onChange={set("concomitant_meds")}
          />
        </Section>

        {/* 9) Adverse event */}
        <Section>
          <SectionHead>9) 이상사례보고</SectionHead>
          <TextInput
            style={{ width: "100%" }}
            placeholder="free text"
            value={form.adverse_event}
            onChange={set("adverse_event")}
          />
        </Section>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <PrimaryNagativeButton
            onClick={() => navigate(`/chart/${patientId}?edit=true`)}
          >
            차트로
          </PrimaryNagativeButton>
          <PrimaryButton onClick={handleSubmit} disabled={mutation.isPending}>
            {editingVisitId ? "수정 저장" : "등록"}
          </PrimaryButton>
        </div>

        {/* Visit history */}
        <Section style={{ marginTop: 32 }}>
          <SectionHead>방문 기록</SectionHead>
          {visits.length === 0 ? (
            <p style={{ color: "#6b7280" }}>저장된 방문이 없습니다.</p>
          ) : (
            visits.map((v: any) => (
              <VisitRow key={v.id}>
                <b style={{ minWidth: 96 }}>{v.visit_date.split("T")[0]}</b>
                <span style={{ flex: 1, color: "#374151", fontSize: 13 }}>
                  시력 {nd(v.va_od)}/{nd(v.va_os)} · 안압 {nd(v.iop_od)}/
                  {nd(v.iop_os)} · 조절력 {nd(v.accom_od)}/{nd(v.accom_os)}
                  {v.adverse_event ? " · ⚠ 이상사례" : ""}
                </span>
                <PrimaryButton
                  style={{
                    padding: "4px 14px",
                    opacity: editingVisitId === v.id ? 1 : 0.85,
                  }}
                  onClick={() => loadVisit(v)}
                >
                  {editingVisitId === v.id ? "수정 중" : "수정"}
                </PrimaryButton>
              </VisitRow>
            ))
          )}
        </Section>
      </div>
    </TopDiv>
  );
}
