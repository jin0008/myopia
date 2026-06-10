import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { LoginInput } from "../components/input";
import {
  signupWithGoogleAuth,
  signupWithPasswordAuth,
  SignupConsents,
} from "../api/auth";
import { HttpError } from "../lib/fetch";
import { GoogleLogin } from "@react-oauth/google";
import styled from "styled-components";
import theme from "../theme";
import { MOBILE_MEDIA } from "../lib/constants";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Logo from "../components/logo";
import ConfirmDialog from "../components/dialog";
import { TERMS_OF_SERVICE, PRIVACY_CONSENT, MARKETING_CONSENT } from "../consent";

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

const ConsentBox = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 14px;
  margin: 12px 0 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ConsentAllRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${theme.textPrimary};
  cursor: pointer;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
`;

const ConsentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
`;

const ConsentLeft = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${theme.textSecondary};
  cursor: pointer;
`;

const RequiredTag = styled.span`
  color: ${theme.primary};
  font-weight: 600;
`;

const OptionalTag = styled.span`
  color: #aaa;
`;

const ViewLink = styled.button`
  background: none;
  border: none;
  color: ${theme.textSecondary};
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${theme.primary};
  }
`;

const ConsentText = styled.div`
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
  color: ${theme.textPrimary};
  max-width: 520px;
`;

const SubmitButton = styled.button<{ $enabled: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background-color: ${(p) => (p.$enabled ? theme.primary : "#e8e8e8")};
  color: ${(p) => (p.$enabled ? "#fff" : "#666")};
  font-size: 16px;
  font-weight: 500;
  cursor: ${(p) => (p.$enabled ? "pointer" : "not-allowed")};
  transition: all 0.2s;

  &:hover {
    background-color: ${(p) => (p.$enabled ? "#00a05d" : "#ddd")};
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

type DocKey = "terms" | "privacy" | "marketing" | null;

const DOCS = {
  terms: { title: "이용약관", body: TERMS_OF_SERVICE },
  privacy: { title: "개인정보 수집·이용 동의", body: PRIVACY_CONSENT },
  marketing: { title: "마케팅 정보 수신 동의", body: MARKETING_CONSENT },
};

export default function Signup() {
  const username = useRef("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [openDoc, setOpenDoc] = useState<DocKey>(null);

  const navigate = useNavigate();

  const requiredAgreed = agreeTerms && agreePrivacy;
  const allAgreed = agreeTerms && agreePrivacy && agreeMarketing;

  function toggleAll(checked: boolean) {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  }

  function buildConsents(): SignupConsents {
    return {
      agree_terms: true,
      agree_privacy: true,
      agree_marketing: agreeMarketing,
    };
  }

  function handleSignup() {
    if (!requiredAgreed) {
      alert("필수 동의 항목에 동의해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    signupWithPasswordAuth(username.current, password, email, buildConsents())
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
    if (!requiredAgreed) {
      alert("필수 동의 항목에 동의한 뒤 Google 계정으로 가입해 주세요.");
      return;
    }
    signupWithGoogleAuth(token, buildConsents())
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
        <Logo size="large" />
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

        <ConsentBox>
          <ConsentAllRow>
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={(e) => toggleAll(e.target.checked)}
            />
            전체 동의 (선택 항목 포함)
          </ConsentAllRow>

          <ConsentRow>
            <ConsentLeft>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                <RequiredTag>[필수]</RequiredTag> 이용약관 동의
              </span>
            </ConsentLeft>
            <ViewLink type="button" onClick={() => setOpenDoc("terms")}>
              보기
            </ViewLink>
          </ConsentRow>

          <ConsentRow>
            <ConsentLeft>
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
              />
              <span>
                <RequiredTag>[필수]</RequiredTag> 개인정보 수집·이용 동의
              </span>
            </ConsentLeft>
            <ViewLink type="button" onClick={() => setOpenDoc("privacy")}>
              보기
            </ViewLink>
          </ConsentRow>

          <ConsentRow>
            <ConsentLeft>
              <input
                type="checkbox"
                checked={agreeMarketing}
                onChange={(e) => setAgreeMarketing(e.target.checked)}
              />
              <span>
                <OptionalTag>[선택]</OptionalTag> 마케팅 정보 수신 동의
              </span>
            </ConsentLeft>
            <ViewLink type="button" onClick={() => setOpenDoc("marketing")}>
              보기
            </ViewLink>
          </ConsentRow>
        </ConsentBox>

        <SubmitButton $enabled={requiredAgreed} onClick={handleSignup}>
          Sign up
        </SubmitButton>

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

      <ConfirmDialog
        open={openDoc !== null}
        title={openDoc ? DOCS[openDoc].title : ""}
        content={
          <ConsentText>{openDoc ? DOCS[openDoc].body : ""}</ConsentText>
        }
        onClose={() => setOpenDoc(null)}
        onConfirm={() => setOpenDoc(null)}
      />
    </PageWrapper>
  );
}
