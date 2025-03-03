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

export const SearchInput = styled.input`
  width: 320px;
  padding: 8px;
  border-radius: 16px;
  border: 1px solid #ccc;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;
