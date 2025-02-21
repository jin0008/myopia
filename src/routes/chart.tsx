import styled from "styled-components";
import theme from "../theme";

const HeaderTextDiv = styled.div`
  background-color: ${theme.primary};
  width: 320px;
  color: white;
  padding: 16px 0;
  text-align: center;
  border-radius: 8px;
`;

const HeaderDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 32px 64px 0;
`;

const ChartTitleDiv = styled.div`
  font-size: large;
`;

export default function Chart() {
  return (
    <div>
      <HeaderDiv>
        <HeaderTextDiv>ID:asldkasjdlaskd</HeaderTextDiv>

        <HeaderTextDiv>test hospital</HeaderTextDiv>
      </HeaderDiv>
    </div>
  );
}
