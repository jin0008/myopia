import { useIsMobile } from "../hooks/is_mobile";

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
