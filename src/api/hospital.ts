import { jsonFetch, jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export type Hospital = {
  id: string;
  name: string;
  code: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
  patientCount: number;
};

export function getHospitalList() {
  return jsonFetch(API_ROOT + "/hospital") as Promise<Hospital[]>;
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

export type EditMemberData = {
  approved?: true;
  is_admin?: true;
};

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
