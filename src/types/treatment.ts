export type Treatment = {
  patient_id: string;
  treatment_id: string;
  start_date: string;
  end_date: string | null;
};

export type TreatmentEdit = {
  treatment_id: string;
  start_date: string;
  end_date: string | null;
};

export interface TreatmentData {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  mechanism: string;
  efficacy: string;
  imageUrl: string;
}
