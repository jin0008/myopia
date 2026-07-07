import { useContext, useEffect, useMemo, useState } from "react";
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

/** Parse a numeric field. Empty → null (N.D.). Returns ok=false if invalid. */
function parseNum(
  v: string,
  min: number,
  max: number,
): { ok: boolean; value: number | null } {
  if (v.trim() === "") return { ok: true, value: null };
  const n = Number(v);
  if (Number.isNaN(n) || n < min || n > max) return { ok: false, value: null };
  return { ok: true, value: n };
}

function parseAxis(v: string): { ok: boolean; value: number | null } {
  if (v.trim() === "") return { ok: true, value: null };
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 180) return { ok: false, value: null };
  return { ok: true, value: n };
}

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

  const today = new Date().toISOString().slice(0, 10);

  const enrollmentQuery = useQuery({
    queryKey: ["study", "enrollment", "detail", enrollmentId],
    queryFn: () => getEnrollment(enrollmentId!),
    enabled: !!enrollmentId,
  });
  const patientId = enrollmentQuery.data?.patient_id;

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

  // Measurements newest-first. `latest` is used to PREFILL the AL fields (any
  // date); `today` is the write-back target when a measurement already exists
  // for today (so an older reading is never overwritten).
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

  // Most recent refractive error, to prefill sph/cyl/method (axis has no
  // source in the existing data, so it stays blank).
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
  // AL values as prefilled, to detect whether the user changed them on save.
  const [alInitial, setAlInitial] = useState({ od: "", os: "" });

  const set =
    (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // 7) Prefill AL from the most recent measurement (any date).
  useEffect(() => {
    if (latestMeasurement) {
      const od = latestMeasurement.od?.toString() ?? "";
      const os = latestMeasurement.os?.toString() ?? "";
      setForm((f) => ({ ...f, al_od: od, al_os: os }));
      setAlInitial({ od, os });
    }
  }, [latestMeasurement]);

  // 3) Prefill refraction sph/cyl/method from the most recent record.
  useEffect(() => {
    if (!latestRE) return;
    setForm((f) => ({
      ...f,
      ref_od_sph: latestRE.od_sph?.toString() ?? "",
      ref_od_cyl: latestRE.od_cyl?.toString() ?? "",
      ref_os_sph: latestRE.os_sph?.toString() ?? "",
      ref_os_cyl: latestRE.os_cyl?.toString() ?? "",
    }));
    const methodNameMap: Record<string, "Auto" | "MR" | "CR"> = {
      Autorefraction: "Auto",
      "Cycloplegic refraction": "CR",
      "Manifest refraction": "MR",
    };
    const name = methodListQuery.data?.find(
      (m: any) => m.id === latestRE.method_id,
    )?.name;
    if (name && methodNameMap[name]) setMethod(methodNameMap[name]);
  }, [latestRE, methodListQuery.data]);

  useEffect(() => {
    setInstrumentId(
      user?.healthcare_professional?.default_instrument_id ??
        instrumentQuery.data?.[0]?.id,
    );
  }, [instrumentQuery.data, user]);

  const mutation = useMutation({
    mutationFn: (data: VisitInput) => createVisit(enrollmentId!, data),
    onSuccess: () => {
      alert("저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      navigate(`/chart/${patientId}?edit=true`);
    },
    onError: (e: any) => alert(e?.message ?? "저장에 실패했습니다."),
  });

  const handleSubmit = () => {
    const errors: string[] = [];
    const num = (key: keyof typeof EMPTY_FORM, min: number, max: number) => {
      const r = parseNum(form[key], min, max);
      if (!r.ok) errors.push(`${key}: ${min}~${max} 범위의 숫자만 입력하세요.`);
      return r.value;
    };
    const axis = (key: keyof typeof EMPTY_FORM) => {
      const r = parseAxis(form[key]);
      if (!r.ok) errors.push(`${key}: 0~180 정수만 입력하세요.`);
      return r.value;
    };

    const payload: VisitInput = {
      visit_date: today,
      va_od: num("va_od", 0, 1.5),
      va_os: num("va_os", 0, 1.5),
      bcva_od: num("bcva_od", 0, 1.5),
      bcva_os: num("bcva_os", 0, 1.5),
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
      iop_od: num("iop_od", 0, 50),
      iop_os: num("iop_os", 0, 50),
      accom_od: num("accom_od", 0, 20),
      accom_os: num("accom_os", 0, 20),
      concomitant_meds: form.concomitant_meds || null,
      adverse_event: form.adverse_event || null,
    };

    // 7) Axial length write-back.
    const alOd = num("al_od", 15, 35);
    const alOs = num("al_os", 15, 35);
    const alUnchanged =
      form.al_od === alInitial.od && form.al_os === alInitial.os;
    if (alOd != null || alOs != null) {
      if (todayMeasurement) {
        // A reading already exists for today → update it in place.
        payload.axial_length = {
          measurement_id: todayMeasurement.id,
          od: alOd,
          os: alOs,
        };
      } else if (latestMeasurement && alUnchanged) {
        // Prefilled from an older reading and left unchanged → just link to it,
        // don't fabricate a duplicate point on the growth chart.
        payload.axial_length = {
          measurement_id: latestMeasurement.id,
          od: alOd,
          os: alOs,
        };
      } else if (instrumentId) {
        // New/changed value → record it as today's measurement.
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
          측정일(금일): <b>{today}</b> · 미입력 항목은 N.D.로 저장됩니다.
        </p>

        {/* 1) Snellen VA */}
        <Section>
          <SectionHead>1) 시력검사 (Snellen visual acuity) · 0~1.5</SectionHead>
          <EyeRow>
            <Field>
              OD
              <NarrowInput
                inputMode="decimal"
                value={form.va_od}
                onChange={set("va_od")}
              />
            </Field>
            <Field>
              OS
              <NarrowInput
                inputMode="decimal"
                value={form.va_os}
                onChange={set("va_os")}
              />
            </Field>
          </EyeRow>
        </Section>

        {/* 2) BCVA */}
        <Section>
          <SectionHead>
            2) 최대교정시력 (Best corrected visual acuity) · 0~1.5
          </SectionHead>
          <EyeRow>
            <Field>
              OD
              <NarrowInput
                inputMode="decimal"
                value={form.bcva_od}
                onChange={set("bcva_od")}
              />
            </Field>
            <Field>
              OS
              <NarrowInput
                inputMode="decimal"
                value={form.bcva_os}
                onChange={set("bcva_os")}
              />
            </Field>
          </EyeRow>
        </Section>

        {/* 3) Refraction */}
        <Section>
          <SectionHead>3) 굴절검사</SectionHead>
          {latestRE && (
            <p style={{ color: "#6b7280", marginTop: 0, fontSize: 13 }}>
              가장 최근 굴절값({latestRE.date.split("T")[0]})의 sph/cyl/method를
              불러왔습니다. axis는 기존 데이터에 없어 빈칸입니다.
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {(["Auto", "MR", "CR"] as const).map((m) => (
              <PrimaryButton
                key={m}
                style={{
                  opacity: method === m ? 1 : 0.45,
                  padding: "4px 16px",
                }}
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
          <SectionHead>5) 안압검사 (mmHg) · 0.0~50.0</SectionHead>
          <EyeRow>
            <Field>
              OD
              <NarrowInput
                inputMode="decimal"
                value={form.iop_od}
                onChange={set("iop_od")}
              />
            </Field>
            <Field>
              OS
              <NarrowInput
                inputMode="decimal"
                value={form.iop_os}
                onChange={set("iop_os")}
              />
            </Field>
          </EyeRow>
        </Section>

        {/* 6) Accommodation */}
        <Section>
          <SectionHead>6) 조절력검사 (Diopters) · 0.0~20.0</SectionHead>
          <EyeRow>
            <Field>
              OD
              <NarrowInput
                inputMode="decimal"
                value={form.accom_od}
                onChange={set("accom_od")}
              />
            </Field>
            <Field>
              OS
              <NarrowInput
                inputMode="decimal"
                value={form.accom_os}
                onChange={set("accom_os")}
              />
            </Field>
          </EyeRow>
        </Section>

        {/* 7) Axial length */}
        <Section>
          <SectionHead>7) Axial length (mm) · 15~35</SectionHead>
          <p style={{ color: "#6b7280", marginTop: 0, fontSize: 13 }}>
            {todayMeasurement
              ? "오늘 측정된 값을 불러왔습니다. 수정 시 오늘 데이터가 갱신됩니다."
              : latestMeasurement
                ? `가장 최근 측정값(${latestMeasurement.date.split("T")[0]})을 불러왔습니다. 값을 바꾸면 오늘자 측정으로 새로 저장됩니다.`
                : "측정값이 없습니다. 입력하면 오늘자 측정으로 저장됩니다."}
          </p>
          <EyeRow>
            <Field>
              OD
              <NarrowInput
                inputMode="decimal"
                value={form.al_od}
                onChange={set("al_od")}
              />
            </Field>
            <Field>
              OS
              <NarrowInput
                inputMode="decimal"
                value={form.al_os}
                onChange={set("al_os")}
              />
            </Field>
            {!todayMeasurement && (
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
          <PrimaryNagativeButton onClick={() => navigate(`/chart/${patientId}?edit=true`)}>
            취소
          </PrimaryNagativeButton>
          <PrimaryButton onClick={handleSubmit} disabled={mutation.isPending}>
            등록
          </PrimaryButton>
        </div>
      </div>
    </TopDiv>
  );
}
