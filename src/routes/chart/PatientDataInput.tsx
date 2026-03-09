import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLatestPatientData, postPatientData } from "../../api/patient";
import { PrimaryButton } from "../../components/button";
import type { Nullable } from "../../types/util";
import type { PatientData } from "../../types/patient";
import { type MyopiaStatus } from "../../types/patient";
import theme from "../../theme";
import {
  PatientDataHeader,
  PatientDataSection,
  PatientDataGrid,
  PatientDataField,
  PatientDataFieldLabel,
  RadioGroup,
  RadioField,
} from "./styles";
import { Slider } from "@mui/material";

export const MYOPIA_STATUS_LABELS: Record<MyopiaStatus, string> = {
  myopia: "Myopia",
  high_myopia: "High myopia",
  emmetropia: "Emmetropia",
  hyperopia: "Hyperopia",
};

type PatientDataFormState = {
  nearwork_activity: number | null;
  outdoor_activity: number | null;
  mother_myopia_status: MyopiaStatus | null;
  father_myopia_status: MyopiaStatus | null;
};

function toFormState(data: Nullable<PatientData> | null): PatientDataFormState {
  if (!data) {
    return {
      nearwork_activity: null,
      outdoor_activity: null,
      mother_myopia_status: null,
      father_myopia_status: null,
    };
  }
  return {
    nearwork_activity: data.nearwork_activity?.hours ?? null,
    outdoor_activity: data.outdoor_activity?.hours ?? null,
    mother_myopia_status: data.mother_myopia_status?.status ?? null,
    father_myopia_status: data.father_myopia_status?.status ?? null,
  };
}

function formStateEqual(a: PatientDataFormState, b: PatientDataFormState) {
  return (
    a.nearwork_activity === b.nearwork_activity &&
    a.outdoor_activity === b.outdoor_activity &&
    a.mother_myopia_status === b.mother_myopia_status &&
    a.father_myopia_status === b.father_myopia_status
  );
}

interface PatientDataInputProps {
  patientId: string;
  edit: boolean;
}

export function PatientDataInput({ patientId, edit }: PatientDataInputProps) {
  const queryClient = useQueryClient();
  const patientDataQuery = useQuery({
    queryKey: ["patientData", patientId],
    queryFn: () => getLatestPatientData(patientId),
    enabled: !!patientId,
  });

  const initialFormState = useMemo(
    () => toFormState(patientDataQuery.data ?? null),
    [patientDataQuery.data],
  );

  const [formState, setFormState] =
    useState<PatientDataFormState>(initialFormState);

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  const hasChanges = !formStateEqual(formState, initialFormState);

  const saveMutation = useMutation({
    mutationFn: () =>
      postPatientData(patientId, {
        nearwork_activity: formState.nearwork_activity
          ? { hours: formState.nearwork_activity }
          : undefined,
        outdoor_activity: formState.outdoor_activity
          ? { hours: formState.outdoor_activity }
          : undefined,
        mother_myopia_status: formState.mother_myopia_status
          ? { status: formState.mother_myopia_status }
          : undefined,
        father_myopia_status: formState.father_myopia_status
          ? { status: formState.father_myopia_status }
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientData", patientId] });
    },
    onError: () => {
      alert("Failed to save patient data");
    },
  });

  const myopiaStatuses: MyopiaStatus[] = [
    "myopia",
    "high_myopia",
    "emmetropia",
    "hyperopia",
  ];

  const RadioFieldset = <T extends string>({
    value,
    options,
    labels,
    onChange,
    showUnknown = true,
  }: {
    value: T | null;
    options: readonly T[];
    labels: Record<T, string>;
    onChange: (v: T | null) => void;
    showUnknown?: boolean;
  }) => (
    <RadioGroup>
      {options.map((opt) => (
        <RadioField key={opt}>
          <input
            type="radio"
            checked={value === opt}
            onChange={() => onChange(opt)}
          />
          {labels[opt]}
        </RadioField>
      ))}
      {showUnknown && (
        <RadioField key="none">
          <input
            type="radio"
            checked={value === null}
            onChange={() => onChange(null)}
          />
          unknown
        </RadioField>
      )}
    </RadioGroup>
  );

  const content = (
    <>
      <PatientDataField>
        <PatientDataFieldLabel>Nearwork activity</PatientDataFieldLabel>
        <div style={{ padding: "0 24px" }}>
          <HoursSlider
            showUnknown={initialFormState.nearwork_activity === null}
            value={formState.nearwork_activity}
            onChange={(v) =>
              setFormState((s) => ({
                ...s,
                nearwork_activity: v,
              }))
            }
          />
        </div>
      </PatientDataField>
      <PatientDataField>
        <PatientDataFieldLabel>Outdoor activity</PatientDataFieldLabel>
        <div style={{ padding: "0 24px" }}>
          <HoursSlider
            showUnknown={initialFormState.outdoor_activity === null}
            value={formState.outdoor_activity}
            onChange={(v) =>
              setFormState((s) => ({
                ...s,
                outdoor_activity: v,
              }))
            }
          />
        </div>
      </PatientDataField>
      <PatientDataField>
        <PatientDataFieldLabel>Mother myopia status</PatientDataFieldLabel>
        <RadioFieldset
          value={formState.mother_myopia_status}
          options={myopiaStatuses}
          labels={MYOPIA_STATUS_LABELS}
          onChange={(v) =>
            setFormState((s) => ({
              ...s,
              mother_myopia_status: v,
            }))
          }
          showUnknown={initialFormState.mother_myopia_status === null}
        />
      </PatientDataField>
      <PatientDataField>
        <PatientDataFieldLabel>Father myopia status</PatientDataFieldLabel>
        <RadioFieldset
          value={formState.father_myopia_status}
          options={myopiaStatuses}
          labels={MYOPIA_STATUS_LABELS}
          onChange={(v) =>
            setFormState((s) => ({
              ...s,
              father_myopia_status: v,
            }))
          }
          showUnknown={initialFormState.father_myopia_status === null}
        />
      </PatientDataField>
    </>
  );

  return (
    <div>
      <PatientDataHeader>
        <h1 style={{ fontWeight: "normal" }}>Patient data</h1>
        {hasChanges && edit && (
          <PrimaryButton
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </PrimaryButton>
        )}
      </PatientDataHeader>
      <PatientDataSection>
        <PatientDataGrid>{content}</PatientDataGrid>
      </PatientDataSection>
    </div>
  );
}

function HoursSlider({
  value,
  onChange,
  showUnknown = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  showUnknown?: boolean;
}) {
  return (
    <Slider
      min={showUnknown ? 0 : 1}
      max={12}
      step={1}
      value={value ?? 0}
      valueLabelDisplay="auto"
      marks={[
        ...(showUnknown ? [{ value: 0, label: "unknown" }] : []),
        { value: 3, label: "3 h/day" },
        { value: 6, label: "6 h/day" },
        { value: 9, label: "9 h/day" },
        { value: 12, label: "12 h/day" },
      ]}
      track={false}
      onChange={(_, value) => onChange(value === 0 ? null : value)}
      sx={{
        color: theme.primary,
      }}
    />
  );
}
