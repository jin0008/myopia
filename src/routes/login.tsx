import styled from "styled-components";
import { PrimaryButton } from "../components/button";
import { useRef } from "react";
import { LoginInput } from "../components/input";
import { useNavigate } from "react-router";
import { VerticalDivider } from "../components/divider";
import { googleLogin, passwordLogin } from "../api/auth";
import { HttpError } from "../lib/fetch";
import { useQueryClient } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";

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
  const queryClient = useQueryClient();

  function handleLogin() {
    passwordLogin(username.current, password.current)
      .then(() => navigate("/choose_profile"))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        queryClient.invalidateQueries({ queryKey: ["hospital"] });
      })
      .catch((e: HttpError) => {
        console.error(e);
        alert("Login failed\n" + e.message);
      });
  }

  function handleGoogleLogin(token: string) {
    googleLogin(token)
      .then(() => navigate("/choose_profile"))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        queryClient.invalidateQueries({ queryKey: ["hospital"] });
      })
      .catch((e: HttpError) => {
        console.error(e);
        alert("Login failed\n" + e.message);
      });
  }

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
          <PrimaryButton onClick={() => handleLogin()}>Sign in</PrimaryButton>
          <GoogleLogin
            shape="pill"
            text="signin_with"
            useOneTap={true}
            onSuccess={(response) => {
              if (response.credential) handleGoogleLogin(response.credential);
            }}
          />
        </LoginDiv>
        <VerticalDivider />
        <ButtonsDiv>
          <p>Don't have an account?</p>
          <PrimaryButton onClick={() => navigate("/signup")}>
            Sign up
          </PrimaryButton>
          {/* <p>Forgot your password?</p>
          <PrimaryButton>Forgot password</PrimaryButton> */}
        </ButtonsDiv>
      </div>
    </div>
  );
}
