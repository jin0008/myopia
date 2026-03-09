import styled from "styled-components";
import { Link } from "react-router";

const FooterContainer = styled.footer`
  background-color: white;
  width: 100%;
  height: 48px;
`;

const NavContent = styled.div`
  height: 100%;
  max-width: 1080px;
  margin: 0 auto;

  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
`;

const FooterLink = styled(Link)`
  font-size: 13px;
  color: var(--secondary-text);
  cursor: pointer;
  transition: color 0.2s;
  font-weight: 500;
`;

export default function Footer() {
  return (
    <FooterContainer>
      <NavContent>
        <FooterLink to="/tos">terms of service</FooterLink>
      </NavContent>
    </FooterContainer>
  );
}
