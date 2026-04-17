import styled from "styled-components";
import theme from "../theme";
import { useNavigate } from "react-router";
import { useContext } from "react";
import { MOBILE_MEDIA } from "../lib/constants";
import { UserContext } from "../App";
import { ArrowForward } from "@mui/icons-material";

const PageWrapper = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 60px 24px 80px;

  @media ${MOBILE_MEDIA} {
    padding: 32px 16px 60px;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 40px;

  &::after {
    content: "";
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: ${theme.primary};
    border-radius: 50%;
    margin-left: 4px;
    vertical-align: super;
    font-size: 0.5em;
  }

  @media ${MOBILE_MEDIA} {
    font-size: 2rem;
    margin-bottom: 24px;
  }
`;

export const ContainerDiv = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  @media ${MOBILE_MEDIA} {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const CardDiv = styled.div`
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
`;

const CardImage = styled.div`
  width: 100%;
  height: 260px;
  background: linear-gradient(135deg, #f0f7f4 0%, #e8f5e9 50%, #d4edda 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media ${MOBILE_MEDIA} {
    height: 220px;
  }
`;

const CardContent = styled.div`
  padding: 28px;

  @media ${MOBILE_MEDIA} {
    padding: 20px;
  }
`;

const CardTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 8px;
`;

const CardDescription = styled.p`
  font-size: 15px;
  color: ${theme.textSecondary};
  line-height: 1.5;
  margin-bottom: 20px;
`;

const ChooseButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: ${theme.primary};
  color: white;
  border: none;
  border-radius: 24px;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

export default function ProfileChoice() {
  const navigate = useNavigate();
  const { setRole } = useContext(UserContext);
  return (
    <PageWrapper>
      <PageTitle>Choose User Type</PageTitle>
      <ContainerDiv>
        <CardDiv
          onClick={() => {
            setRole("regular_user");
            navigate("/");
          }}
        >
          <CardImage>
            <img src="https://images.unsplash.com/photo-1587654780290-bdf070ec39c5?w=600&h=400&fit=crop&crop=center" alt="Child playing" />
          </CardImage>
          <CardContent>
            <CardTitle style={{ fontStyle: "italic" }}>Regular User</CardTitle>
            <CardDescription>
              Register your children and track their axial length growth and
              treatment.
            </CardDescription>
            <ChooseButton>
              Choose <ArrowForward style={{ fontSize: "18px" }} />
            </ChooseButton>
          </CardContent>
        </CardDiv>
        <CardDiv
          onClick={() => {
            setRole("healthcare_professional");
            navigate("/");
          }}
        >
          <CardImage>
            <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=400&fit=crop&crop=center" alt="Healthcare Professional" />
          </CardImage>
          <CardContent>
            <CardTitle style={{ fontStyle: "italic" }}>Healthcare Professional</CardTitle>
            <CardDescription>
              Manage your patients. Register their axial length growth and
              treatment data.
            </CardDescription>
            <ChooseButton>
              Choose <ArrowForward style={{ fontSize: "18px" }} />
            </ChooseButton>
          </CardContent>
        </CardDiv>
      </ContainerDiv>
    </PageWrapper>
  );
}
