import styled from "styled-components";
import theme from "../theme";
import deleteIcon from "../assets/delete.svg";
import editIcon from "../assets/edit.svg";

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

const IconButton = styled.img`
  width: 16px;
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
  onEdit,
  onDelete,
}: {
  registration: string;
  dateOfBirth: string;
  sex: string;
  onClick: () => void;
  onEdit?: () => void;
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
        <h2 style={{ maxWidth: "75%", wordWrap: "break-word" }}>
          {registration}
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {onEdit && (
            <IconButton
              src={editIcon}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            />
          )}
          <IconButton
            src={deleteIcon}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        </div>
      </div>
      <p>
        {dateOfBirth}/{sex}
      </p>
    </CardDiv>
  );
}
