import styled from "styled-components";
import theme from "../theme";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPatientDetail } from "../api/patient";
import { useEffect, useMemo, useRef, useState } from "react";
import autocolors from "chartjs-plugin-autocolors";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import { getGrowthData } from "../api/growth_data";
import ordinal from "ordinal";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import { TextInput } from "../components/input";
import { getInstrumentList } from "../api/static";
import { registerMeasurement } from "../api/measurement";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  autocolors
);

const HeaderTextDiv = styled.div`
  background-color: ${theme.primary};
  width: 320px;
  color: white;
  padding: 8px 0;
  text-align: center;
  border-radius: 8px;
`;

const HeaderDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 32px 64px 0;
`;

const ContentDiv = styled.div`
  margin: 0 96px;
`;

const ChartTitleDiv = styled.div`
  font-size: large;
  margin-top: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e6e6e6;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const TextButton = styled.button`
  text-align: center;
  background-color: white;
  border: 1px solid lightgray;
  border-radius: 20px;
  padding: 12px 24px;
  font-weight: normal;
`;

export default function ChartRoute() {
  const { patientId } = useParams<{ patientId: string }>();

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientDetail(patientId as string),
    enabled: !!patientId,
  });

  if (!patientQuery.data) return <div>Loading...</div>;

  return (
    <div>
      <HeaderDiv>
        <HeaderTextDiv>
          ID:{patientQuery.data.registration_number}
        </HeaderTextDiv>

        <HeaderTextDiv>{patientQuery.data.hospital.name}</HeaderTextDiv>
      </HeaderDiv>
      <ContentDiv>
        <ChartTitleDiv>
          <h1
            style={{
              fontWeight: "normal",
            }}
          >
            Eye growth chart
          </h1>
          <span>{new Date().toLocaleDateString()}</span>
          <div />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "16px",
            }}
          >
            <TextButton>Default</TextButton>
            <TextButton>List view</TextButton>
          </div>
        </ChartTitleDiv>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              flexGrow: 1,
              width: 0,
            }}
          >
            <Chart
              measurement={patientQuery.data.measurement}
              patientBirthday={new Date(patientQuery.data.date_of_birth)}
            />
          </div>
          <div
            style={{
              margin: "0 16px",
            }}
          >
            <MeasurementList measurement={patientQuery.data.measurement} />
          </div>
        </div>
      </ContentDiv>
    </div>
  );
}

