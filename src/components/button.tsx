import styled from "styled-components";
import theme from "../theme";

export const PrimaryButton = styled.button`
  background-color: ${theme.primary};
  color: white;
  padding: 8px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
`;

export const PrimaryNagativeButton = styled(PrimaryButton)`
  background-color: ${theme.secondary};
`;
