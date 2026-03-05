export type PatientKInput = {
  patient_id: string;
  k_type: "K1" | "K2";
  od: number | null;
  os: number | null;
};
