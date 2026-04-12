import styled from "styled-components";
import { PrimaryButton, GrayButton, OutlinedButton } from "./button";
import { useNavigate, useLocation } from "react-router";
import { useContext, useState, useEffect } from "react";
import { UserContext } from "../App";
import { logout } from "../api/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Close, Login, Logout, SwapHoriz } from "@mui/icons-material";
import { DesktopOnly, MobileOnly } from "./reactive";
import { MOBILE_MEDIA } from "../lib/constants";
import theme from "../theme";

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: background-color 0.3s ease;
  width: 100%;
  height: 60px;
  background-color: white;
  align-content: center;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
`;

const NavContent = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;

  @media ${MOBILE_MEDIA} {
    padding: 0 16px;
    padding-right: 48px;
  }
`;

const LogoText = styled.div`
  cursor: pointer;
  z-index: 1002;
  line-height: 1.1;
  font-weight: 800;
  color: ${theme.primary};
  font-size: 16px;
  letter-spacing: -0.02em;
  user-select: none;
  transition: opacity 0.2s;
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }

  @media ${MOBILE_MEDIA} {
    font-size: 14px;
  }
`;

const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 32px;
`;

const NavLink = styled.span<{ $isActive?: boolean }>`
  font-size: 14px;
  color: ${(props) =>
    props.$isActive ? theme.primary : theme.textPrimary};
  cursor: pointer;
  transition: color 0.2s;
  font-weight: ${(props) => (props.$isActive ? "600" : "400")};
  white-space: nowrap;

  &:hover {
    color: ${theme.primary};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const MobileMenuButton = styled.div`
  position: absolute;
  height: 24px;
  width: 24px;
  top: 18px;
  right: 16px;
  cursor: pointer;
  z-index: 1002;
  color: var(--primary-text);
`;

const MobileOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 70%;
  max-width: 300px;
  height: 100vh;
  background: white;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  padding: 80px 32px 32px;
  gap: 32px;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  transform: translateX(${(props) => (props.$isOpen ? "0" : "100%")});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const MobileBackdrop = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  pointer-events: ${(props) => (props.$isOpen ? "all" : "none")};
  transition: opacity 0.3s ease;
`;

const MobileNavLink = styled.span<{ $isActive?: boolean }>`
  font-size: 18px;
  font-weight: ${(props) => (props.$isActive ? "600" : "400")};
  color: ${(props) =>
    props.$isActive ? theme.primary : theme.textPrimary};
  cursor: pointer;

  &:active {
    opacity: 0.6;
  }
`;

const MobileButtonsSection = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export default function Header() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useContext(UserContext);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout()
      .then(() => queryClient.invalidateQueries({ queryKey: ["currentUser"] }))
      .catch(() => alert("Logout failed"))
      .finally(() => navigate("/login"));
  };

  const navItems = [
    { label: "Growth Chart", path: `/axial_length_growth/${role}`, show: true },
    { label: "News", path: "/news", show: true },
    { label: "Who We Are", path: "/who_we_are", show: true },
    { label: "Treatments", path: "/treatments", show: true },
    { label: "User Guide", path: "/user-guide", show: true },
    { label: "Profile", path: "/profile", show: true },
  ];

  return (
    <>
      <HeaderContainer
        style={
          isScrolled
            ? {
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }
            : undefined
        }
      >
        <NavContent>
          <LogoText onClick={() => navigate("/")}>
            Myopia<br />Management
          </LogoText>

          <DesktopOnly>
            <DesktopNav>
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  $isActive={location.pathname.includes(item.path)}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </NavLink>
              ))}
            </DesktopNav>
          </DesktopOnly>

          <DesktopOnly>
            <RightSection>
              {user && (
                <OutlinedButton
                  style={{ padding: "6px 16px", fontSize: "13px" }}
                  onClick={() => navigate("/choose_profile")}
                >
                  <SwapHoriz style={{ fontSize: "16px" }} />
                  User Type
                </OutlinedButton>
              )}
              {user ? (
                <GrayButton
                  style={{ padding: "6px 16px", fontSize: "13px" }}
                  onClick={handleLogout}
                >
                  <Logout style={{ fontSize: "16px" }} />
                  Logout
                </GrayButton>
              ) : (
                <PrimaryButton
                  style={{ padding: "6px 16px", fontSize: "13px" }}
                  onClick={() => navigate("/login")}
                >
                  <Login style={{ fontSize: "16px" }} />
                  Login
                </PrimaryButton>
              )}
            </RightSection>
          </DesktopOnly>

          <MobileOnly>
            <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)}>
              <Menu />
            </MobileMenuButton>
          </MobileOnly>
        </NavContent>
      </HeaderContainer>

      <MobileBackdrop
        $isOpen={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <MobileOverlay $isOpen={isMobileMenuOpen}>
        <div
          style={{ position: "absolute", top: "18px", right: "16px", cursor: "pointer" }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Close />
        </div>
        {navItems.map((item) => (
          <MobileNavLink
            key={item.label}
            $isActive={location.pathname.includes(item.path)}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </MobileNavLink>
        ))}
        <MobileButtonsSection>
          {user && (
            <PrimaryButton
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => navigate("/choose_profile")}
            >
              <SwapHoriz style={{ fontSize: "18px" }} />
              User Type
            </PrimaryButton>
          )}
          {user ? (
            <GrayButton
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleLogout}
            >
              <Logout style={{ fontSize: "18px" }} />
              Logout
            </GrayButton>
          ) : (
            <PrimaryButton
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => navigate("/login")}
            >
              <Login style={{ fontSize: "18px" }} />
              Login
            </PrimaryButton>
          )}
        </MobileButtonsSection>
      </MobileOverlay>
    </>
  );
}
