import { useParams, Link } from "react-router";
import styled from "styled-components";
import { treatments } from "../data/treatments";
import { MOBILE_MEDIA } from "../lib/constants";
import theme from "../theme";

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 24px 100px;

  @media ${MOBILE_MEDIA} {
    padding: 32px 16px 60px;
  }
`;

const Label = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.primary};
  text-align: center;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  text-align: center;
  color: ${theme.textPrimary};
  font-weight: 700;
  margin-bottom: 40px;
  line-height: 1.2;

  @media ${MOBILE_MEDIA} {
    font-size: 2rem;
    margin-bottom: 24px;
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  max-width: 480px;
  margin: 0 auto 48px;
  border-radius: 20px;
  overflow: hidden;
  background: #f8f9fa;

  img {
    width: 100%;
    height: auto;
    display: block;
  }

  @media ${MOBILE_MEDIA} {
    margin-bottom: 32px;
  }
`;

const SectionWrapper = styled.div`
  margin-bottom: 48px;

  @media ${MOBILE_MEDIA} {
    margin-bottom: 32px;
  }
`;

const SectionLabel = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.textPrimary};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 4px;
    background-color: ${theme.textPrimary};
    border-radius: 50%;
  }
`;

const SectionText = styled.p`
  font-size: 15px;
  color: ${theme.textSecondary};
  line-height: 1.7;
`;

const SubSectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${theme.textPrimary};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GreenIcon = styled.span`
  color: ${theme.primary};
  font-size: 18px;
`;

const OtherTreatmentsSection = styled.div`
  margin-top: 80px;
  border-top: 1px solid #eee;
  padding-top: 40px;

  @media ${MOBILE_MEDIA} {
    margin-top: 48px;
    padding-top: 24px;
  }
`;

const OtherTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${theme.textPrimary};
  text-align: center;
  margin-bottom: 32px;
`;

const OtherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media ${MOBILE_MEDIA} {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const OtherCard = styled(Link)`
  text-decoration: none;
  color: inherit;
  border-radius: 16px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    text-decoration: none;
  }
`;

const OtherCardImage = styled.div`
  height: 160px;
  background: #f8f9fa;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const OtherCardContent = styled.div`
  padding: 16px;
`;

const OtherCardDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${theme.primary};
  border-radius: 50%;
  margin-bottom: 8px;
`;

const OtherCardTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.textPrimary};
  margin-bottom: 6px;
`;

const OtherCardDesc = styled.p`
  font-size: 13px;
  color: ${theme.textSecondary};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export default function TreatmentDetail() {
  const { id } = useParams();
  const treatment = treatments.find((t) => t.id === id);

  if (!treatment) {
    return (
      <Container>
        <Title>Treatment not found</Title>
      </Container>
    );
  }

  const otherTreatments = treatments.filter((t) => t.id !== id).slice(0, 3);

  return (
    <Container>
      <Label>Myopia Control Technology</Label>
      <Title>{treatment.title}</Title>

      <ImageContainer>
        <img src={treatment.imageUrl} alt={treatment.title} />
      </ImageContainer>

      <SectionWrapper>
        <SectionLabel>Detail</SectionLabel>
        <SectionText>{treatment.longDescription}</SectionText>
      </SectionWrapper>

      <SectionWrapper>
        <SubSectionTitle>
          <GreenIcon>⚙</GreenIcon>
          Mechanism
        </SubSectionTitle>
        <SectionText>{treatment.mechanism}</SectionText>
      </SectionWrapper>

      <SectionWrapper>
        <SubSectionTitle>
          <GreenIcon>📊</GreenIcon>
          Clinical Efficacy
        </SubSectionTitle>
        <SectionText>{treatment.efficacy}</SectionText>
      </SectionWrapper>

      {otherTreatments.length > 0 && (
        <OtherTreatmentsSection>
          <OtherTitle>Other Treatments</OtherTitle>
          <OtherGrid>
            {otherTreatments.map((t) => (
              <OtherCard key={t.id} to={`/treatments/${t.id}`}>
                <OtherCardImage>
                  <img src={t.imageUrl} alt={t.title} />
                </OtherCardImage>
                <OtherCardContent>
                  <OtherCardDot />
                  <OtherCardTitle>{t.title}</OtherCardTitle>
                  <OtherCardDesc>{t.shortDescription}</OtherCardDesc>
                </OtherCardContent>
              </OtherCard>
            ))}
          </OtherGrid>
        </OtherTreatmentsSection>
      )}
    </Container>
  );
}
