import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { PrimaryButton } from "../components/button";
import { VerticalDivider } from "../components/divider";
import { LoginInput } from "../components/input";
import { ButtonsDiv, LoginDiv } from "./login";
import { signupWithGoogleAuth, signupWithPasswordAuth } from "../api/auth";
import { HttpError } from "../lib/fetch";
import { GoogleLogin } from "@react-oauth/google";
import { Switch } from "@mui/material";
import theme from "../theme";

export default function Signup() {
  const username = useRef("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [receiveEmailUpdates, setReceiveEmailUpdates] = useState(false);
  const navigate = useNavigate();

  function handleSignup() {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    signupWithPasswordAuth(
      username.current,
      password,
      email,
      receiveEmailUpdates,
    )
      .then(() => {
        alert("Signup successful\nPlease login to continue");
        navigate("/login");
      })
      .catch((e: HttpError) => {
        console.error(e);
        alert("Signup failed\n" + e.message);
      });
  }

  function handleGoogleSignup(token: string) {
    signupWithGoogleAuth(token, false)
      .then(() => {
        alert("Signup successful\nPlease login to continue");
        navigate("/login");
      })
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
            <LoginInput
              defaultValue={""}
              placeholder="Email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "space-between",
              }}
            >
              Receive Email Updates:
              <Switch
                checked={receiveEmailUpdates}
                onChange={(e) => setReceiveEmailUpdates(e.target.checked)}
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: theme.primary,
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: "white",
                  },

                  "& .MuiSwitch-switchBase": {
                    "&.Mui-checked": {
                      "+ .MuiSwitch-track": {
                        backgroundColor: theme.primary,
                        opacity: 1,
                      },
                    },
                  },
                }}
              />
            </label>
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
