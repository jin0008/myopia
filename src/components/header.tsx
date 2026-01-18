import styled from "styled-components";
import logo from "../assets/logo.svg";

import { PrimaryButton } from "./button";
import { Link, useNavigate, useLocation } from "react-router";
import { useContext, useState, useEffect } from "react";
import { UserContext } from "../App";
import { logout } from "../api/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Close } from "@mui/icons-material";

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: background-color 0.3s ease;
  width: 100%;
`;

const NavContent = styled.div`
  max-width: 980px;
  margin: 0 auto;
  height: 54px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
`;

const Logo = styled.img`
  height: 24px;
  cursor: pointer;
  transition: opacity 0.2s;
  z-index: 1002; /* Above mobile menu */
  
  &:hover {
    opacity: 0.8;
  }
`;

const DesktopLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenuButton = styled.div`
  display: none;
  cursor: pointer;
  z-index: 1002;
  color: var(--primary-text);
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 40px;
  opacity: ${props => props.$isOpen ? 1 : 0};
  pointer-events: ${props => props.$isOpen ? 'all' : 'none'};
  transition: opacity 0.3s ease;
`;

const MobileNavLink = styled.span<{ $isActive?: boolean }>`
  font-size: 24px;
  font-weight: 600;
  color: ${props => props.$isActive ? 'var(--link-color)' : 'var(--primary-text)'};
  cursor: pointer;
  
  &:active {
    opacity: 0.6;
  }
`;

const NavLink = styled.span<{ $isActive?: boolean }>`
  font-size: 13px;
  color: ${props => props.$isActive ? 'var(--primary-text)' : 'var(--secondary-text)'};
  cursor: pointer;
  transition: color 0.2s;
  font-weight: 500;
  
  &:hover {
    color: var(--link-color);
  }
`;

const UserInfo = styled.div`
  font-size: 11px;
  color: var(--secondary-text);
  margin-right: 15px;
  
  @media (max-width: 768px) {
    display: none;
  }
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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
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
      <HeaderContainer className={isScrolled ? "glass" : ""}>
        <NavContent>
          <Logo src={logo} alt="logo" onClick={() => navigate("/")} />

          <DesktopLinks>
            {navItems.map(item => (
              <NavLink
                key={item.label}
                $isActive={location.pathname.includes(item.path)}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </NavLink>
            ))}
          </DesktopLinks>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {user && (
              <UserInfo>
                {role} (<Link to="/choose_profile" style={{ color: 'inherit', textDecoration: 'underline' }}>change</Link>)
              </UserInfo>
            )}

            <div className="desktop-only" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
              {user ? (
                <PrimaryButton
                  style={{ padding: '4px 12px', fontSize: '12px', height: 'auto', borderRadius: '12px' }}
                  onClick={handleLogout}
                >
                  Logout
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  style={{ padding: '4px 12px', fontSize: '12px', height: 'auto', borderRadius: '12px' }}
                  onClick={() => navigate("/login")}
                >
                  Login
                </PrimaryButton>
              )}
            </div>

            <MobileMenuButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <Close /> : <Menu />}
            </MobileMenuButton>
          </div>
        </NavContent>
      </HeaderContainer>

      <MobileOverlay $isOpen={isMobileMenuOpen}>
        {navItems.map(item => (
          <MobileNavLink
            key={item.label}
            $isActive={location.pathname.includes(item.path)}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </MobileNavLink>
        ))}
        {user ? (
          <PrimaryButton onClick={handleLogout} style={{ marginTop: '20px' }}>Logout</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => navigate("/login")} style={{ marginTop: '20px' }}>Login</PrimaryButton>
        )}
      </MobileOverlay>
    </>
  );
}
