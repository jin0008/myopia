import styled from "styled-components";
import logo from "../assets/logo.svg";

import { PrimaryButton } from "./button";
import { useNavigate } from "react-router";
import { useContext } from "react";
import { UserContext } from "../App";
import { logout } from "../api/auth";
import { useQueryClient } from "@tanstack/react-query";

const HeaderTextButton = styled.span`
  color: #333;
  cursor: pointer;
`;

export default function Header() {
  const queryClient = useQueryClient();
  const handleLogout = () => {
    logout()
      .then(() => queryClient.invalidateQueries({ queryKey: ["currentUser"] }))
      .catch(() => {
        alert("Logout failed");
      })
      .finally(() => {
        navigate("/");
      });
  };
  const { user } = useContext(UserContext);
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
        <HeaderTextButton onClick={() => navigate("/profile_choice")}>
          My profile
        </HeaderTextButton>
        {user ? (
          <PrimaryButton onClick={handleLogout}>Logout</PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={() => {
              navigate("/login");
            }}
          >
            Login
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
