import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { PrimaryButton } from "../components/button";
import { VerticalDivider } from "../components/divider";
import { LoginInput } from "../components/input";
import { ButtonsDiv, LoginDiv } from "./login";
import { signupWithGoogleAuth, signupWithPasswordAuth } from "../api/auth";
import { HttpError } from "../lib/fetch";
import { GoogleLogin } from "@react-oauth/google";

export default function Signup() {
  const username = useRef("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  function handleSignup() {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    signupWithPasswordAuth(username.current, password)
      .then(() => navigate("/login"))
      .catch((e: HttpError) => {
        console.error(e);
        alert("Signup failed\n" + e.message);
      });
  }

  function handleGoogleSignup(token: string) {
    signupWithGoogleAuth(token)
      .then(() => navigate("/login"))
      .catch((e: HttpError) => {
        console.error(e);
        alert("Signup failed\n" + e.message);
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
              placeholder="Username"
              onChange={(e) => (username.current = e.target.value)}
            />
            <LoginInput
              defaultValue={""}
              placeholder="Password"
              type="password"
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <LoginInput
              defaultValue={""}
              placeholder="Confirm Password"
              type="password"
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={
                password !== confirmPassword
                  ? { border: "1px solid red" }
                  : undefined
              }
            />
          </div>
          <PrimaryButton onClick={handleSignup}>Sign up</PrimaryButton>
          <GoogleLogin
            text="signup_with"
            width={200}
            onSuccess={(response) => {
              if (response.credential) handleGoogleSignup(response.credential);
            }}
          />
        </LoginDiv>
        <VerticalDivider />
        <ButtonsDiv>
          <p>Already have an account?</p>
          <PrimaryButton onClick={() => navigate("/login")}>
            Sign in
          </PrimaryButton>
        </ButtonsDiv>
      </div>
    </div>
  );
}
