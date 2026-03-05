export type RegisterData = {
  name: string;
  country_id: string;
  hospital:
    | {
        id: string;
      }
    | {
        name: string;
        country_id: string;
        code: string;
      };
  role: string;
  default_ethnicity_id: string | null;
  default_instrument_id: string | null;
};

export type UpdateData = {
  default_ethnicity_id?: string | null;
  default_instrument_id?: string | null;
  role?: string;
};

export type EditMemberAdminData = {
  approved?: boolean;
  is_admin?: boolean;
};
