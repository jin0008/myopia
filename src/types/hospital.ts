export type HospitalSummary = {
  id: string;
  name: string;
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
