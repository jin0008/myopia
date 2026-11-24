import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type Base = "BI" | "BO" | "BU" | "BD";

/** 한 묶음(원용 또는 근용)의 양안 값. 서버 필드 이름 그대로. */
export interface EyeRx {
  sph_od: number | null;
  sph_os: number | null;
  cyl_od: number | null;
  cyl_os: number | null;
  axis_od: number | null;
  axis_os: number | null;
  prism_od: number | null;
  prism_os: number | null;
  base_od: Base | null;
  base_os: Base | null;
}

export interface Prescription {
  id: string;
  patient_id: string;
  prescriber_name: string;
  prescriber_license: string | null;
  prescribed_on: string;
  far: EyeRx;
  near: EyeRx;
  pd_far: number | null;
  pd_near: number | null;
  add_od: number | null;
  add_os: number | null;
  note: string | null;
  remark_tags: string[];
  created_at: string;
}

export interface PrescriptionListItem extends Prescription {
  registration_number: string;
  sex: "male" | "female";
}

export interface PrescriptionDetail extends Prescription {
  patient: { registration_number: string; date_of_birth: string; sex: "male" | "female"; linked: boolean };
  hospital: { name: string; address: string | null; phone: string | null };
}

export interface NewPrescription {
  registration_number: string;
  date_of_birth: string;
  sex: "male" | "female";
  prescribed_on: string;
  far: Partial<EyeRx>;
  near: Partial<EyeRx>;
  pd_far: number | null;
  pd_near: number | null;
  add_od: number | null;
  add_os: number | null;
  note: string | null;
  remark_tags: string[];
  prescriber_name?: string;
  prescriber_license?: string | null;
}

export interface IssueResult {
  prescription: Prescription;
  patient_created: boolean;
  invite: { url: string; expires_at: string } | null;
}

export type LookupResult =
  | { exists: false }
  | { exists: true; patient: { id: string; date_of_birth: string; sex: "male" | "female"; linked: boolean } };

export const lookupPatient = (registration_number: string) =>
  jsonFetchWithSession<LookupResult>(API_ROOT + "/patient/prescriptions/lookup", { method: "POST" }, { registration_number });

export const issuePrescription = (data: NewPrescription) =>
  jsonFetchWithSession<IssueResult>(API_ROOT + "/patient/prescriptions", { method: "POST" }, data);

export const listPrescriptions = (patientId?: string) =>
  jsonFetchWithSession<PrescriptionListItem[]>(
    API_ROOT + "/patient/prescriptions" + (patientId ? `?patient_id=${encodeURIComponent(patientId)}` : ""),
    { method: "GET" },
  );

export const getPrescription = (id: string) =>
  jsonFetchWithSession<PrescriptionDetail>(API_ROOT + "/patient/prescriptions/" + encodeURIComponent(id), { method: "GET" });

/** 병원별 양식. 모양은 routes/prescription/doc.tsx 의 RxSettings. 없으면 null. */
export const getRxSettings = () =>
  jsonFetchWithSession<{ settings: unknown | null }>(API_ROOT + "/patient/prescriptions/settings", { method: "GET" });

export const saveRxSettings = (settings: unknown) =>
  jsonFetchWithSession(API_ROOT + "/patient/prescriptions/settings", { method: "PUT" }, { settings }, false);
