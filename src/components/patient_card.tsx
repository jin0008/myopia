import styled from "styled-components";
import theme from "../theme";
import deleteIcon from "../assets/delete.svg";

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

export function PatientCard({
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
        {dateOfBirth}/{sex}
      </p>
    </CardDiv>
  );
}
