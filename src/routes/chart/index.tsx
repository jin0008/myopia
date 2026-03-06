import { useParams, useSearchParams } from "react-router";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import { getLatestPatientData, getPatientDetail } from "../../api/patient";
import { getGrowthDataEthnicityList } from "../../api/growth_data";
import { upsertPatientK } from "../../api/mean_k";
import { Chart } from "./Chart";
import { KInputDialog } from "./KInputDialog";
import {
  MeasurementList,
  MeasurementRegisterDialog,
  RefractiveErrorRegisterDialog,
} from "./MeasurementList";
import { TreatmentList } from "./TreatmentList";
import {
  ACTIVITY_LABELS,
  MYOPIA_STATUS_LABELS,
  PatientDataInput,
} from "./PatientDataInput";
import {
  HeaderDiv,
  HeaderTextDiv,
  ContentDiv,
  ChartTitleDiv,
  ChartTitleMain,
  ReferenceRow,
  ChartAndListWrapper,
  ChartContainer,
  MeasurementListWrapper,
  ChartPageRoot,
  TextButton,
  SmallTextButton,
  ChartWrapper,
} from "./styles";
import { deleteMeasurement, registerMeasurement } from "../../api/measurement";
import { Measurement, RefractiveError } from "../../types/measurement";
import {
  deleteRefractiveError,
  registerRefractiveError,
} from "../../api/refractive_error";
import {
  getInstrumentList,
  getRefractiveErrorMethodList,
  getTreatmentList,
} from "../../api/static";
import { MagnifyingGlass } from "../../components/magnifying_glass";
import { Treatment } from "../../types/treatment";

