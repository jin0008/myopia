import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import deleteIcon from "../../assets/delete.svg";
import editIcon from "../../assets/edit.svg";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
import { TextInput } from "../../components/input";
import {
  getInstrumentList,
  getRefractiveErrorMethodList,
} from "../../api/static";
import { UserContext } from "../../App";
import {
  GridDiv,
  GridItemDiv,
  GridItemDiv2,
  MeasurementGroup,
  TextButton,
} from "./styles";
import {
  AxialLength,
  Measurement,
  RefractiveError,
} from "../../types/measurement";

interface MeasurementListProps {
  measurement?: Measurement[];
  edit: boolean;
  onAdd: () => void;
  onEdit: (measurement: Measurement) => void;
  onDelete: (measurement: Measurement) => void;
  mode: "default" | "list";
}

export function MeasurementList({
  measurement = [],
  edit,
  onAdd,
  onEdit,
  onDelete,
  mode,
}: MeasurementListProps) {
  const filteredMeasurement = useMemo(
    () => measurement.slice(0, mode === "default" ? 5 : undefined).reverse(),
    [measurement, mode],
  );

  const { patientId } = useParams<{ patientId: string }>();

  if (patientId == null) return null;

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
                display: "flex",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              {edit && (
                <>
                  <img
                    src={editIcon}
                    style={{ width: "24px", cursor: "pointer", opacity: 0.5 }}
                    alt="edit"
                    onClick={() => onEdit(m)}
                  />
                  <img
                    src={deleteIcon}
                    style={{ width: "24px", cursor: "pointer", opacity: 0.5 }}
                    alt="delete"
                    onClick={() => onDelete(m)}
                  />
                </>
              )}
            </div>
          </React.Fragment>
        ))}
        {edit && mode === "default" && (
          <GridItemDiv2 onClick={onAdd}>+</GridItemDiv2>
        )}
      </GridDiv>
    </>
  );
}

interface AxialLengthRegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    instrumentId: string;
    date: string;
    od: number | null;
    os: number | null;
  }) => void;
  initialData?: AxialLength;
}

