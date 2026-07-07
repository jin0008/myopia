import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export interface Study {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
  _count?: { study_hospital: number };
}

export interface StudyInput {
  name: string;
  code?: string;
  description?: string;
}

/* ---- site-admin: study master + hospital assignment ---- */

export function getStudies() {
  return jsonFetchWithSession<Study[]>(API_ROOT + "/study/admin");
}

export function createStudy(data: StudyInput) {
  return jsonFetchWithSession<Study>(
    API_ROOT + "/study/admin",
    { method: "POST" },
    data,
  );
}

export function updateStudy(
  studyId: string,
  data: Partial<StudyInput> & { active?: boolean },
) {
  return jsonFetchWithSession<Study>(
    API_ROOT + `/study/admin/${studyId}`,
    { method: "PATCH" },
    data,
  );
}

export function deleteStudy(studyId: string) {
  return jsonFetchWithSession(
    API_ROOT + `/study/admin/${studyId}`,
    { method: "DELETE" },
    undefined,
    false,
  );
}

export function getStudyHospitals(studyId: string) {
  return jsonFetchWithSession<string[]>(
    API_ROOT + `/study/admin/${studyId}/hospital`,
  );
}

export function setStudyHospitals(studyId: string, hospitalIds: string[]) {
  return jsonFetchWithSession(
    API_ROOT + `/study/admin/${studyId}/hospital`,
    { method: "PUT" },
    { hospital_ids: hospitalIds },
    false,
  );
}

/* ---- professional: available studies + enrollment ---- */

export interface AvailableStudy {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
}

export function getAvailableStudies() {
  return jsonFetchWithSession<AvailableStudy[]>(API_ROOT + "/study/available");
}

export interface Enrollment {
  id: string;
  study_id: string;
  patient_id: string;
  enrolled_at: string;
  status: string;
  study: { id: string; name: string; code: string | null };
}

export function getEnrollments(patientId: string) {
  return jsonFetchWithSession<Enrollment[]>(
    API_ROOT + `/study/enrollment?patient_id=${encodeURIComponent(patientId)}`,
  );
}

export function enrollPatient(studyId: string, patientId: string) {
  return jsonFetchWithSession<Enrollment>(
    API_ROOT + "/study/enrollment",
    { method: "POST" },
    { study_id: studyId, patient_id: patientId },
  );
}

/* ---- study visit (data entry) ---- */

export interface EnrollmentDetail {
  id: string;
  study: { id: string; name: string; code: string | null };
  patient_id: string;
  enrolled_at: string;
  visits: any[];
}

export function getEnrollment(enrollmentId: string) {
  return jsonFetchWithSession<EnrollmentDetail>(
    API_ROOT + `/study/enrollment/${enrollmentId}`,
  );
}

export interface VisitInput {
  visit_date: string;
  va_od?: number | null;
  va_os?: number | null;
  bcva_od?: number | null;
  bcva_os?: number | null;
  refraction_method?: "Auto" | "MR" | "CR" | null;
  ref_od_sph?: number | null;
  ref_od_cyl?: number | null;
  ref_od_axis?: number | null;
  ref_os_sph?: number | null;
  ref_os_cyl?: number | null;
  ref_os_axis?: number | null;
  slitlamp_od_normal?: boolean | null;
  slitlamp_od_finding?: string | null;
  slitlamp_os_normal?: boolean | null;
  slitlamp_os_finding?: string | null;
  iop_od?: number | null;
  iop_os?: number | null;
  accom_od?: number | null;
  accom_os?: number | null;
  axial_length?: {
    measurement_id?: string | null;
    instrument_id?: string | null;
    od?: number | null;
    os?: number | null;
  } | null;
  concomitant_meds?: string | null;
  adverse_event?: string | null;
}

export function createVisit(enrollmentId: string, data: VisitInput) {
  return jsonFetchWithSession(
    API_ROOT + `/study/enrollment/${enrollmentId}/visit`,
    { method: "POST" },
    data,
  );
}

export function updateVisit(
  enrollmentId: string,
  visitId: string,
  data: VisitInput,
) {
  return jsonFetchWithSession(
    API_ROOT + `/study/enrollment/${enrollmentId}/visit/${visitId}`,
    { method: "PATCH" },
    data,
  );
}

export function deleteVisit(enrollmentId: string, visitId: string) {
  return jsonFetchWithSession(
    API_ROOT + `/study/enrollment/${enrollmentId}/visit/${visitId}`,
    { method: "DELETE" },
    undefined,
    false,
  );
}
