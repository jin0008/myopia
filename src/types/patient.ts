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
  };
  father_myopia_status: {
    status: MyopiaStatus;
  };
};
