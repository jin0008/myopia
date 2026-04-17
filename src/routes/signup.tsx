import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { LoginInput } from "../components/input";
import { signupWithGoogleAuth, signupWithPasswordAuth } from "../api/auth";
import { HttpError } from "../lib/fetch";
import { GoogleLogin } from "@react-oauth/google";
import styled from "styled-components";
import theme from "../theme";
import { MOBILE_MEDIA } from "../lib/constants";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Logo from "../components/logo";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;

  & > div {
    align-items: center;
    & span:first-child {
      font-size: 3rem;
    }
    & span:last-child {
      font-size: 11px;
    }
  }

  @media ${MOBILE_MEDIA} {
    margin-bottom: 32px;
    & > div span:first-child {
      font-size: 2.4rem;
    }
  }
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const EyeButton = styled.button`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  display: flex;
  align-items: center;
  padding: 0;

  &:hover {
    color: #666;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${theme.textSecondary};
  cursor: pointer;
  font-size: 14px;
  margin: 8px 0 16px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background-color: #e8e8e8;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #ddd;
  }
`;

const SigninRow = styled.div`
  text-align: center;
  margin-top: 20px;
  font-size: 15px;
  color: ${theme.textSecondary};
`;

const SigninLink = styled.span`
  color: ${theme.primary};
  font-weight: 600;
  cursor: pointer;
  margin-left: 6px;

  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  color: #ccc;
  font-size: 14px;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background-color: #e0e0e0;
  }
`;

const GoogleButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;

  & > div {
    width: 100% !important;
  }
`;

export default function Signup() {
  const username = useRef("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [receiveEmailUpdates, setReceiveEmailUpdates] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <PageWrapper>
      <LogoContainer>
        <Logo />
      </LogoContainer>

      <FormContainer>
        <LoginInput
          defaultValue={""}
          placeholder="Username"
          onChange={(e) => (username.current = e.target.value)}
        />
        <PasswordWrapper>
          <LoginInput
            defaultValue={""}
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <EyeButton
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <VisibilityOff fontSize="small" />
            ) : (
              <Visibility fontSize="small" />
            )}
          </EyeButton>
        </PasswordWrapper>
        <PasswordWrapper>
          <LoginInput
            defaultValue={""}
            placeholder="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={
              password !== confirmPassword && confirmPassword
                ? { borderColor: theme.danger }
                : undefined
            }
          />
          <EyeButton
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <VisibilityOff fontSize="small" />
            ) : (
              <Visibility fontSize="small" />
            )}
          </EyeButton>
        </PasswordWrapper>
        <LoginInput
          defaultValue={""}
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <CheckboxLabel>
          <input
            type="checkbox"
            checked={receiveEmailUpdates}
            onChange={(e) => setReceiveEmailUpdates(e.target.checked)}
          />
          Receive Email Updates:
        </CheckboxLabel>

        <SubmitButton onClick={handleSignup}>Sign up</SubmitButton>

        <SigninRow>
          Already have an account?
          <SigninLink onClick={() => navigate("/login")}>Sign in</SigninLink>
        </SigninRow>

        <Divider>OR</Divider>

        <GoogleButtonWrapper>
          <GoogleLogin
            text="signup_with"
            size="large"
            shape="rectangular"
            width="460"
            locale="ko"
            onSuccess={(response) => {
              if (response.credential) handleGoogleSignup(response.credential);
            }}
          />
        </GoogleButtonWrapper>
      </FormContainer>
    </PageWrapper>
  );
}
