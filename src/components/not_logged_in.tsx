import styled from "styled-components";
import { PrimaryButton } from "./button";
import { CenteredDiv } from "./div";
import { useNavigate } from "react-router";

const CenteredDivWithGap = styled(CenteredDiv)`
  gap: 32px;
`;

export default function NotLoggedIn() {
  const navigate = useNavigate();
  return (
    <CenteredDivWithGap>
      You are not logged in
      <PrimaryButton onClick={() => navigate("/login")}>Log in</PrimaryButton>
    </CenteredDivWithGap>
  );
}
