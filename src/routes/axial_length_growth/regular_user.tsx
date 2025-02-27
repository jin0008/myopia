import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import { UserContext } from "../../App";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
import { CenteredDiv, TopDiv } from "../../components/div";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  addUserPatient,
  deleteUserPatient,
  getUserPatients,
} from "../../api/user";
import { PatientCard } from "../../components/patient_card";
import ConfirmDialog from "../../components/dialog";
import theme from "../../theme";
import { getHospitalList } from "../../api/hospital";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { TextInput } from "../../components/input";
import NotLoggedIn from "../../components/not_logged_in";

export default function RegularProfile() {
  const { user } = useContext(UserContext);
  if (user == null) return <NotLoggedIn />;
  return (
    <TopDiv
      style={{
        margin: "0 128px",
        marginTop: "32px",
      }}
    >
      <h1>Child list</h1>
      <PatientList />
    </TopDiv>
  );
}

const GridDiv = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
  padding: 16px;
  width: 100%;
`;

function PatientList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const patientQuery = useQuery({
    queryKey: ["user", "patient"],
    queryFn: getUserPatients,
  });

  const deletePatientMutation = useMutation({
    mutationFn: deleteUserPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "patient"] });
      setIsDeleteConfirmDialogOpen(false);
    },
    onError: () => alert("An error occured"),
  });

  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] =
    useState(false);
  const [deleteTargetPatient, setDeleteTargetPatient] = useState<any>();
  return (
    <>
      <GridDiv>
        {patientQuery.data?.map((patient: any) => (
          <PatientCard
            key={patient.id}
            registration={patient.registration_number}
            dateOfBirth={patient.date_of_birth.split("T")[0]}
            sex={patient.sex === "male" ? "M" : "F"}
            onClick={() => navigate(`/chart/${patient.id}?edit=false`)}
            onDelete={() => {
              setDeleteTargetPatient(patient);
              setIsDeleteConfirmDialogOpen(true);
            }}
          />
        ))}
        <AddCardDiv onClick={() => setRegisterDialogOpen(true)}>
          register child
        </AddCardDiv>
      </GridDiv>
      {deleteTargetPatient && (
        <ConfirmDialog
          title="Confirm deletion"
          content="Are you sure you want to delete this entry?"
          open={isDeleteConfirmDialogOpen}
          onClose={() => setIsDeleteConfirmDialogOpen(false)}
          onConfirm={() => {
            deletePatientMutation.mutate(deleteTargetPatient.id);
          }}
        />
      )}
      <PatientRegisterDialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
      />
    </>
  );
}

const AddCardDiv = styled.div`
  background-color: ${theme.primary};
  color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 8px 0;
  text-align: center;
  align-content: center;

  cursor: pointer;
`;

function PatientRegisterDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const hospitalQuery = useQuery({
    queryKey: ["hospital"],
    queryFn: getHospitalList,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addUserPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "patient"] });
      onClose();
    },
    onError: () => alert("An error occured"),
  });
  const [hospitalId, setHospitalId] = useState("");

  const registration = useRef("");
  const dateOfBirth = useRef(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (hospitalQuery.isSuccess) {
      const first = hospitalQuery.data[0];
      setHospitalId(first.id);
    }
  }, [hospitalQuery.isSuccess]);

  const handleSubmit = () => {
    if (!registration.current) {
      alert("Missing field: registration #");
      return;
    }
    const data = {
      hospitalId: hospitalId,
      registration: registration.current,
      dateOfBirth: dateOfBirth.current,
    };
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth={true}>
      <DialogTitle>Register your child</DialogTitle>
      <DialogContent>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <label>
            Hospital:
            <TextInput
              as="select"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
            >
              {hospitalQuery.data?.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name}({e.country.code})
                </option>
              ))}
            </TextInput>
          </label>
          <label>
            Registration #
            <TextInput
              onChange={(e) => (registration.current = e.target.value)}
            ></TextInput>
          </label>

          <label>
            Date of birth:
            <TextInput
              type="date"
              defaultValue={dateOfBirth.current}
              onChange={(e) => (dateOfBirth.current = e.target.value)}
            ></TextInput>
          </label>
        </div>
      </DialogContent>
      <DialogActions>
        <PrimaryNagativeButton onClick={onClose}>Dismiss</PrimaryNagativeButton>
        <PrimaryButton onClick={handleSubmit}>Confirm</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
