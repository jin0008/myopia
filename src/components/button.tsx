import styled from "styled-components";
import theme from "../theme";

export const PrimaryButton = styled.button`
  background-color: ${theme.primary};
  color: white;
  padding: 10px 24px;
  border-radius: 24px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.2s, transform 0.15s;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PrimaryNagativeButton = styled(PrimaryButton)`
  background-color: ${theme.secondary};
`;

export const OutlinedButton = styled(PrimaryButton)`
  background-color: transparent;
  color: ${theme.primary};
  border: 1.5px solid ${theme.primary};

  &:hover {
    background-color: ${theme.primary10};
  }
`;

export const BlackButton = styled(PrimaryButton)`
  background-color: #1d1d1f;

  &:hover {
    background-color: #333;
  }
`;

export const GrayButton = styled(PrimaryButton)`
  background-color: #b0b0b0;

  &:hover {
    background-color: #999;
  }
`;

export const DangerButton = styled(PrimaryButton)`
  background-color: ${theme.danger};
`;
