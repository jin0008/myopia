import styled from "styled-components";
import theme from "../theme";

export const LoginInput = styled.input`
  width: calc(100% - 16px);
  padding: 8px;
  margin: 8px 0;
  border-radius: 8px;
  border: 1px solid #ccc;

  &:focus {
    outline: none;
    border: 1px solid ${theme.primary};
  }
`;

export const TextInput = styled.input`
  width: 95%;
  padding: 8px 0;
  margin: 8px 0;
  border-radius: 8px;
  border: 1px solid #ccc;
  background-color: white;
  display: block;

  &:user-invalid {
    border: 1px solid red;
  }
`;