export default function ChartRoute() {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();
  const edit = searchParams.get("edit") === "true";

  const [viewMode, setViewMode] = useState<"default" | "list">("default");
  const [referenceEthnicity, setReferenceEthnicity] = useState<string>("Asian");
  const [displayAxialLength, setDisplayAxialLength] = useState(true);
  const [refractiveErrorType, setRefractiveErrorType] = useState<
    "sph" | "se" | null
  >(null);

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientDetail(patientId as string),
    enabled: !!patientId,
  });

  const meanKValue = useMemo(() => {
    if (!patientQuery.data) return "(No data)";
    if (patientQuery.data.patient_k.length === 0) return "(No data)";

    let od_count = 0;
    let os_count = 0;
    let od_sum = 0;
    let os_sum = 0;
    patientQuery.data.patient_k.forEach((k: { od?: number; os?: number }) => {
      if (k.od != null) {
        od_count++;
        od_sum += k.od;
      }
      if (k.os != null) {
        os_count++;
        os_sum += k.os;
      }
    });
    const od = od_count > 0 ? od_sum / od_count : 0;
    const os = os_count > 0 ? os_sum / os_count : 0;
    return `(OD:${od}, OS:${os})`;
  }, [patientQuery.data?.patient_k]);

  const [kInputDialogOpen, setKInputDialogOpen] = useState(false);
  const [isMeasurementRegisterDialogOpen, setIsMeasurementRegisterDialogOpen] =
    useState(false);
  const [
    isRefractiveErrorRegisterDialogOpen,
    setIsRefractiveErrorRegisterDialogOpen,
  ] = useState(false);

  const queryClient = useQueryClient();
  const kValueMutation = useMutation({
    mutationFn: (data: {
      K1: { od: number | null; os: number | null };
      K2: { od: number | null; os: number | null };
    }) =>
      Promise.all([
        upsertPatientK({
          patient_id: patientId!,
          k_type: "K1",
          od: data.K1.od,
          os: data.K1.os,
        }),
        upsertPatientK({
          patient_id: patientId!,
          k_type: "K2",
          od: data.K2.od,
          os: data.K2.os,
        }),
      ]),
    onSuccess: () => {
      alert("K value registered successfully");
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
      setKInputDialogOpen(false);
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const referenceEthnictyListQuery = useQuery({
    queryKey: ["referenceEthnicityList"],
    queryFn: getGrowthDataEthnicityList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const xlsxObjectURL = useRef<string | null>(null);

  const [targetCanvas, setTargetCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (xlsxObjectURL.current) {
        URL.revokeObjectURL(xlsxObjectURL.current!);
      }
    };
  }, []);

  const sortedAxialLength = useMemo<Measurement[]>(() => {
    return (patientQuery.data?.measurement ?? []).sort(
      (a: Measurement, b: Measurement) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [patientQuery.data?.measurement]);

  const sortedRefractiveError = useMemo<Measurement[]>(() => {
    return (patientQuery.data?.refractive_error ?? [])
      .map((e: RefractiveError) => ({
        id: e.id,
        date: e.date,
        od:
          e.od_sph === null
            ? null
            : refractiveErrorType === "sph"
              ? e.od_sph
              : e.od_cyl === null
                ? null
                : e.od_sph + e.od_cyl * 0.5,
        os:
          e.os_sph === null
            ? null
            : refractiveErrorType === "sph"
              ? e.os_sph
              : e.os_cyl === null
                ? null
                : e.os_sph + e.os_cyl * 0.5,
      }))
      .sort(
        (a: Measurement, b: Measurement) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
  }, [patientQuery.data?.refractive_error, refractiveErrorType]);

  const sortedTreatment = useMemo<Treatment[]>(() => {
    return (patientQuery.data?.patient_treatment ?? []).sort(
      (a: Treatment, b: Treatment) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    );
  }, [patientQuery.data?.patient_treatment]);

  const registerMeasurementMutation = useMutation({
    mutationFn: registerMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
      setIsMeasurementRegisterDialogOpen(false);
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const deleteMeasurementMutation = useMutation({
    mutationFn: deleteMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const registerRefractiveErrorMutation = useMutation({
    mutationFn: registerRefractiveError,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
      setIsRefractiveErrorRegisterDialogOpen(false);
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const deleteRefractiveErrorMutation = useMutation({
    mutationFn: deleteRefractiveError,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const handleDeleteMeasurement = (measurement: Measurement) => {
    confirm("Are you sure you want to delete this measurement?") &&
      deleteMeasurementMutation.mutate(measurement.id);
  };

  const handleDeleteRefractiveError = (refractiveError: Measurement) => {
    confirm("Are you sure you want to delete this refractive error?") &&
      deleteRefractiveErrorMutation.mutate(refractiveError.id);
  };

  if (!patientQuery.data) return <div>Loading...</div>;

  return (
    <ChartPageRoot>
      <HeaderDiv>
        <HeaderTextDiv>{patientQuery.data.registration_number}</HeaderTextDiv>
      </HeaderDiv>
      <ContentDiv>
        <ChartTitleDiv>
          <ChartTitleMain>
            <h1 style={{ fontWeight: "normal" }}>Eye growth chart</h1>
            <span>{new Date().toLocaleDateString()}</span>
          </ChartTitleMain>
          <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
            <TextButton
              $active={viewMode === "default"}
              onClick={() => setViewMode("default")}
            >
              Default
            </TextButton>
            <TextButton
              $active={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              List view
            </TextButton>
          </div>
        </ChartTitleDiv>
        <ReferenceRow>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>reference data :</span>
            <select
              value={referenceEthnicity}
              onChange={(e) => setReferenceEthnicity(e.target.value)}
            >
              {referenceEthnictyListQuery.data?.map((e: string) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>meanK(Diopter):</span>
            {meanKValue}
            <span
              style={{
                textDecoration: "underline",
                cursor: "pointer",
              }}
              onClick={() => setKInputDialogOpen(true)}
            >
              register k value
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "row", gap: "4px" }}>
            <SmallTextButton
              $active={displayAxialLength}
              onClick={() => {
                if (refractiveErrorType === null && displayAxialLength) {
                  setRefractiveErrorType("sph");
                }
                setDisplayAxialLength((prev) => !prev);
              }}
            >
              Axial length
            </SmallTextButton>
            <SmallTextButton
              $active={refractiveErrorType === "sph"}
              onClick={() =>
                setRefractiveErrorType(
                  refractiveErrorType === "sph"
                    ? (setDisplayAxialLength(true), null)
                    : "sph",
                )
              }
            >
              Refractive error(sph)
            </SmallTextButton>
            <SmallTextButton
              $active={refractiveErrorType === "se"}
              onClick={() =>
                setRefractiveErrorType(
                  refractiveErrorType === "se"
                    ? (setDisplayAxialLength(true), null)
                    : "se",
                )
              }
            >
              Refractive error(SE)
            </SmallTextButton>
          </div>
          <div style={{ flex: 1 }} />
          <SmallTextButton
            style={{
              fontWeight: "bold",
            }}
            $active={true}
            onClick={() => {
              if (xlsxObjectURL.current) {
                URL.revokeObjectURL(xlsxObjectURL.current!);
              }
              generateXlsx(patientId!, queryClient)
                .then((xlsx) => xlsx.xlsx.writeBuffer())
                .then((buffer) => {
                  const url = URL.createObjectURL(
                    new Blob([buffer], {
                      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    }),
                  );
                  xlsxObjectURL.current = url;
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${patientQuery.data.registration_number}_${new Date().toLocaleDateString()}.xlsx`;
                  a.click();
                })
                .catch((e) => {
                  console.log(e);
                  alert("An error has occured while generating XLSX file");
                });
            }}
          >
            Download data
          </SmallTextButton>
        </ReferenceRow>
        <ChartAndListWrapper>
          <ChartWrapper>
            <Chart
              displayAxialLength={displayAxialLength}
              refractiveErrorType={refractiveErrorType}
              sortedAxialLengthMeasurement={sortedAxialLength}
              sortedRefractiveErrorMeasurement={sortedRefractiveError}
              sortedTreatment={sortedTreatment}
              patientBirthday={new Date(patientQuery.data.date_of_birth)}
              patientSex={patientQuery.data.sex}
              referenceEthnicity={referenceEthnicity}
              onCanvasChange={(canvas) => setTargetCanvas(canvas)}
            />
            <MagnifyingGlass
              targetCanvas={targetCanvas}
              zoom={2}
              height={160}
              width={160}
            />
          </ChartWrapper>
          {!(displayAxialLength && refractiveErrorType) && (
            <MeasurementListWrapper>
              <MeasurementList
                mode={viewMode}
                edit={edit}
                measurement={
                  displayAxialLength ? sortedAxialLength : sortedRefractiveError
                }
                onAdd={() => {
                  displayAxialLength
                    ? setIsMeasurementRegisterDialogOpen(true)
                    : setIsRefractiveErrorRegisterDialogOpen(true);
                }}
                onDelete={
                  displayAxialLength
                    ? handleDeleteMeasurement
                    : handleDeleteRefractiveError
                }
              />
            </MeasurementListWrapper>
          )}
        </ChartAndListWrapper>
        <TreatmentList edit={edit} />
        <PatientDataInput patientId={patientId!} edit={edit} />
      </ContentDiv>

      <KInputDialog
        open={kInputDialogOpen}
        onClose={() => setKInputDialogOpen(false)}
        onConfirm={(data) => kValueMutation.mutate(data)}
        initialData={{
          K1: {
            od:
              patientQuery.data.patient_k.find(
                (k: { k_type: string }) => k.k_type === "K1",
              )?.od ?? null,
            os:
              patientQuery.data.patient_k.find(
                (k: { k_type: string }) => k.k_type === "K1",
              )?.os ?? null,
          },
          K2: {
            od:
              patientQuery.data.patient_k.find(
                (k: { k_type: string }) => k.k_type === "K2",
              )?.od ?? null,
            os:
              patientQuery.data.patient_k.find(
                (k: { k_type: string }) => k.k_type === "K2",
              )?.os ?? null,
          },
        }}
      />
      <MeasurementRegisterDialog
        open={isMeasurementRegisterDialogOpen}
        onClose={() => setIsMeasurementRegisterDialogOpen(false)}
        onConfirm={({ instrumentId, date, od, os }) => {
          if (new Date(date) > new Date()) {
            alert("Can't register future measurement");
            return;
          }
          registerMeasurementMutation.mutate({
            patient_id: patientId!,
            instrument_id: instrumentId,
            date,
            od,
            os,
          });
        }}
      />
      <RefractiveErrorRegisterDialog
        open={isRefractiveErrorRegisterDialogOpen}
        onClose={() => setIsRefractiveErrorRegisterDialogOpen(false)}
        onConfirm={({ methodId, date, od_sph, od_cyl, os_sph, os_cyl }) => {
          registerRefractiveErrorMutation.mutate({
            patient_id: patientId!,
            method_id: methodId,
            date,
            od_sph,
            od_cyl,
            os_sph,
            os_cyl,
          });
        }}
      />
    </ChartPageRoot>
  );
}

async function generateXlsx(
  patientId: string,
  queryClient: QueryClient,
): Promise<ExcelJS.Workbook> {
  const patient = await queryClient.fetchQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientDetail(patientId),
  });
  const latestPatientData = await queryClient.fetchQuery({
    queryKey: ["patientData", patientId],
    queryFn: () => getLatestPatientData(patientId),
  });

  const treatmentList = await queryClient.fetchQuery({
    queryKey: ["treatment"],
    queryFn: () => getTreatmentList(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const instrumentList = await queryClient.fetchQuery({
    queryKey: ["instrument"],
    queryFn: () => getInstrumentList(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const refractiveErrorMethodList = await queryClient.fetchQuery({
    queryKey: ["refractive_error_method"],
    queryFn: () => getRefractiveErrorMethodList(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  console.log(treatmentList);
  console.log(instrumentList);
  console.log(refractiveErrorMethodList);

  const workbook = new ExcelJS.Workbook();
  const axialLengthWorksheet = workbook.addWorksheet("axial_length");
  axialLengthWorksheet.columns = [
    { header: "Date", key: "date" },
    { header: "instrument", key: "instrument" },
    { header: "OD", key: "od" },
    { header: "OS", key: "os" },
  ];
  patient.measurement.forEach((measurement: any) => {
    axialLengthWorksheet.addRow({
      date: measurement.date,
      instrument:
        instrumentList.find(
          (instrument: any) => instrument.id === measurement.instrument_id,
        )?.name ?? "",
      od: measurement.od,
      os: measurement.os,
    });
  });
  const refractiveErrorWorksheet = workbook.addWorksheet("refractive_error");
  refractiveErrorWorksheet.columns = [
    { header: "Date", key: "date" },
    { header: "method", key: "method" },
    { header: "OD(Sph)", key: "od_sph" },
    { header: "OD(Cyl)", key: "od_cyl" },
    { header: "OD(SE)", key: "od_se" },
    { header: "OS(Sph)", key: "os_sph" },
    { header: "OS(Cyl)", key: "os_cyl" },
    { header: "OS(SE)", key: "os_se" },
  ];
  patient.refractive_error.forEach((refractiveError: any) => {
    refractiveErrorWorksheet.addRow({
      date: refractiveError.date,
      method:
        refractiveErrorMethodList.find(
          (method: any) => method.id === refractiveError.method_id,
        )?.name ?? "",
      od_sph: refractiveError.od_sph ?? "",
      od_cyl: refractiveError.od_cyl ?? "",
      od_se: refractiveError.od_sph
        ? refractiveError.od_sph + (refractiveError.od_cyl ?? 0) * 0.5
        : "",
      os_sph: refractiveError.os_sph ?? "",
      os_cyl: refractiveError.os_cyl ?? "",
      os_se: refractiveError.os_sph
        ? refractiveError.os_sph + (refractiveError.os_cyl ?? 0) * 0.5
        : "",
    });
  });

  const treatmentWorksheet = workbook.addWorksheet("treatment");
  treatmentWorksheet.columns = [
    { header: "treatment", key: "treatment" },
    { header: "start_date", key: "start_date" },
    { header: "end_date", key: "end_date" },
  ];
  patient.patient_treatment.forEach((patientTreatment: any) => {
    treatmentWorksheet.addRow({
      treatment:
        treatmentList.find(
          (treatment: any) => treatment.id === patientTreatment.treatment_id,
        )?.name ?? "",
      start_date: patientTreatment.start_date.split("T")[0],
      end_date: patientTreatment.end_date?.split("T")[0] ?? "",
    });
  });

  const patientDataWorksheet = workbook.addWorksheet("patient_data");
  patientDataWorksheet.columns = [
    { header: "key", key: "key" },
    { header: "value", key: "value" },
  ];
  patientDataWorksheet.addRow({
    key: "hospital",
    value: patient.hospital.name,
  });
  patientDataWorksheet.addRow({
    key: "registration_number",
    value: patient.registration_number,
  });
  patientDataWorksheet.addRow({
    key: "date_of_birth",
    value: patient.date_of_birth.split("T")[0],
  });
  patientDataWorksheet.addRow({
    key: "sex",
    value: patient.sex,
  });
  patientDataWorksheet.addRow({
    key: "ethnicity",
    value: patient.ethnicity.name,
  });

  patientDataWorksheet.addRow({
    key: "nearwork_activity",
    value: latestPatientData.nearwork_activity
      ? ACTIVITY_LABELS[latestPatientData.nearwork_activity.category]
      : "(unknown)",
  });
  patientDataWorksheet.addRow({
    key: "outdoor_activity",
    value: latestPatientData.outdoor_activity
      ? ACTIVITY_LABELS[latestPatientData.outdoor_activity.category]
      : "(unknown)",
  });
  patientDataWorksheet.addRow({
    key: "mother_myopia_status",
    value: latestPatientData.mother_myopia_status
      ? MYOPIA_STATUS_LABELS[latestPatientData.mother_myopia_status.status]
      : "(unknown)",
  });
  patientDataWorksheet.addRow({
    key: "father_myopia_status",
    value: latestPatientData.father_myopia_status
      ? MYOPIA_STATUS_LABELS[latestPatientData.father_myopia_status.status]
      : "(unknown)",
  });
  patientDataWorksheet.addRow({
    key: "K1(OD)",
    value: patient.patient_k.find((k: any) => k.k_type === "K1")?.od ?? "",
  });
  patientDataWorksheet.addRow({
    key: "K1(OS)",
    value: patient.patient_k.find((k: any) => k.k_type === "K1")?.os ?? "",
  });
  patientDataWorksheet.addRow({
    key: "K2(OD)",
    value: patient.patient_k.find((k: any) => k.k_type === "K2")?.od ?? "",
  });
  patientDataWorksheet.addRow({
    key: "K2(OS)",
    value: patient.patient_k.find((k: any) => k.k_type === "K2")?.os ?? "",
  });

  return workbook;
}
