import styled from "styled-components";
import { MOBILE_MEDIA } from "../lib/constants";
import { treatments } from "../data/treatments";
import { Link } from "react-router";
import theme from "../theme";
import { ArrowForward } from "@mui/icons-material";

const PageContainer = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 60px 24px 100px;

  @media ${MOBILE_MEDIA} {
    padding: 32px 16px 80px;
  }
`;

const Header = styled.div`
  margin-bottom: 60px;

  @media ${MOBILE_MEDIA} {
    margin-bottom: 32px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${theme.textPrimary};
  margin-bottom: 8px;
  font-weight: 700;

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
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${theme.textSecondary};
  font-weight: 400;
`;

const TreatmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 64px;

  @media ${MOBILE_MEDIA} {
    gap: 40px;
  }
`;

const TreatmentRow = styled.div<{ $reverse?: boolean }>`
  display: flex;
  flex-direction: ${(props) => (props.$reverse ? "row-reverse" : "row")};
  align-items: center;
  gap: 48px;

  @media ${MOBILE_MEDIA} {
    flex-direction: column;
    gap: 24px;
  }
`;

const ImageSection = styled.div`
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
  background: #f8f9fa;

  img {
    width: 100%;
    height: 320px;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  &:hover img {
    transform: scale(1.03);
  }

  @media ${MOBILE_MEDIA} {
    width: 100%;

    img {
      height: 240px;
    }
  }
`;

const TextSection = styled.div`
  flex: 1;
`;

const GreenDot = styled.div`
  width: 12px;
  height: 12px;
  background-color: ${theme.primary};
  border-radius: 50%;
  margin-bottom: 16px;
`;

const TreatmentTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 12px;
  line-height: 1.3;
`;

const TreatmentDescription = styled.p`
  font-size: 15px;
  color: ${theme.textSecondary};
  line-height: 1.6;
  margin-bottom: 20px;
`;

const DetailLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${theme.primary};
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: gap 0.2s;

  &:hover {
    gap: 8px;
    text-decoration: none;
  }
`;

export default function Treatments() {
  return (
    <PageContainer>
      <Header>
        <Title>Treatments</Title>
        <Subtitle>Advanced solutions for myopia control.</Subtitle>
      </Header>

      <TreatmentList>
        {treatments.map((treatment, index) => (
          <TreatmentRow key={treatment.id} $reverse={index % 2 === 1}>
            <ImageSection>
              <img src={treatment.imageUrl} alt={treatment.title} />
            </ImageSection>
            <TextSection>
              <GreenDot />
              <TreatmentTitle>{treatment.title}</TreatmentTitle>
              <TreatmentDescription>
                {treatment.shortDescription}
              </TreatmentDescription>
              <DetailLink to={`/treatments/${treatment.id}`}>
                Detail <ArrowForward style={{ fontSize: "16px" }} />
              </DetailLink>
            </TextSection>
          </TreatmentRow>
        ))}
      </TreatmentList>
    </PageContainer>
  );
}
