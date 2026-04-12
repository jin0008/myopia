import styled from "styled-components";
import theme from "../theme";

export const LoginInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  margin: 6px 0;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  font-size: 15px;
  background-color: #fff;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.primary};
  }

  &:user-invalid {
    border-color: ${theme.danger};
  }

  &::placeholder {
    color: #aaa;
  }
`;

export const TextInput = styled.input`
  width: 95%;
  padding: 10px 12px;
  margin: 6px 0;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  background-color: white;
  display: block;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.primary};
  }

  &:user-invalid {
    border-color: ${theme.danger};
  }
`;

export const SearchInput = styled.input`
  width: 320px;
  padding: 10px 16px;
  border-radius: 24px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  background-color: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.primary};
  }
`;
