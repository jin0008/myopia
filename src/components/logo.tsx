import styled from "styled-components";
import { MOBILE_MEDIA } from "../lib/constants";
import eyeLogSvg from "../assets/eyelog-logo.svg";

const LogoWrapper = styled.div`
  cursor: pointer;
  z-index: 1002;
  user-select: none;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 0.8;
  }
`;

const LogoImage = styled.img`
  height: 40px;
  width: auto;

  @media ${MOBILE_MEDIA} {
    height: 32px;
  }
`;

export default function Logo({
  onClick,
  size,
}: {
  onClick?: () => void;
  size?: "large" | "default";
}) {
  return (
    <LogoWrapper onClick={onClick}>
      <LogoImage
        src={eyeLogSvg}
        alt="eyelog 아이로그 근시관리프로그램"
        style={size === "large" ? { height: "64px" } : undefined}
      />
    </LogoWrapper>
  );
}
