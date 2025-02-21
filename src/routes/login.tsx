import styled from "styled-components";
import { PrimaryButton } from "../components/button";
import { useRef } from "react";
import { LoginInput } from "../components/input";
import { useNavigate } from "react-router";
import { VerticalDivider } from "../components/divider";

export const LoginDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 320px;
  gap: 32px;
`;

export const ButtonsDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 320px;
`;

export default function Login() {
  const username = useRef("");
  const password = useRef("");
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "32px",
          height: "40%",
        }}
      >
        <LoginDiv>
          <div>
            <LoginInput
              defaultValue={""}
              onChange={(e) => (username.current = e.target.value)}
              placeholder="Username"
            />
            <LoginInput
              defaultValue={""}
              onChange={(e) => (password.current = e.target.value)}
              placeholder="Password"
              type="password"
            />
          </div>
          <PrimaryButton
            onClick={() => console.log(username.current, password.current)}
          >
            Sign in
          </PrimaryButton>
        </LoginDiv>
        <VerticalDivider />
        <ButtonsDiv>
          <p>Don't have an account?</p>
          <PrimaryButton onClick={() => navigate("/signup")}>
            Sign up
          </PrimaryButton>
          <p>Forgot your password?</p>
          <PrimaryButton>Forgot password</PrimaryButton>
        </ButtonsDiv>
      </div>
    </div>
  );
}
