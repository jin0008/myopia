import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getPatientDetail } from "../../api/patient";
import { TreatmentListHeader, TreatmentCardDiv } from "./styles";

const LENS_NAME: Record<string, string> = {
  miyosmart: "MiYOSMART",
  stellest: "Stellest",
  myovision: "MyoVision",
  single_vision: "Single vision",
  other: "Other",
};

type Prescription = {
  id: string;
  prescribed_on: string;
  sph_od: number | null;
  sph_os: number | null;
  cyl_od: number | null;
  cyl_os: number | null;
  axis_od: number | null;
  axis_os: number | null;
  lens_type: string;
  memo: string | null;
};

const d = (v: number | null) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}`;
const eye = (sph: number | null, cyl: number | null, axis: number | null) =>
  `S ${d(sph)} C ${d(cyl)}${axis != null ? ` × ${axis}` : ""}`;

/**
 * 보호자가 앱(마이오닥)에 적은 안경 처방전과 안경 종류.
 *
 * 읽기만 한다. 보호자가 옮겨 적은 값이라 의사가 고치면 원본이 둘이 된다.
 * 어떤 안경을 언제부터 썼는지를 진행 그래프 옆에서 보려는 자리다.
 */
export function PrescriptionList() {
  const { patientId } = useParams<{ patientId: string }>();
  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientDetail(patientId as string),
    enabled: !!patientId,
  });
  const rows: Prescription[] = patientQuery.data?.parent_prescription ?? [];

  return (
    <div>
      <TreatmentListHeader>
        <h1 style={{ fontWeight: "normal" }}>Glasses (entered by parent)</h1>
      </TreatmentListHeader>
      {rows.length === 0
        ? "No Data"
        : rows.map((p) => (
            <TreatmentCardDiv key={p.id}>
              <div>
                <h3>{LENS_NAME[p.lens_type] ?? p.lens_type}</h3>
                <p>
                  {p.prescribed_on.split("T")[0]} · OD{" "}
                  {eye(p.sph_od, p.cyl_od, p.axis_od)} · OS{" "}
                  {eye(p.sph_os, p.cyl_os, p.axis_os)}
                </p>
                {p.memo && <p>{p.memo}</p>}
              </div>
            </TreatmentCardDiv>
          ))}
    </div>
  );
}
