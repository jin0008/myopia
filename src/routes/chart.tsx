import styled from "styled-components";
import deleteIcon from "../assets/delete.svg";
import theme from "../theme";
import { useParams, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPatientDetail } from "../api/patient";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { getGrowthData, getGrowthDataEthnicityList } from "../api/growth_data";
import ordinal from "ordinal";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { PrimaryButton, PrimaryNagativeButton } from "../components/button";
import { TextInput } from "../components/input";
import { getInstrumentList, getTreatmentList } from "../api/static";
import { deleteMeasurement, registerMeasurement } from "../api/measurement";
import React from "react";
import {
  deletePatientTreatment,
  editPatientTreatment,
  registerPatientTreatment,
} from "../api/treatment";
import { UserContext } from "../App";
import { upsertPatientK } from "../api/mean_k";

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
  const [searchParams] = useSearchParams();
  const edit = searchParams.get("edit") === "true";

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientDetail(patientId as string),
    enabled: !!patientId,
  });

  const meanKValue = useMemo(() => {
    if (!patientQuery.data) return "(No data)";
    if (patientQuery.data.patient_k.length === 0) return "(No data)";

    let od_count = 0;
    let os_count = 0;
    let od_sum = 0;
    let os_sum = 0;
    patientQuery.data.patient_k.forEach((k: any) => {
      if (k.od) {
        od_count++;
        od_sum += k.od;
      }
      if (k.os) {
        os_count++;
        os_sum += k.os;
      }
    });
    const od = od_sum / od_count;
    const os = os_sum / os_count;

    return `(OD:${od}, OS:${os})`;
  }, [patientQuery.data?.patient_k]);

  const [kInputDialogOpen, setKInputDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const kValueMutation = useMutation({
    mutationFn: (data: any) => {
      return Promise.all([
        upsertPatientK({
          patient_id: patientId!,
          k_type: "K1",
          od: data.K1.od,
          os: data.K1.os,
        }),
        upsertPatientK({
          patient_id: patientId!,
          k_type: "K2",
          od: data.K2.od,
          os: data.K2.os,
        }),
      ]);
    },
    onSuccess: () => {
      alert("K value registered successfully");
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
      setKInputDialogOpen(false);
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const referenceEthnictyListQuery = useQuery({
    queryKey: ["referenceEthnicityList"],
    queryFn: getGrowthDataEthnicityList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const sortedMeasurement = useMemo(
    () =>
      patientQuery.data?.measurement?.sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [patientQuery.data?.measurement]
  );

  //0:default
  //1:list
  const [viewMode, setViewMode] = useState(0);

  const [referenceEthnicity, setReferenceEthnicity] = useState<string>("Asian");

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
            <TextButton
              style={{
                backgroundColor: viewMode === 0 ? theme.primary : "white",
                color: viewMode === 0 ? "white" : "black",
                border: viewMode === 0 ? "none" : "1px solid lightgray",
              }}
              onClick={() => setViewMode(0)}
            >
              Default
            </TextButton>
            <TextButton
              style={{
                backgroundColor: viewMode === 1 ? theme.primary : "white",
                color: viewMode === 1 ? "white" : "black",
                border: viewMode === 1 ? "none" : "1px solid lightgray",
              }}
              onClick={() => setViewMode(1)}
            >
              List view
            </TextButton>
          </div>
        </ChartTitleDiv>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: "16px",
          }}
        >
          reference data :
          <select
            value={referenceEthnicity}
            onChange={(e) => setReferenceEthnicity(e.target.value)}
          >
            {referenceEthnictyListQuery.data?.map((e: any) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <span>meanK(Diopter):</span>
          {meanKValue}
          <span
            style={{
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={() => setKInputDialogOpen(true)}
          >
            register k value
          </span>
          <KInputDialog
            open={kInputDialogOpen}
            onClose={() => setKInputDialogOpen(false)}
            onConfirm={(data) => {
              kValueMutation.mutate(data);
            }}
          />
        </div>
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
              measurement={sortedMeasurement}
              patientBirthday={new Date(patientQuery.data.date_of_birth)}
              patientSex={patientQuery.data.sex}
              referenceEthnicity={referenceEthnicity}
            />
          </div>
          <div
            style={{
              margin: "0 16px",
            }}
          >
            <MeasurementList
              mode={viewMode}
              edit={edit}
              measurement={sortedMeasurement}
            />
          </div>
        </div>
        <div>
          <TreatmentList edit={edit} />
        </div>
      </ContentDiv>
    </div>
  );
}

function KInputDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    K1: { od: number | null; os: number | null };
    K2: { od: number | null; os: number | null };
  }) => void;
}) {
  const k1_od = useRef("");
  const k1_os = useRef("");

  const k2_od = useRef("");
  const k2_os = useRef("");

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Input K value</DialogTitle>
      <DialogContent>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div></div>
          <div>OD</div>
          <div>OS</div>
          <div>K1</div>
          <div>
            <TextInput
              pattern="[0-9]+(\.[0-9]+){0,1}"
              placeholder="K1 in Diopter"
              onChange={(e) => (k1_od.current = e.target.value)}
            />
          </div>
          <div>
            <TextInput
              pattern="[0-9]+(\.[0-9]+){0,1}"
              placeholder="K1 in Diopter"
              onChange={(e) => (k1_os.current = e.target.value)}
            />
          </div>
          <div>K2</div>
          <div>
            <TextInput
              pattern="[0-9]+(\.[0-9]+){0,1}"
              placeholder="K2 in Diopter"
              onChange={(e) => (k2_od.current = e.target.value)}
            />
          </div>
          <div>
            <TextInput
              pattern="[0-9]+(\.[0-9]+){0,1}"
              placeholder="K2 in Diopter"
              onChange={(e) => (k2_os.current = e.target.value)}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Cancel</PrimaryNagativeButton>
        <PrimaryButton
          onClick={() => {
            const K1 = {
              od: k1_od.current === "" ? null : parseFloat(k1_od.current),
              os: k1_os.current === "" ? null : parseFloat(k1_os.current),
            };
            const K2 = {
              od: k2_od.current === "" ? null : parseFloat(k2_od.current),
              os: k2_os.current === "" ? null : parseFloat(k2_os.current),
            };
            if (
              Number.isNaN(K1.od) ||
              Number.isNaN(K1.os) ||
              Number.isNaN(K2.od) ||
              Number.isNaN(K2.os)
            ) {
              alert("Invalid value detected");
              return;
            }
            onConfirm({ K1, K2 });
          }}
        >
          Confirm
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

function Chart({
  measurement,
  patientBirthday,
  patientSex,
  referenceEthnicity,
}: {
  measurement: any[];
  patientBirthday: Date;
  patientSex: "male" | "female";
  referenceEthnicity: string;
}) {
  const growthData = useQuery<any[]>({
    queryKey: [
      "growthData",
      { sex: patientSex, ethnicity: referenceEthnicity },
    ],
    queryFn: () => getGrowthData(patientSex, referenceEthnicity),
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
        min: 4,
        max: 18,
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
  grid-template-columns: repeat(3, 108px) 1fr;
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
  border: none;
`;

function MeasurementList({
  measurement,
  edit,
  mode, //0: default;1: list
}: {
  measurement: any[];
  edit: boolean;
  mode: number;
}) {
  const filteredMeasurement = useMemo(
    () => measurement.slice(0, mode === 0 ? 5 : undefined).reverse(),
    [measurement, mode]
  );

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
      setIsDialogOpen(false);
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const deleteMeasurementMutation = useMutation({
    mutationFn: deleteMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const handleDelete = (id: string) => {
    confirm("Are you sure you want to delete this measurement?") &&
      deleteMeasurementMutation.mutate(id);
  };

  return (
    <>
      <GridDiv>
        <div></div>
        <GridItemDiv>OD</GridItemDiv>
        <GridItemDiv>OS</GridItemDiv>
        <div></div>
        {filteredMeasurement.map((m) => (
          <React.Fragment key={m.id}>
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
            <div
              style={{
                alignContent: "center",
              }}
            >
              {edit && (
                <img
                  src={deleteIcon}
                  style={{
                    width: "24px",
                  }}
                  alt="delete"
                  onClick={() => handleDelete(m.id)}
                />
              )}
            </div>
          </React.Fragment>
        ))}
        {edit && mode == 0 && (
          <GridItemDiv2 onClick={() => setIsDialogOpen(true)}>+</GridItemDiv2>
        )}
      </GridDiv>
      <MeasurementRegisterDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={({ instrumentId, date, od, os }) => {
          //can't register future measurement
          if (new Date(date) > new Date()) {
            alert("Can't register future measurement");
            return;
          }
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
    od: number | null;
    os: number | null;
  }) => void;
}) {
  const { user } = useContext(UserContext);
  const instrumentQuery = useQuery({
    queryKey: ["instrument"],
    queryFn: getInstrumentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [instrumentId, setInstrumentId] = useState<string>();

  useEffect(() => {
    if (instrumentQuery.isSuccess)
      setInstrumentId(
        user?.healthcare_professional?.default_instrument_id ??
          instrumentQuery.data[0].id
      );
  }, [instrumentQuery.isSuccess]);

  useEffect(() => {
    if (user?.healthcare_professional?.default_instrument_id)
      setInstrumentId(user.healthcare_professional.default_instrument_id);
  }, [open]);

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
            value={date}
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
            const odValue = od.current === "" ? null : parseFloat(od.current);
            const osValue = os.current === "" ? null : parseFloat(os.current);
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

function TreatmentList({ edit }: { edit: boolean }) {
  const { patientId } = useParams<{ patientId: string }>();
  const queryClient = useQueryClient();
  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientDetail(patientId as string),
    enabled: !!patientId,
  });

  const treatmentQuery = useQuery({
    queryKey: ["treatment"],
    queryFn: getInstrumentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const deleteTreatmentMutation = useMutation({
    mutationFn: deletePatientTreatment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [editData, setEditData] = useState<TreatmentEditDefaultData>();

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          marginBottom: "16px",
        }}
      >
        <h1
          style={{
            fontWeight: "normal",
          }}
        >
          Treatments
        </h1>
        {edit && (
          <PrimaryButton onClick={() => setIsDialogOpen(true)}>
            Register
          </PrimaryButton>
        )}
      </div>
      {patientQuery.data?.patient_treatment?.length === 0
        ? "No Data"
        : patientQuery.data?.patient_treatment
            .sort((a: any, b: any) => a.start_date.localeCompare(b.start_date))
            .map((t: any) => (
              <TreatmentCard
                key={t.id}
                name={
                  treatmentQuery.data?.find((i: any) => i.id === t.treatment_id)
                    ?.name
                }
                startDate={t.start_date?.split("T")[0]}
                endDate={t.end_date?.split("T")[0]}
                edit={edit}
                onEdit={() => {
                  setEditData({
                    patient_treatment_id: t.id,
                    treatment_id: t.treatment_id,
                    start_date: t.start_date.split("T")[0],
                    end_date: t.end_date?.split("T")[0],
                  });
                  setIsEditDialogOpen(true);
                }}
                onDelete={() => {
                  confirm("Are you sure you want to delete this treatment?") &&
                    deleteTreatmentMutation.mutate(t.id);
                }}
              />
            ))}
      <TreatmentRegisterDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      {editData && (
        <TreatmentEditDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          defaultData={editData}
        />
      )}
    </div>
  );
}

const TreatmentCardDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  border: 1px solid lightgray;
  border-radius: 20px;
  padding: 8px 16px;
  margin: 8px 0;
`;

function TreatmentCard({
  name,
  startDate,
  endDate,
  edit,
  onEdit,
  onDelete,
}: {
  name: string;
  startDate: string;
  endDate: string;
  edit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TreatmentCardDiv>
      <div>
        <h3>{name}</h3>
        <p>
          start:{startDate}/end:{endDate}
        </p>
      </div>
      {edit && (
        <div style={{ display: "flex", gap: "16px" }}>
          <PrimaryButton onClick={onEdit}>Edit</PrimaryButton>
          <PrimaryNagativeButton onClick={onDelete}>
            Delete
          </PrimaryNagativeButton>
        </div>
      )}
    </TreatmentCardDiv>
  );
}

function TreatmentRegisterDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const patientId = useParams<{ patientId: string }>().patientId;

  const queryClient = useQueryClient();
  const treatmentQuery = useQuery({
    queryKey: ["treatment"],
    queryFn: getTreatmentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const treatmentMutation = useMutation({
    mutationFn: registerPatientTreatment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
      onClose();
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const [treatmentId, setTreatmentId] = useState<string>();
  useEffect(() => {
    if (treatmentQuery.isSuccess) setTreatmentId(treatmentQuery.data[0].id);
  }, [treatmentQuery.isSuccess]);

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");

  if (patientId == null) return <></>;

  const handleConfirm = () => {
    if (!treatmentId || startDate === "") {
      alert("Missing required fields: Treatment, Start Date");
      return;
    }
    if (endDate !== "" && new Date(endDate) < new Date(startDate)) {
      alert("End date must be after start date");
      return;
    }
    treatmentMutation.mutate({
      patient_id: patientId,
      treatment_id: treatmentId,
      start_date: startDate,
      end_date: endDate === "" ? null : endDate,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true}>
      <DialogTitle>Register Treatment</DialogTitle>
      <DialogContent>
        <label>
          Treatment:
          <TextInput as="select">
            {treatmentQuery.data?.map((i: any) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </TextInput>
        </label>
        <label>
          Start Date:
          <TextInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date:
          <TextInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Cancel</PrimaryNagativeButton>
        <PrimaryButton onClick={handleConfirm}>Confirm</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

type TreatmentEditDefaultData = {
  patient_treatment_id: string;
  treatment_id: string;
  start_date: string;
  end_date: string | null;
};

function TreatmentEditDialog({
  open,
  onClose,
  defaultData,
}: {
  open: boolean;
  onClose: () => void;
  defaultData: TreatmentEditDefaultData;
}) {
  const patientId = useParams<{ patientId: string }>().patientId;
  const queryClient = useQueryClient();
  const editTreatmentMutation = useMutation({
    mutationFn: (data: any) =>
      editPatientTreatment(defaultData.patient_treatment_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patient", patientId],
      });
      alert("Treatment edited successfully");
      onClose();
    },
    onError: (e) => {
      console.log(e);
      alert("An error has occured");
    },
  });

  const treatmentQuery = useQuery({
    queryKey: ["treatment"],
    queryFn: getTreatmentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [treatmentId, setTreatmentId] = useState(defaultData.treatment_id);
  const [startDate, setStartDate] = useState(defaultData.start_date);
  const [endDate, setEndDate] = useState(defaultData.end_date ?? "");

  useEffect(() => {
    setTreatmentId(defaultData.treatment_id);
    setStartDate(defaultData.start_date);
    setEndDate(defaultData.end_date ?? "");
  }, [defaultData]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true}>
      <DialogTitle>Edit Treatment</DialogTitle>
      <DialogContent>
        <label>
          Treatment:
          <TextInput
            as="select"
            value={treatmentId}
            onChange={(e) => setTreatmentId(e.target.value)}
          >
            {treatmentQuery.data?.map((i: any) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </TextInput>
        </label>
        <label>
          Start Date:
          <TextInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date:
          <TextInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Cancel</PrimaryNagativeButton>
        <PrimaryButton
          onClick={() => {
            if (!treatmentId || !startDate) {
              alert("Missing required fields: Treatment, Start Date");
              return;
            }
            if (endDate !== "" && new Date(endDate) < new Date(startDate)) {
              alert("End date must be after start date");
              return;
            }
            editTreatmentMutation.mutate({
              treatment_id: treatmentId,
              start_date: startDate,
              end_date: endDate === "" ? null : endDate,
            });
          }}
        >
          Confirm
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
