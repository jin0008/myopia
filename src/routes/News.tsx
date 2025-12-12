import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import theme from "../theme";

interface Article {
  id: string;
  title: string;
  journal: string;
  date: string;
  author: string;
  url: string;
  abstract: string;
}

const fetchNews = async (): Promise<Article[]> => {
  const response = await fetch("/api/news");
  if (!response.ok) {
    throw new Error("Failed to fetch news");
  }
  return response.json();
};

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 80px 20px 100px;
`;

const Header = styled.div`
  margin-bottom: 60px;
  animation: fadeIn 0.8s ease-out;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: ${theme.primary};
  margin-bottom: 10px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  font-weight: 400;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Card = styled.div`
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  }
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: #888;
`;

const Journal = styled.span`
  color: ${theme.primary};
`;

const ItemTitle = styled.h3`
  font-size: 1.4rem;
  color: #222;
  margin-bottom: 12px;
  line-height: 1.4;
  font-weight: 700;
`;

const Author = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 16px;
  font-style: italic;
`;

const Abstract = styled.div<{ $expanded: boolean }>`
  font-size: 1rem;
  color: #444;
  line-height: 1.6;
  margin-bottom: 20px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: ${props => (props.$expanded ? "unset" : 3)};
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  transition: background 0.2s;
  
  &.primary {
    color: ${theme.primary};
    background: ${theme.primary}10;
    &:hover { background: ${theme.primary}20; }
  }

  &.secondary {
    color: #666;
    &:hover { background: #f0f0f0; }
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 100px 0;
  color: #666;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 50px;
  color: #dc3545;
  background: #dc354510;
  border-radius: 20px;
`;

function NewsCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <MetaRow>
        <Journal>{article.journal || "Scientific Article"}</Journal>
        <span>{new Date(article.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
      </MetaRow>
      <ItemTitle>{article.title}</ItemTitle>
      <Author>by {article.author}</Author>

      <Abstract $expanded={expanded}>
        {article.abstract || "No abstract available for this article."}
      </Abstract>

      <ButtonRow>
        <ActionButton
          className="secondary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show Less" : "Read Summary"}
        </ActionButton>

        <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <ActionButton className="primary">
            Full Article ↗
          </ActionButton>
        </a>
      </ButtonRow>
    </Card>
  );
}

export default function News() {
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['news'],
    queryFn: fetchNews
  });

  if (isLoading) return (
    <PageContainer>
      <Header>
        <Title>Latest Research</Title>
        <Loading>Fetching latest updates from PubMed...</Loading>
      </Header>
    </PageContainer>
  );

  if (error) return (
    <PageContainer>
      <Header>
        <Title>Latest Research</Title>
      </Header>
      <ErrorMessage>Unable to load news. Please try again later.</ErrorMessage>
    </PageContainer>
  );

  return (
    <PageContainer>
      <Header>
        <Title>Latest Research</Title>
        <Subtitle>
          Curated Myopia Control updates from the last 6 months.
        </Subtitle>
      </Header>

      <List>
        {articles?.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </List>

      <div style={{ textAlign: 'center', marginTop: '60px', color: '#999', fontSize: '0.8rem' }}>
        Data source: NCBI PubMed API (Auto-updated)
      </div>
    </PageContainer>
  );
}
