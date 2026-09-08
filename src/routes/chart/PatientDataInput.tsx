import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLatestPatientData,
  getPatientDataHistory,
  postPatientData,
  type ActivityRow,
} from "../../api/patient";
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
import styled from "styled-components";

/** 최근 몇 줄만. 전부 늘어놓으면 차트가 목록에 파묻힌다. */
const HISTORY_ROWS = 6;

/** 어디서 온 값인지. 보호자가 적은 것과 진료에서 넣은 것은 믿을 만한
 *  정도가 다르고, 그걸 화면이 감추면 안 된다. */
function sourceLabel(source?: string | null): string {
  if (source === "parent") return "app";
  if (source === "clinic") return "clinic";
  return "";
}

function ActivityHistory({ rows }: { rows?: ActivityRow[] }) {
  if (rows == null || rows.length === 0) return null;
  // 같은 값이 병원 수만큼 겹쳐 오므로 (날짜, 시간)이 같으면 한 줄로 친다.
  const seen = new Set<string>();
  const unique = [...rows]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .filter((r) => {
      const key = `${r.timestamp}|${r.hours ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return (
    <HistoryBox>
      <HistoryTitle>
        Records ({unique.length})
      </HistoryTitle>
      {unique.slice(0, HISTORY_ROWS).map((r) => (
        <HistoryRow key={r.id}>
          <span>
            {r.timestamp.slice(0, 10)}
            {sourceLabel(r.source) && <Tag>{sourceLabel(r.source)}</Tag>}
          </span>
          <b>{r.hours == null ? "unknown" : `${r.hours} h/day`}</b>
        </HistoryRow>
      ))}
      {unique.length > HISTORY_ROWS && (
        <HistoryMore>+{unique.length - HISTORY_ROWS} more</HistoryMore>
      )}
    </HistoryBox>
  );
}

const HistoryBox = styled.div`
  margin: 10px 24px 0;
  padding: 10px 12px;
  background: #f6f7f9;
  border-radius: 8px;
`;
const HistoryTitle = styled.p`
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #555;
`;
const HistoryRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: #333;
  padding: 3px 0;
`;
/** 보호자가 앱에서 적은 도수. 아는 사람만 적으므로 대개 비어 있다. */
function SphLine({ sph }: { sph: { od: number | null; os: number | null } }) {
  if (sph.od == null && sph.os == null) return null;
  const fmt = (v: number | null) => (v == null ? "—" : v.toFixed(2));
  return (
    <SphBox>
      Sph OD {fmt(sph.od)} / OS {fmt(sph.os)} D<Tag>app</Tag>
    </SphBox>
  );
}

const SphBox = styled.p`
  margin: 8px 0 0;
  font-size: 12.5px;
  color: #444;
`;
const Tag = styled.span`
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #e6efff;
  color: #1a73e8;
  font-size: 11px;
  font-weight: 700;
`;
const HistoryMore = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  color: #888;
`;

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
  /** 보호자가 앱에서 적은 도수. 여기서는 보여 주기만 하고 고치지 않지만,
   *  저장할 때 함께 돌려보내야 새 행에서 사라지지 않는다. */
  mother_sph: { od: number | null; os: number | null };
  father_sph: { od: number | null; os: number | null };
};

function toFormState(data: Nullable<PatientData> | null): PatientDataFormState {
  if (!data) {
    return {
      nearwork_activity: null,
      outdoor_activity: null,
      mother_myopia_status: null,
      father_myopia_status: null,
      mother_sph: { od: null, os: null },
      father_sph: { od: null, os: null },
    };
  }
  return {
    nearwork_activity: data.nearwork_activity?.hours ?? null,
    outdoor_activity: data.outdoor_activity?.hours ?? null,
    mother_myopia_status: data.mother_myopia_status?.status ?? null,
    father_myopia_status: data.father_myopia_status?.status ?? null,
    mother_sph: {
      od: data.mother_myopia_status?.sph_od ?? null,
      os: data.mother_myopia_status?.sph_os ?? null,
    },
    father_sph: {
      od: data.father_myopia_status?.sph_od ?? null,
      os: data.father_myopia_status?.sph_os ?? null,
    },
  };
}

/** 도수는 여기서 고치지 않는다(보여 주고 그대로 돌려보낼 뿐). 비교에
 *  넣으면 바뀐 것이 없는데 저장 버튼이 켜진다. */
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

  // 슬라이더는 현재값 하나만 보여 준다. 보호자가 앱에서 며칠에 걸쳐 적은
  // 것이 있으면 그것도 보여야, 진료에서 "요즘 어떻게 지냈나"를 물을 때
  // 기억에만 기대지 않는다.
  const historyQuery = useQuery({
    queryKey: ["patientDataHistory", patientId],
    queryFn: () => getPatientDataHistory(patientId),
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
        // 도수를 함께 돌려보낸다. 저장은 새 행을 만드는 방식이라, 빼고
        // 보내면 보호자가 적은 도수가 새 행에서 비어 화면에서 사라진다.
        mother_myopia_status: formState.mother_myopia_status
          ? {
              status: formState.mother_myopia_status,
              sph_od: formState.mother_sph.od,
              sph_os: formState.mother_sph.os,
            }
          : undefined,
        father_myopia_status: formState.father_myopia_status
          ? {
              status: formState.father_myopia_status,
              sph_od: formState.father_sph.od,
              sph_os: formState.father_sph.os,
            }
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
        <ActivityHistory rows={historyQuery.data?.nearwork_activity} />
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
        <ActivityHistory rows={historyQuery.data?.outdoor_activity} />
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
        <SphLine sph={formState.mother_sph} />
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
        <SphLine sph={formState.father_sph} />
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
