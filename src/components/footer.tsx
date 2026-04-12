import styled from "styled-components";
import { Link } from "react-router";

const FooterContainer = styled.footer`
  background-color: white;
  width: 100%;
  height: 48px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
`;

const NavContent = styled.div`
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;

  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
`;

const FooterLink = styled(Link)`
  font-size: 13px;
  color: var(--secondary-text);
  cursor: pointer;
  transition: color 0.2s;
  font-weight: 400;
  text-decoration: none;

  &:hover {
    color: var(--primary-text);
    text-decoration: none;
  }
`;

export default function Footer() {
  return (
    <FooterContainer>
      <NavContent>
        <FooterLink to="/tos">Terms of service</FooterLink>
      </NavContent>
    </FooterContainer>
  );
}
