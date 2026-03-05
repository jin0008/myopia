import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLatestPatientData, postPatientData } from "../../api/patient";
import { PrimaryButton } from "../../components/button";
import type { Nullable } from "../../types/util";
import type { PatientData } from "../../types/patient";
import {
  ActivityDurationCategory,
  type MyopiaStatus,
} from "../../types/patient";
import {
  PatientDataHeader,
  PatientDataSection,
  PatientDataGrid,
  PatientDataField,
  PatientDataFieldLabel,
  RadioGroup,
  RadioField,
} from "./styles";

export const ACTIVITY_LABELS: Record<ActivityDurationCategory, string> = {
  [ActivityDurationCategory.ZeroToOne]: "0–1 h/day",
  [ActivityDurationCategory.OneToTwo]: "1–2 h/day",
  [ActivityDurationCategory.TwoToFour]: "2–4 h/day",
  [ActivityDurationCategory.FourToSix]: "4–6 h/day",
  [ActivityDurationCategory.SixToEight]: "6–8 h/day",
  [ActivityDurationCategory.EightToInfinity]: "8+ h/day",
};

export const MYOPIA_STATUS_LABELS: Record<MyopiaStatus, string> = {
  myopia: "Myopia",
  high_myopia: "High myopia",
  emmetropia: "Emmetropia",
  hyperopia: "Hyperopia",
};

type PatientDataFormState = {
  nearwork_activity: ActivityDurationCategory | null;
  outdoor_activity: ActivityDurationCategory | null;
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
    nearwork_activity: data.nearwork_activity?.category ?? null,
    outdoor_activity: data.outdoor_activity?.category ?? null,
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
          ? { category: formState.nearwork_activity }
          : undefined,
        outdoor_activity: formState.outdoor_activity
          ? { category: formState.outdoor_activity }
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

  const activityCategories = Object.values(ActivityDurationCategory);
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
        <RadioFieldset
          value={formState.nearwork_activity}
          options={activityCategories}
          labels={ACTIVITY_LABELS}
          onChange={(v) =>
            setFormState((s) => ({
              ...s,
              nearwork_activity: v,
            }))
          }
          showUnknown={initialFormState.nearwork_activity === null}
        />
      </PatientDataField>
      <PatientDataField>
        <PatientDataFieldLabel>Outdoor activity</PatientDataFieldLabel>
        <RadioFieldset
          value={formState.outdoor_activity}
          options={activityCategories}
          labels={ACTIVITY_LABELS}
          onChange={(v) =>
            setFormState((s) => ({
              ...s,
              outdoor_activity: v,
            }))
          }
          showUnknown={initialFormState.outdoor_activity === null}
        />
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
