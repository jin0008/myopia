import { useIsMobile } from "../hooks/is_mobile";
import styled from "styled-components";
import { MOBILE_MEDIA } from "../lib/constants";

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return isMobile ? null : children;
}

export function MobileOnly({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return isMobile ? children : null;
}

export function Reactive({
  desktop,
  mobile,
}: {
  desktop: React.ReactNode;
  mobile: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  return isMobile ? mobile : desktop;
}

export const ReactiveFlex = styled.div`
  display: flex;
  flex-direction: row;

  @media ${MOBILE_MEDIA} {
    flex-direction: column;
  }
`;
