export enum ActivityDurationCategory {
  ZeroToOne = "zero_to_one",
  OneToTwo = "one_to_two",
  TwoToFour = "two_to_four",
  FourToSix = "four_to_six",
  SixToEight = "six_to_eight",
  EightToInfinity = "eight_to_infinity",
}

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
    category: ActivityDurationCategory;
  };
  outdoor_activity: {
    category: ActivityDurationCategory;
  };
  mother_myopia_status: {
    status: MyopiaStatus;
  };
  father_myopia_status: {
    status: MyopiaStatus;
  };
};
