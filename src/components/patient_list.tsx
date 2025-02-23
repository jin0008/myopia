import styled from "styled-components";
import theme from "../theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePatient, getPatients } from "../api/patient";
import deleteIcon from "../assets/delete.svg";
import { useState } from "react";
import ConfirmDialog from "./dialog";
import { useNavigate } from "react-router";

const GridDiv = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
  width: 100%;
`;

export default function PatientList({ search }: { search: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const patientQuery = useQuery({
    queryKey: ["patient"],
    queryFn: getPatients,
  });
  const deletePatientMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient"] });
      setIsDeleteConfirmDialogOpen(false);
      alert("deleted!");
    },
    onError: () => alert("An error occured"),
  });

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] =
    useState(false);
  const [deleteTargetPatient, setDeleteTargetPatient] = useState<any>();

  return (
    <>
      <GridDiv>
        {patientQuery.data
          ?.filter((patient: any) =>
            patient.registration_number.includes(search)
          )
          ?.map((patient: any) => (
            <PatientCard
              key={patient.id}
              registration={patient.registration_number}
              dateOfBirth={patient.date_of_birth}
              sex={patient.sex === "male" ? "M" : "F"}
              onClick={() => navigate(`/chart/${patient.id}`)}
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
          content={
            <>
              Are you sure you want to delete patient with registration number:
              <br />
              {deleteTargetPatient.registration_number}
              <br />
              <br />
              All records associated with the patient will be gone forever!
            </>
          }
          open={isDeleteConfirmDialogOpen}
          onClose={() => setIsDeleteConfirmDialogOpen(false)}
          onConfirm={() => {
            deletePatientMutation.mutate(deleteTargetPatient.id);
          }}
        />
      )}
    </>
  );
}

const CardDiv = styled.div`
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 8px 0;

  cursor: pointer;

  transition: background 1s;

  &:hover {
    background-color: ${theme.primary50};
  }
`;

const DeleteIconImg = styled.img`
  width: 24px;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`;

function PatientCard({
  registration,
  dateOfBirth,
  sex,
  onClick,
  onDelete,
}: {
  registration: string;
  dateOfBirth: string;
  sex: string;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <CardDiv onClick={onClick}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <h2>{registration}</h2>
        <DeleteIconImg
          src={deleteIcon}
          style={{
            width: "16px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </div>
      <p>
        {dateOfBirth.split("T")[0]}/{sex}
      </p>
    </CardDiv>
  );
}
