export interface Measurement {
  id: string;
  date: string;
  od: number | null;
  os: number | null;
}

export interface AxialLength {
  id: string;
  date: string;
  instrument_id: string;
  od: number | null;
  os: number | null;
}

export interface RefractiveError {
  id: string;
  date: string;
  method_id: number;
  od_sph: number | null;
  os_sph: number | null;
  od_cyl: number | null;
  os_cyl: number | null;
}

export type RegisterRefractiveErrorData = {
  patient_id: string;
  date: string;
  method_id: number;
  od_sph: number | null;
  os_sph: number | null;
  od_cyl: number | null;
  os_cyl: number | null;
};

export type RegisterAxialLengthData = {
  patient_id: string;
  date: string;
  instrument_id: string;
  od: number | null;
  os: number | null;
};
