import styled from "styled-components";
import { PrimaryButton, GrayButton, OutlinedButton } from "./button";
import { useNavigate, useLocation } from "react-router";
import { useContext, useState, useEffect } from "react";
import { UserContext } from "../App";
import { logout } from "../api/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Close, Login, Logout, SwapHoriz } from "@mui/icons-material";
import { DesktopOnly, MobileOnly } from "./reactive";
import { COMPACT_MEDIA } from "../lib/constants";
import theme from "../theme";
import Logo from "./logo";
import { useLanguage } from "../lib/language_context";

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: background-color 0.3s ease;
  width: 100%;
  height: 64px;
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

  @media ${COMPACT_MEDIA} {
    padding: 0 16px;
    padding-right: 48px;
  }
`;

const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 24px;
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

const LangToggle = styled.div`
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  overflow: hidden;
`;

const LangOption = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(props) => (props.$active ? theme.primary : "transparent")};
  color: ${(props) => (props.$active ? "white" : theme.textPrimary)};
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
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
  height: 100dvh;
  background: white;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  padding: 80px 32px 32px;
  gap: 20px;
  overflow-y: auto;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  transform: translateX(${(props) => (props.$isOpen ? "0" : "100%")});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const MobileBackdrop = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
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
  const { language, setLanguage } = useLanguage();

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

  // Bilingual nav labels. Only these top-level items are translated for now;
  // the rest of the app stays in English until further localization.
  const navItems = [
    { en: "Growth Chart", ko: "근시성장곡선", path: `/axial_length_growth/${role}`, show: true },
    { en: "News", ko: "최신논문", path: "/news", show: true },
    { en: "Who We Are", ko: "참여병원", path: "/who_we_are", show: true },
    { en: "Treatments", ko: "근시치료", path: "/treatments", show: true },
    { en: "User Guide", ko: "사용법", path: "/user-guide", show: true },
    { en: "Profile", ko: "사용자설정", path: "/profile", show: true },
  ];
  const labelOf = (item: { en: string; ko: string }) =>
    language === "ko" ? item.ko : item.en;

  const langToggle = (
    <LangToggle role="group" aria-label="language">
      <LangOption $active={language === "ko"} onClick={() => setLanguage("ko")}>
        KOR
      </LangOption>
      <LangOption $active={language === "en"} onClick={() => setLanguage("en")}>
        ENG
      </LangOption>
    </LangToggle>
  );

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
          <Logo onClick={() => navigate("/")} />

          <DesktopOnly>
            <DesktopNav>
              {navItems.map((item) => (
                <NavLink
                  key={item.en}
                  $isActive={location.pathname.includes(item.path)}
                  onClick={() => navigate(item.path)}
                >
                  {labelOf(item)}
                </NavLink>
              ))}
            </DesktopNav>
          </DesktopOnly>

          <DesktopOnly>
            <RightSection>
              {langToggle}
              {user && (
                <OutlinedButton
                  style={{ padding: "8px 18px", fontSize: "13px", borderRadius: "20px" }}
                  onClick={() => navigate("/choose_profile")}
                >
                  <SwapHoriz style={{ fontSize: "16px" }} />
                  User Type
                </OutlinedButton>
              )}
              {user ? (
                <GrayButton
                  style={{ padding: "8px 18px", fontSize: "13px", borderRadius: "20px", backgroundColor: "#444" }}
                  onClick={handleLogout}
                >
                  <Logout style={{ fontSize: "16px" }} />
                  Logout
                </GrayButton>
              ) : (
                <PrimaryButton
                  style={{ padding: "8px 18px", fontSize: "13px", borderRadius: "20px" }}
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
            key={item.en}
            $isActive={location.pathname.includes(item.path)}
            onClick={() => navigate(item.path)}
          >
            {labelOf(item)}
          </MobileNavLink>
        ))}
        <MobileButtonsSection>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {langToggle}
          </div>
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
