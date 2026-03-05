import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
import { TextInput } from "../../components/input";
import { getPatientDetail } from "../../api/patient";
import {
  deletePatientTreatment,
  editPatientTreatment,
  registerPatientTreatment,
} from "../../api/treatment";
import { getTreatmentList } from "../../api/static";
import { TreatmentListHeader, TreatmentCardDiv } from "./styles";

export type TreatmentEditDefaultData = {
  patient_treatment_id: string;
  treatment_id: string;
  start_date: string;
  end_date: string | null;
};

interface TreatmentListProps {
  edit: boolean;
}

export function TreatmentList({ edit }: TreatmentListProps) {
  const { patientId } = useParams<{ patientId: string }>();
  const queryClient = useQueryClient();
  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatientDetail(patientId as string),
    enabled: !!patientId,
  });

  const treatmentQuery = useQuery({
    queryKey: ["treatment"],
    queryFn: getTreatmentList,
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

  const treatments = patientQuery.data?.patient_treatment ?? [];
  const sortedTreatments = [...treatments].sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  );

  return (
    <div>
      <TreatmentListHeader>
        <h1 style={{ fontWeight: "normal" }}>Treatments</h1>
        {edit && (
          <PrimaryButton onClick={() => setIsDialogOpen(true)}>
            Register
          </PrimaryButton>
        )}
      </TreatmentListHeader>
      {treatments.length === 0
        ? "No Data"
        : sortedTreatments.map(
            (t: {
              id: string;
              treatment_id: string;
              start_date: string;
              end_date: string | null;
            }) => (
              <TreatmentCard
                key={t.id}
                name={
                  treatmentQuery.data?.find(
                    (i: { id: string }) => i.id === t.treatment_id,
                  )?.name ?? ""
                }
                startDate={t.start_date?.split("T")[0] ?? ""}
                endDate={t.end_date?.split("T")[0] ?? ""}
                edit={edit}
                onEdit={() => {
                  setEditData({
                    patient_treatment_id: t.id,
                    treatment_id: t.treatment_id,
                    start_date: t.start_date.split("T")[0],
                    end_date: t.end_date?.split("T")[0] ?? null,
                  });
                  setIsEditDialogOpen(true);
                }}
                onDelete={() => {
                  confirm("Are you sure you want to delete this treatment?") &&
                    deleteTreatmentMutation.mutate(t.id);
                }}
              />
            ),
          )}
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

interface TreatmentCardProps {
  name: string;
  startDate: string;
  endDate: string;
  edit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function TreatmentCard({
  name,
  startDate,
  endDate,
  edit,
  onEdit,
  onDelete,
}: TreatmentCardProps) {
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

interface TreatmentRegisterDialogProps {
  open: boolean;
  onClose: () => void;
}

function TreatmentRegisterDialog({
  open,
  onClose,
}: TreatmentRegisterDialogProps) {
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
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (treatmentQuery.isSuccess) setTreatmentId(treatmentQuery.data?.[0]?.id);
  }, [treatmentQuery.isSuccess, treatmentQuery.data]);

  if (patientId == null) return null;

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
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Register Treatment</DialogTitle>
      <DialogContent>
        <label>
          Treatment:
          <TextInput
            as="select"
            value={treatmentId}
            onChange={(e) => setTreatmentId(e.target.value)}
          >
            {treatmentQuery.data?.map((i: { id: string; name: string }) => (
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

interface TreatmentEditDialogProps {
  open: boolean;
  onClose: () => void;
  defaultData: TreatmentEditDefaultData;
}

function TreatmentEditDialog({
  open,
  onClose,
  defaultData,
}: TreatmentEditDialogProps) {
  const patientId = useParams<{ patientId: string }>().patientId;
  const queryClient = useQueryClient();
  const editTreatmentMutation = useMutation({
    mutationFn: (data: {
      treatment_id: string;
      start_date: string;
      end_date: string | null;
    }) => editPatientTreatment(defaultData.patient_treatment_id, data),
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

  const handleConfirm = () => {
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
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Edit Treatment</DialogTitle>
      <DialogContent>
        <label>
          Treatment:
          <TextInput
            as="select"
            value={treatmentId}
            onChange={(e) => setTreatmentId(e.target.value)}
          >
            {treatmentQuery.data?.map((i: { id: string; name: string }) => (
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
