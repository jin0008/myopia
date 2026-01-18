import styled from "styled-components";
import { treatments } from "../data/treatments";
import { Link } from "react-router";

const PageContainer = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 80px 20px 100px;
  
  @media (max-width: 768px) {
    padding: 40px 20px 80px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 80px;
  animation: fadeIn 1s ease-out;
  
  @media (max-width: 768px) {
    margin-bottom: 40px;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  color: var(--primary-text);
  margin-bottom: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  color: var(--secondary-text);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.4;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Reduced min-width for mobile */
  gap: 30px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr; /* Stack on very small screens */
  }
`;

const Card = styled(Link)`
  background: var(--card-bg);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 500px;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 20px 48px rgba(0,0,0,0.12);
  }
  
  @media (max-width: 768px) {
    height: auto; /* Allow auto height on mobile */
    min-height: 400px;
  }
`;

const ImageArea = styled.div`
  flex: 1;
  background-color: #fbfbfd;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  
  img {
    width: 80%;
    max-height: 300px;
    object-fit: contain;
    transition: transform 0.6s ease;
  }
  
  ${Card}:hover & img {
    transform: scale(1.05);
  }
`;

const ContentArea = styled.div`
  padding: 30px;
  background: white;
  z-index: 2;
  
  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const Metadata = styled.span`
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--secondary-text);
  margin-bottom: 8px;
`;

const CardTitle = styled.h2`
  font-size: 1.7rem;
  margin-bottom: 10px;
  color: var(--primary-text);
  font-weight: 600;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CardDescription = styled.p`
  font-size: 1.05rem;
  color: var(--secondary-text);
  line-height: 1.5;
`;

const LearnMore = styled.div`
  position: absolute;
  top: 30px;
  right: 30px;
  width: 30px;
  height: 30px;
  background: rgba(0,0,0,0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--primary-text);
  transition: all 0.3s;

  ${Card}:hover & {
    background: var(--link-color);
    color: white;
  }
`;

export default function Treatments() {
  return (
    <PageContainer>
      <Header>
        <Title>Treatments.</Title>
        <Subtitle>
          Advanced solutions for myopia control.
        </Subtitle>
      </Header>

      <Grid>
        {treatments.map((treatment) => (
          <Card key={treatment.id} to={`/treatments/${treatment.id}`}>
            <LearnMore>+</LearnMore>
            <ImageArea>
              <img src={treatment.imageUrl} alt={treatment.title} />
            </ImageArea>
            <ContentArea>
              <Metadata>Technology</Metadata>
              <CardTitle>{treatment.title}</CardTitle>
              <CardDescription>{treatment.shortDescription}</CardDescription>
            </ContentArea>
          </Card>
        ))}
      </Grid>
    </PageContainer>
  );
}
