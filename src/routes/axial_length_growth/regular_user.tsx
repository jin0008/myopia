import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import { UserContext } from "../../App";
import { PrimaryButton, PrimaryNagativeButton } from "../../components/button";
// TopDiv removed - using custom PageWrapper
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
import { MOBILE_MEDIA } from "../../lib/constants";
import { Add } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { TextInput } from "../../components/input";
import NotLoggedIn from "../../components/not_logged_in";
import { HttpError } from "../../lib/fetch";

const PageWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 24px 100px;

  @media ${MOBILE_MEDIA} {
    padding: 32px 16px 60px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;

  @media ${MOBILE_MEDIA} {
    flex-direction: column;
    gap: 12px;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1d1d1f;

  &::after {
    content: "";
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: ${theme.primary};
    border-radius: 50%;
    margin-left: 4px;
    vertical-align: super;
    font-size: 0.5em;
  }

  @media ${MOBILE_MEDIA} {
    font-size: 2rem;
  }
`;

const PageSubtitle = styled.p`
  font-size: 15px;
  color: #86868b;
  margin-bottom: 32px;
`;

export default function RegularProfile() {
  const { user } = useContext(UserContext);
  if (user == null) return <NotLoggedIn />;
  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <PageTitle>Child list</PageTitle>
          <PageSubtitle>환자 리스트를 확인하고 관리하세요</PageSubtitle>
        </div>
      </PageHeader>
      <PatientList />
    </PageWrapper>
  );
}

const GridDiv = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media ${MOBILE_MEDIA} {
    grid-template-columns: 1fr;
  }
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
      <RegisterButtonWrapper>
        <RegisterButton onClick={() => setRegisterDialogOpen(true)}>
          <Add style={{ fontSize: "20px" }} />
          Register Child
        </RegisterButton>
      </RegisterButtonWrapper>
      <PatientRegisterDialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
      />
    </>
  );
}

const RegisterButtonWrapper = styled.div`
  position: fixed;
  bottom: 80px;
  right: 32px;
  z-index: 100;

  @media ${MOBILE_MEDIA} {
    bottom: 64px;
    right: 16px;
  }
`;

const RegisterButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #1d1d1f;
  color: white;
  border: none;
  border-radius: 28px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
  }
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
    onError: (e: any) => {
      if (e instanceof HttpError && e.code === 404)
        alert("Patient with specified information does not exist");
      else alert("An error occured");
    },
  });
  const [hospitalId, setHospitalId] = useState("");

  const registration = useRef("");
  const dateOfBirth = useRef(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (hospitalQuery.isSuccess) {
      const first = hospitalQuery.data[0];
      setHospitalId(first?.id);
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
