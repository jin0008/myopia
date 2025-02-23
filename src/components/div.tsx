import styled from "styled-components";

export const CenteredDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

export const TopDiv = styled(CenteredDiv)`
  justify-content: start;
`;
