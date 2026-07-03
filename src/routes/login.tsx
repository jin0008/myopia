import styled from "styled-components";
import { useRef, useState } from "react";
import { LoginInput } from "../components/input";
import { useNavigate } from "react-router";
import { googleLogin, passwordLogin } from "../api/auth";
import { HttpError } from "../lib/fetch";
import { useQueryClient } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { MOBILE_MEDIA } from "../lib/constants";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import theme from "../theme";
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

  @media ${MOBILE_MEDIA} {
    margin-bottom: 32px;
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

const OptionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 4px 0 16px;
  font-size: 14px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${theme.textSecondary};
  cursor: pointer;
  font-size: 14px;
`;

const ForgotLink = styled.span`
  color: ${theme.textPrimary};
  font-weight: 500;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
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

const SignupRow = styled.div`
  text-align: center;
  margin-top: 20px;
  font-size: 15px;
  color: ${theme.textSecondary};
`;

const SignupLink = styled.span`
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

export const ContainerDiv = styled.div`
  display: flex;
  gap: 32px;
  height: 40%;

  @media ${MOBILE_MEDIA} {
    flex-direction: column;
    height: fit-content;
  }
`;

export default function Login() {
  const username = useRef("");
  const password = useRef("");
  const [showPassword, setShowPassword] = useState(false);
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
    <PageWrapper>
      <LogoContainer>
        <Logo size="large" />
      </LogoContainer>

      <FormContainer>
        <LoginInput
          defaultValue={""}
          onChange={(e) => (username.current = e.target.value)}
          placeholder="Username"
        />
        <PasswordWrapper>
          <LoginInput
            defaultValue={""}
            onChange={(e) => (password.current = e.target.value)}
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
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

        <OptionsRow>
          <CheckboxLabel>
            <input type="checkbox" /> Stay Sign in
          </CheckboxLabel>
          <ForgotLink>Forgot your password?</ForgotLink>
        </OptionsRow>

        <SubmitButton onClick={() => handleLogin()}>Sign in</SubmitButton>

        <SignupRow>
          Don't have an account?
          <SignupLink onClick={() => navigate("/signup")}>Sign up</SignupLink>
        </SignupRow>

        <Divider>OR</Divider>

        <GoogleButtonWrapper>
          <GoogleLogin
            shape="rectangular"
            size="large"
            width="460"
            text="continue_with"
            locale="ko"
            useOneTap={true}
            onSuccess={(response) => {
              if (response.credential) handleGoogleLogin(response.credential);
            }}
          />
        </GoogleButtonWrapper>
      </FormContainer>
    </PageWrapper>
  );
}
