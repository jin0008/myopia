export type HospitalSummary = {
  id: string;
  /** 가입 때 입력한 원래 이름 */
  name: string;
  /** 한글 표시 이름. 없으면 null */
  name_ko?: string | null;
  code: string;
  country?: {
    id?: string;
    name: string;
    code: string;
  };
  patientCount: number;
};

export type EditMemberData = {
  approved?: true;
  is_admin?: true;
};
