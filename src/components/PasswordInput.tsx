import styled from "styled-components";
import { useState, type InputHTMLAttributes } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { LoginInput, TextInput } from "./input";

const Wrapper = styled.div<{ $width?: string }>`
  position: relative;
  width: ${(p) => p.$width ?? "100%"};
`;

const EyeButton = styled.button`
  position: absolute;
  right: 12px;
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

/**
 * 눈 모양 버튼으로 입력한 비밀번호를 보여 주는 칸. 규칙이 까다로워져서
 * (대·소문자·숫자·특수문자) 무엇을 쳤는지 확인할 수 있어야 덜 틀린다.
 * variant: 로그인 화면 계열은 "login", 대화상자 안의 작은 칸은 "text".
 */
export function PasswordInput({
  variant = "login",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { variant?: "login" | "text" }) {
  const [shown, setShown] = useState(false);
  const Input = variant === "login" ? LoginInput : TextInput;
  return (
    <Wrapper $width={variant === "text" ? "95%" : undefined}>
      <Input
        {...props}
        type={shown ? "text" : "password"}
        style={{ ...props.style, paddingRight: 40, width: "100%" }}
      />
      <EyeButton
        type="button"
        onClick={() => setShown(!shown)}
        aria-label={shown ? "Hide password" : "Show password"}
      >
        {shown ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </EyeButton>
    </Wrapper>
  );
}
