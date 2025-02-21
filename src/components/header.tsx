import styled from "styled-components";
import logo from "../assets/logo.svg";

import { PrimaryButton } from "./button";
import { useNavigate } from "react-router";

const HeaderTextButton = styled.span`
  color: #333;
  cursor: pointer;
`;

export default function Header() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "32px 64px 0",
      }}
    >
      <img
        src={logo}
        alt="logo"
        style={{ height: "100%" }}
        onClick={() => navigate("/")}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "36px",
        }}
      >
        <HeaderTextButton>Axial length growth</HeaderTextButton>
        <HeaderTextButton>Newstand</HeaderTextButton>
        <HeaderTextButton>Who we are</HeaderTextButton>
        <HeaderTextButton>My profile</HeaderTextButton>
        <PrimaryButton onClick={() => navigate("/login")}>
          Sign in
        </PrimaryButton>
      </div>
    </div>
  );
}
