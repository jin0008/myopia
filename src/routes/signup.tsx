import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { PrimaryButton } from "../components/button";
import { VerticalDivider } from "../components/divider";
import { LoginInput } from "../components/input";
import { ButtonsDiv, LoginDiv } from "./login";

export default function Signup() {
  const username = useRef("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const email = useRef("");
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
              placeholder="Username"
              onChange={(e) => (username.current = e.target.value)}
            />
            <LoginInput
              defaultValue={""}
              placeholder="Password"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <LoginInput
              defaultValue={""}
              placeholder="Confirm Password"
              type="password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={
                password !== confirmPassword
                  ? { border: "1px solid red" }
                  : undefined
              }
            />
            <LoginInput
              defaultValue={""}
              placeholder="Email(optional)"
              type="email"
              onChange={(e) => (email.current = e.target.value)}
            />
          </div>
          <PrimaryButton>Sign up</PrimaryButton>
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
