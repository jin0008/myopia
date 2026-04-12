import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import theme from "../theme";
import { MOBILE_MEDIA } from "../lib/constants";
import { ExpandMore, ExpandLess, OpenInNew } from "@mui/icons-material";

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
  padding: 60px 24px 100px;

  @media ${MOBILE_MEDIA} {
    padding: 32px 16px 80px;
  }
`;

const Header = styled.div`
  margin-bottom: 48px;
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

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Card = styled.div`
  padding: 28px;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  background: white;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }
`;

const JournalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
`;

const JournalIcon = styled.span`
  color: ${theme.primary};
  display: flex;
  align-items: center;
`;

const JournalName = styled.span`
  color: ${theme.primary};
  font-weight: 500;
`;

const ItemTitle = styled.h3`
  font-size: 1.3rem;
  color: #1a3a5c;
  margin-bottom: 8px;
  line-height: 1.4;
  font-weight: 700;

  a {
    color: #1a3a5c;
    text-decoration: none;

    &:hover {
      text-decoration: none;
      color: #0d2847;
    }
  }
`;

const MetaRow = styled.div`
  font-size: 13px;
  color: ${theme.textSecondary};
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Abstract = styled.div<{ $expanded: boolean }>`
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  margin-bottom: 16px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: ${(props) => (props.$expanded ? "unset" : 3)};
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const ActionLink = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.2s;

  &.summary {
    color: ${theme.textSecondary};
    &:hover {
      color: ${theme.textPrimary};
    }
  }

  &.article {
    color: ${theme.primary};
    &:hover {
      opacity: 0.8;
    }
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 80px 0;
  color: ${theme.textSecondary};
  font-size: 1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 50px;
  color: ${theme.danger};
  background: rgba(229, 57, 53, 0.05);
  border-radius: 16px;
`;

function NewsCard({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <JournalRow>
        <JournalIcon>📄</JournalIcon>
        <JournalName>{article.journal || "Scientific Article"}</JournalName>
      </JournalRow>

      <ItemTitle>
        {article.title}
        {article.url && (
          <>
            {" "}
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Full Article <OpenInNew style={{ fontSize: "14px", verticalAlign: "middle" }} />
            </a>
          </>
        )}
      </ItemTitle>

      <MetaRow>
        <span>
          {new Date(article.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>by {article.author}</span>
      </MetaRow>

      {article.abstract && (
        <>
          <Abstract $expanded={expanded}>
            {article.abstract}
          </Abstract>
          <ButtonRow>
            <ActionLink
              className="summary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show Less" : "Read Summary"}{" "}
              {expanded ? (
                <ExpandLess style={{ fontSize: "18px" }} />
              ) : (
                <ExpandMore style={{ fontSize: "18px" }} />
              )}
            </ActionLink>
          </ButtonRow>
        </>
      )}
    </Card>
  );
}

export default function News() {
  const {
    data: articles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });

  if (isLoading)
    return (
      <PageContainer>
        <Header>
          <Title>Latest Research</Title>
        </Header>
        <Loading>Fetching latest updates from PubMed...</Loading>
      </PageContainer>
    );

  if (error)
    return (
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
        <Subtitle>Curated Myopia Control updates from the last 6 months.</Subtitle>
      </Header>

      <List>
        {articles?.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </List>
    </PageContainer>
  );
}