function Chart({
  measurement,
  patientBirthday,
}: {
  measurement: any[];
  patientBirthday: Date;
}) {
  const growthData = useQuery<any[]>({
    queryKey: ["growthData"],
    queryFn: getGrowthData,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const dataSet = useMemo(() => {
    if (!growthData.data) return [];

    const grouped: Map<number, any[]> = new Map();
    growthData.data.forEach((e) => {
      if (!grouped.has(e.percentile)) grouped.set(e.percentile, []);
      grouped.get(e.percentile)!.push(e);
    });
    const dataSet = Array.from(grouped.entries()).map(([key, value]) => {
      return {
        label: `${ordinal(key)} Percentile`,
        data: value
          .sort((a, b) => a.age - b.age)
          .map((e) => ({ x: e.age, y: e.value })),
      };
    });
    return dataSet;
  }, [growthData.data]);

  const dataSet2 = useMemo(() => {
    const birthdayTimestamp = patientBirthday.getTime();
    return ["od", "os"].map((side, index) => ({
      label: side,
      data: measurement.map((m) => {
        const measurementTimestamp = new Date(m.date).getTime();
        return {
          x:
            (measurementTimestamp - birthdayTimestamp) /
            (1000 * 60 * 60 * 24 * 365.25),
          y: m[side],
        };
      }),
      elements: {
        point: {
          radius: 3,
        },
      },
      backgroundColor: index ? "red" : "blue",
      borderColor: index ? "red" : "blue",
    }));
  }, [measurement]);

  const options = {
    responsive: true,
    plugins: {
      autocolors: {
        mode: "dataset" as const,
        offset: 0,
      },
      legend: {
        position: "left" as const,
      },
      title: {
        display: true,
        text: "Axial Length Percentiles",
        color: "#333333",
        font: {
          size: 24,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
    showLine: true,
    scales: {
      x: {
        grid: {
          tickColor: "black",
        },
        border: {
          color: "black",
        },
        title: {
          display: true,
          text: "Age (years)",
          font: {
            size: 16,
          },
        },
      },
      y: {
        grid: {
          tickColor: "black",
        },
        border: {
          color: "black",
        },
        title: {
          display: true,
          text: "Axial Length (mm)",
          font: {
            size: 16,
          },
        },
      },
    },
  };

  if (!dataSet) return <></>;

  const data = {
    datasets: dataSet.concat(dataSet2),
  };

  return <Scatter options={options} data={data} />;
}

const GridDiv = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 128px);
  gap: 16px;
`;

const GridItemDiv = styled.div`
  text-align: center;
  background-color: white;
  border: 1px solid lightgray;
  border-radius: 20px;
  padding: 8px 0;
`;

const GridItemDiv2 = styled(GridItemDiv)`
  background-color: ${theme.primary};
  color: white;
`;

function MeasurementList({ measurement }: { measurement: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { patientId } = useParams<{ patientId: string }>();
  if (patientId == null) return <></>;

  const queryClient = useQueryClient();
  const registerMeasurementMutation = useMutation({
    mutationFn: registerMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
      alert("Success!");
      setIsDialogOpen(false);
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const filteredMeasurement = useMemo(
    () => measurement.sort().reverse().slice(0, 3),
    [measurement]
  );

  return (
    <>
      <GridDiv>
        <div></div>
        <GridItemDiv>OD</GridItemDiv>
        <GridItemDiv>OS</GridItemDiv>
        {filteredMeasurement.map((m) => (
          <>
            <GridItemDiv>{m.date.split("T")[0]}</GridItemDiv>
            <GridItemDiv
              style={{
                gridColumn: "span 2",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-around",
                gap: "16px",
                alignItems: "center",
                padding: 0,
              }}
            >
              <span>{m.od ?? "(No data)"}</span>
              <span>{m.os ?? "(No data)"}</span>
            </GridItemDiv>
          </>
        ))}
        <GridItemDiv2 onClick={() => setIsDialogOpen(true)}>+</GridItemDiv2>
      </GridDiv>
      <MeasurementRegisterDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={({ instrumentId, date, od, os }) => {
          registerMeasurementMutation.mutate({
            patient_id: patientId,
            instrument_id: instrumentId,
            date,
            od,
            os,
          });
        }}
      />
    </>
  );
}

function MeasurementRegisterDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: ({
    instrumentId,
    date,
    od,
    os,
  }: {
    instrumentId: string;
    date: string;
    od: number;
    os: number;
  }) => void;
}) {
  const instrumentQuery = useQuery({
    queryKey: ["instrument"],
    queryFn: getInstrumentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [instrumentId, setInstrumentId] = useState<string>();
  useEffect(() => {
    if (instrumentQuery.isSuccess) setInstrumentId(instrumentQuery.data[0].id);
  }, [instrumentQuery.isSuccess]);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const od = useRef("");
  const os = useRef("");

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true}>
      <DialogTitle>Register Measurement</DialogTitle>
      <DialogContent>
        <label>
          Date:
          <TextInput
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Instrument:
          <TextInput
            as="select"
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
          >
            {instrumentQuery.data?.map((i: any) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </TextInput>
        </label>
        <label>
          OD:
          <TextInput
            pattern="[0-9]+(\.[0-9]+){0,1}"
            onChange={(e) => (od.current = e.target.value)}
          />
        </label>
        <label>
          OS:
          <TextInput
            pattern="[0-9]+(\.[0-9]+){0,1}"
            onChange={(e) => (os.current = e.target.value)}
          />
        </label>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Cancel</PrimaryNagativeButton>
        <PrimaryButton
          onClick={() => {
            const odValue = parseFloat(od.current);
            const osValue = parseFloat(os.current);
            if (
              !instrumentId ||
              Number.isNaN(odValue) ||
              Number.isNaN(osValue)
            ) {
              alert("Invalid value detected");
              return;
            }
            onConfirm({
              instrumentId,
              date: date,
              od: odValue,
              os: osValue,
            });
          }}
        >
          Confirm
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
