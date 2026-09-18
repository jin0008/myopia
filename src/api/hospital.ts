import { jsonFetch, jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import type { EditMemberData } from "../types/hospital";

export function getHospitalList() {
  return jsonFetch(API_ROOT + "/hospital");
}

export function getMembers() {
  return jsonFetchWithSession(API_ROOT + "/hospital/healthcare_professional");
}

export function getMembersByHospital(hospitalId: string) {
  return jsonFetchWithSession(
    API_ROOT + `/hospital/${hospitalId}/healthcare_professional`
  );
}

export function deleteMember(userId: string) {
  return jsonFetchWithSession(
    API_ROOT + `/hospital/healthcare_professional/${userId}`,
    {
      method: "DELETE",
    },
    undefined,
    false
  );
}

export function editMember(userId: string, data: EditMemberData) {
  return jsonFetchWithSession(
    API_ROOT + `/hospital/healthcare_professional/${userId}`,
    {
      method: "PATCH",
    },
    data,
    false
  );
}

/** 병원 관리자: 자기 병원의 한글 표시 이름. 빈 값이면 지운다. */
export function updateMyHospitalNameKo(nameKo: string | null) {
  return jsonFetchWithSession(API_ROOT + "/hospital/name_ko", {
    method: "PATCH",
  }, { name_ko: nameKo });
}

/** 사이트 관리자: 아무 병원의 한글 표시 이름. 빈 값이면 지운다. */
export function updateHospitalNameKo(hospitalId: string, nameKo: string | null) {
  return jsonFetchWithSession(API_ROOT + `/hospital/${hospitalId}/name_ko`, {
    method: "PATCH",
  }, { name_ko: nameKo });
}
