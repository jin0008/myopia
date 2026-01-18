import { useParams, Link } from "react-router";
import styled from "styled-components";
import { treatments } from "../data/treatments";
import { ArrowBack } from "@mui/icons-material";

const Container = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 40px 20px 100px;
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  
  @media (max-width: 768px) {
    padding: 20px 20px 60px;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: var(--secondary-text);
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 40px;
  transition: all 0.2s;
  padding: 8px 12px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);

  &:hover {
    color: var(--primary-text);
    transform: translateX(-5px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  svg {
    margin-right: 6px;
    font-size: 16px;
  }
`;

const HeroSection = styled.div`
  display: flex;
  gap: 60px;
  margin-bottom: 100px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 40px;
    margin-bottom: 60px;
  }
`;

const ImageContainer = styled.div`
  flex: 1;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  background: #fbfbfd;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  width: 100%; /* Full width on mobile */
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
    
    &:hover {
      transform: scale(1.05);
    }
  }
`;

const HeaderContent = styled.div`
  flex: 1;
  width: 100%;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--link-color);
  margin-bottom: 15px;
  letter-spacing: 0.1em;
`;

const Title = styled.h1`
  font-size: 4rem;
  margin-bottom: 25px;
  color: var(--primary-text);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  color: var(--secondary-text);
  line-height: 1.5;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const SectionCard = styled.div`
  background: white;
  padding: 50px;
  border-radius: 30px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  transition: transform 0.3s;
  
  @media (max-width: 768px) {
    padding: 30px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: var(--primary-text);
  margin-bottom: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const SectionText = styled.p`
  font-size: 1.2rem;
  color: var(--secondary-text);
  line-height: 1.7;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

export default function TreatmentDetail() {
  const { id } = useParams();
  const treatment = treatments.find(t => t.id === id);

  if (!treatment) {
    return (
      <Container>
        <BackLink to="/treatments"><ArrowBack /> Treatments</BackLink>
        <h1>Treatment not found</h1>
      </Container>
    );
  }

  return (
    <Container>
      <BackLink to="/treatments"><ArrowBack /> Treatments</BackLink>

      <HeroSection>
        <ImageContainer>
          <img src={treatment.imageUrl} alt={treatment.title} />
        </ImageContainer>
        <HeaderContent>
          <Label>Myopia Control Technology</Label>
          <Title>{treatment.title}</Title>
          <Subtitle>{treatment.longDescription}</Subtitle>
        </HeaderContent>
      </HeroSection>

      <ContentGrid>
        <SectionCard>
          <SectionTitle>Mechanism</SectionTitle>
          <SectionText>{treatment.mechanism}</SectionText>
        </SectionCard>

        <SectionCard>
          <SectionTitle>Clinical Efficacy</SectionTitle>
          <SectionText>{treatment.efficacy}</SectionText>
        </SectionCard>
      </ContentGrid>
    </Container>
  );
}
