import { jsonFetch, jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";
import type { EditMemberData } from "../types/hospital";

/** 병원 고르는 자리에서 쓰는 최소 정보. 두 어드민 화면이 같은 목록을
 *  쓰므로 반환값 옆에 한 번만 적는다. */
export interface HospitalListItem {
  id: string;
  name: string;
}

// 반환 타입은 붙이지 않는다. 이 함수를 쓰는 다른 화면들이 any 로 받아
// 쓰고 있어, 좁히면 그쪽이 줄줄이 터진다 - 그 정리는 따로 할 일이다.
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
