import styled from "styled-components";
import theme from "../theme";
import { MOBILE_MEDIA } from "../lib/constants";

const LogoWrapper = styled.div`
  cursor: pointer;
  z-index: 1002;
  user-select: none;
  transition: opacity 0.2s;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  line-height: 1;

  &:hover {
    opacity: 0.8;
  }
`;

const LogoText = styled.span`
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: ${theme.textPrimary};

  @media ${MOBILE_MEDIA} {
    font-size: 22px;
  }
`;

const GreenO = styled.span`
  color: ${theme.primary};
`;

const SubText = styled.span`
  font-size: 9px;
  font-weight: 500;
  color: ${theme.primary};
  letter-spacing: 0.02em;
  margin-top: 2px;

  @media ${MOBILE_MEDIA} {
    font-size: 8px;
  }
`;

export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <LogoWrapper onClick={onClick}>
      <LogoText>
        eyel<GreenO>o</GreenO>g
      </LogoText>
      <SubText>아이로그 근시관리프로그램</SubText>
    </LogoWrapper>
  );
}