export function AxialLengthRegisterDialog({
  open,
  onClose,
  onConfirm,
  initialData,
}: AxialLengthRegisterDialogProps) {
  const { user } = useContext(UserContext);
  const instrumentQuery = useQuery({
    queryKey: ["instrument"],
    queryFn: getInstrumentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const [instrumentId, setInstrumentId] = useState<string>();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [od, setOd] = useState("");
  const [os, setOs] = useState("");

  useEffect(() => {
    if (initialData) {
      setInstrumentId(initialData.instrument_id);
      setDate(initialData.date.split("T")[0]);
      setOd(initialData.od?.toString() ?? "");
      setOs(initialData.os?.toString() ?? "");
    }
  }, [initialData]);

  useEffect(() => {
    if (instrumentQuery.isSuccess)
      setInstrumentId(
        user?.healthcare_professional?.default_instrument_id ??
          instrumentQuery.data?.[0]?.id,
      );
  }, [
    instrumentQuery.isSuccess,
    user?.healthcare_professional?.default_instrument_id,
    instrumentQuery.data,
  ]);

  useEffect(() => {
    if (user?.healthcare_professional?.default_instrument_id)
      setInstrumentId(user.healthcare_professional.default_instrument_id);
  }, [open, user?.healthcare_professional?.default_instrument_id]);

  const handleConfirm = () => {
    const odValue = od === "" ? null : parseFloat(od);
    const osValue = os === "" ? null : parseFloat(os);
    if (
      !instrumentId ||
      Number.isNaN(odValue as number) ||
      Number.isNaN(osValue as number)
    ) {
      alert("Invalid value detected");
      return;
    }
    onConfirm({
      instrumentId,
      date,
      od: odValue,
      os: osValue,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
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
            {instrumentQuery.data?.map((i: { id: string; name: string }) => (
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
            value={od}
            onChange={(e) => setOd(e.target.value)}
          />
        </label>
        <label>
          OS:
          <TextInput
            pattern="[0-9]+(\.[0-9]+){0,1}"
            value={os}
            onChange={(e) => setOs(e.target.value)}
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

interface RefractiveErrorRegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: Omit<RefractiveError, "id">) => void;
  initialData?: RefractiveError;
}

export function RefractiveErrorRegisterDialog({
  open,
  onClose,
  onConfirm,
  initialData,
}: RefractiveErrorRegisterDialogProps) {
  const methodQuery = useQuery({
    queryKey: ["refractive_error_method"],
    queryFn: getRefractiveErrorMethodList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const methodNameMap = {
    Autorefraction: "Auto",
    "Cycloplegic refraction": "CR",
    "Manifest refraction": "MR",
  } as Record<string, string>;

  const [methodId, setMethodId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [od_sph, setOdSph] = useState("");
  const [od_cyl, setOdCyl] = useState("");
  const [os_sph, setOsSph] = useState("");
  const [os_cyl, setOsCyl] = useState("");

  useEffect(() => {
    if (initialData) {
      setMethodId(initialData.method_id);
      setDate(initialData.date.split("T")[0]);
      setOdSph(initialData.od_sph?.toString() ?? "");
      setOdCyl(initialData.od_cyl?.toString() ?? "");
      setOsSph(initialData.os_sph?.toString() ?? "");
      setOsCyl(initialData.os_cyl?.toString() ?? "");
    }
  }, [initialData]);

  useEffect(() => {
    if (methodQuery.isSuccess) {
      setMethodId(methodQuery.data?.[0]?.id);
    }
  }, [methodQuery.isSuccess, methodQuery.data]);

  const handleConfirm = () => {
    const od_sphValue = od_sph === "" ? null : parseFloat(od_sph);
    const od_cylValue = od_cyl === "" ? 0 : parseFloat(od_cyl);
    const os_sphValue = os_sph === "" ? null : parseFloat(os_sph);
    const os_cylValue = os_cyl === "" ? 0 : parseFloat(os_cyl);
    if (
      !methodId ||
      Number.isNaN(od_sphValue as number) ||
      Number.isNaN(od_cylValue as number) ||
      Number.isNaN(os_sphValue as number) ||
      Number.isNaN(os_cylValue as number) ||
      od_sphValue === null ||
      os_sphValue === null
    ) {
      alert("Invalid value detected");
      return;
    }
    onConfirm({
      method_id: methodId,
      date,
      od_sph: od_sphValue,
      od_cyl: od_cylValue,
      os_sph: os_sphValue,
      os_cyl: os_cylValue,
    });
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Register Refractive Error</DialogTitle>
      <DialogContent>
        <label>
          Date:
          <TextInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>Method:</label>
        <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
          {methodQuery.data?.map((m: { id: number; name: string }) => (
            <TextButton
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                padding: 0,
              }}
              $active={methodId === m.id}
              key={m.id}
              onClick={() => setMethodId(m.id)}
            >
              {methodNameMap[m.name] ?? m.name}
            </TextButton>
          ))}
        </div>
        <p>OD</p>
        <MeasurementGroup>
          <label>
            sph:
            <TextInput
              pattern="(\+|-)?[0-9]+(\.[0-9]+)?"
              value={od_sph}
              onChange={(e) => setOdSph(e.target.value)}
            />
          </label>
          <label>
            cyl:
            <TextInput
              pattern="(\+|-)?[0-9]+(\.[0-9]+)?"
              placeholder="(defaults to 0)"
              value={od_cyl}
              onChange={(e) => setOdCyl(e.target.value)}
            />
          </label>
        </MeasurementGroup>
        <p>OS</p>
        <MeasurementGroup>
          <label>
            sph:
            <TextInput
              pattern="(\+|-)?[0-9]+(\.[0-9]+)?"
              value={os_sph}
              onChange={(e) => setOsSph(e.target.value)}
            />
          </label>
          <label>
            cyl:
            <TextInput
              pattern="(\+|-)?[0-9]+(\.[0-9]+)?"
              placeholder="(defaults to 0)"
              value={os_cyl}
              onChange={(e) => setOsCyl(e.target.value)}
            />
          </label>
        </MeasurementGroup>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Cancel</PrimaryNagativeButton>
        <PrimaryButton onClick={handleConfirm}>Confirm</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
