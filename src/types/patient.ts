export type NewPatientInput = {
  registration_number: string;
  date_of_birth: string;
  sex: "male" | "female";
  ethnicity_id: string;
  email?: string;
};

export type UpdatePatientInput = {
  id: string;
  date_of_birth?: string;
  sex?: "male" | "female";
};

export type MyopiaStatus =
  | "myopia"
  | "high_myopia"
  | "emmetropia"
  | "hyperopia";

export type PatientData = {
  nearwork_activity: {
    hours: number;
  };
  outdoor_activity: {
    hours: number;
  };
  mother_myopia_status: {
    status: MyopiaStatus;
    /** 도수(구면, D). 보호자가 앱에서 적는다. 모르면 비어 있다. */
    sph_od?: number | null;
    sph_os?: number | null;
  };
  father_myopia_status: {
    status: MyopiaStatus;
    sph_od?: number | null;
    sph_os?: number | null;
  };
};
