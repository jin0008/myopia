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
  /** 사이트 관리자에게만 온다. */
  pendingCount?: number;
  /** 사이트 관리자에게만 온다. 그 병원의 승인된 admin 과 연락 이메일. */
  admins?: { name: string; email: string | null }[];
};

export type EditMemberData = {
  approved?: true;
  is_admin?: true;
};
