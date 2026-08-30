import { styled } from "styled-components";

/**
 * 마이오닥(모바일 앱) 법적 고지 문서의 공통 껍데기.
 *
 * 의료진 플랫폼의 HeaderRoute 밖에 둔다. 이 페이지는 두 곳에서 열린다.
 *  1) 앱스토어·플레이스토어 심사 제출용 공개 URL
 *  2) 앱 '더보기'에서 WebBrowser로 띄우는 화면
 * 둘 다 의료진용 상단 내비게이션이 붙으면 곤란해서 독립 레이아웃을 쓴다.
 */

const Page = styled.div`
  min-height: 100vh;
  background: #ffffff;
  color: #1f2328;
  padding: 32px 20px 64px;
  -webkit-text-size-adjust: 100%;
`;

const Inner = styled.div`
  max-width: 760px;
  margin: 0 auto;
  font-size: 15px;
  line-height: 1.75;
  word-break: keep-all;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 8px;
`;

const Meta = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const Lead = styled.p`
  margin: 0 0 28px;
  color: #374151;
`;

export const Section = styled.section`
  margin-bottom: 30px;

  h2 {
    font-size: 17px;
    font-weight: 700;
    margin: 0 0 10px;
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    margin: 18px 0 6px;
  }

  p {
    margin: 0 0 10px;
    color: #374151;
  }

  ul {
    margin: 0 0 10px;
    padding-left: 20px;
    color: #374151;
  }

  li {
    margin-bottom: 5px;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 14px;
  font-size: 14px;

  th,
  td {
    border: 1px solid #d9dde3;
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
    color: #374151;
  }

  th {
    background: #f5f6f8;
    font-weight: 600;
    white-space: nowrap;
    color: #1f2328;
  }
`;

/** 표가 좁은 화면에서 페이지를 밀어내지 않도록 가로 스크롤을 가둔다. */
export const Scroll = styled.div`
  overflow-x: auto;
`;

const Foot = styled.footer`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
`;

type Props = {
  title: string;
  effectiveDate: string;
  version: string;
  lead?: string;
  children: React.ReactNode;
};

export default function LegalPage({
  title,
  effectiveDate,
  version,
  lead,
  children,
}: Props) {
  return (
    <Page>
      <Inner>
        <Title>{title}</Title>
        <Meta>
          시행일 {effectiveDate} · 버전 {version}
        </Meta>
        {lead && <Lead>{lead}</Lead>}
        {children}
        <Foot>
          마이오닥(MyoDoc) · 아이디엑스
          <br />
          경기도 광명시 덕안로104번길 17 지하3층
          <br />
          문의 myopiamanage@naver.com
        </Foot>
      </Inner>
    </Page>
  );
}
