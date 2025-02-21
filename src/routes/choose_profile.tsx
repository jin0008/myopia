import styled from "styled-components";
import theme from "../theme";
import { useNavigate } from "react-router";

export default function ProfileChoice() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "64px",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <h1>Choose your profile</h1>
      <div
        style={{
          display: "flex",
          gap: "64px",
          flexDirection: "row",
        }}
      >
        <ProfileCard
          title="Regular user"
          description="Register your children and track their axial length growth and treatment."
          onClick={() => {}}
        />
        <ProfileCard
          title="Healthcare professional"
          description="Manage your patients. Register their axial length growth and treatment data"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}

const CardDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 320px;
  height: 240px;
  background-color: ${theme.primary};
  padding: 32px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
`;
function ProfileCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <CardDiv onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
    </CardDiv>
  );
}
