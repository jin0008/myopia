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
