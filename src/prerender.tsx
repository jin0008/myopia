/**
 * 공개 페이지를 빌드할 때 HTML 로 미리 그린다 (scripts/prerender.mjs 가 부른다).
 *
 * 이 사이트는 자바스크립트가 돌아야 내용이 생기는데, 네이버 검색 로봇은
 * 자바스크립트를 거의 실행하지 않아 제목 한 줄뿐인 빈 페이지로 본다.
 * 그래서 로봇이 읽을 본문과 페이지별 제목·설명을 미리 만들어 둔다.
 * 브라우저에서는 앱이 뜨면서 이 HTML 을 그대로 갈아 끼운다.
 */
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter, Routes, Route } from "react-router";
import { ServerStyleSheet } from "styled-components";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserContext } from "./App";
import { LanguageProvider } from "./lib/language_context";
import HeaderFooterLayout from "./routes/header_footer";
import Home from "./routes/home";
import WhoWeAre from "./routes/who_we_are";
import Treatments from "./routes/Treatments";
import News from "./routes/News";
import UserGuide from "./routes/user_guide";
import { getHospitalList } from "./api/hospital";
import { getTreatmentContent } from "./api/treatment_content";

const SITE = "https://myopiamanage.org";

export type PageMeta = { path: string; title: string; description: string };

/** 사이트맵(public/sitemap.xml)과 같은 다섯 페이지. */
export const PAGES: (PageMeta & {
  element: ReactElement;
  prefetch?: (qc: QueryClient) => Promise<unknown>;
})[] = [
  {
    path: "/",
    title: "Myopia Management | 소아 근시 관리 · 안축장 성장 추적",
    description:
      "안과 전문의를 위한 소아 근시 관리 플랫폼. 안축장과 굴절값을 기록하고 나이별 성장 곡선과 또래 백분위로 근시 진행을 추적합니다.",
    element: <Home />,
  },
  {
    path: "/who_we_are",
    title: "참여병원 | Myopia Management",
    description: "Myopia Management에 참여해 소아 근시 진행 데이터를 함께 관리하는 병원과 등록 환자 수를 소개합니다.",
    element: <WhoWeAre />,
    prefetch: (qc) =>
      qc.prefetchQuery({ queryKey: ["hospital", "public"], queryFn: () => getHospitalList() }),
  },
  {
    path: "/treatments",
    title: "근시치료 | Myopia Management",
    description:
      "저농도 아트로핀, 드림렌즈(Ortho-K), 근시 억제 안경렌즈(DIMS·HALT) 등 소아 근시 진행을 늦추는 치료법을 소개합니다.",
    element: <Treatments />,
    prefetch: (qc) =>
      qc.prefetchQuery({
        queryKey: ["treatment-content", "ko"],
        queryFn: () => getTreatmentContent("ko"),
      }),
  },
  {
    path: "/news",
    title: "최신논문 | Myopia Management",
    description: "PubMed에서 모은 근시 관리·근시 진행 억제 관련 최신 연구 논문을 소개합니다.",
    element: <News />,
    prefetch: (qc) =>
      qc.prefetchQuery({
        queryKey: ["news"],
        queryFn: async () => {
          const r = await fetch(`${SITE}/api/news`);
          if (!r.ok) throw new Error(`news ${r.status}`);
          return r.json();
        },
      }),
  },
  {
    path: "/user-guide",
    title: "사용 안내 | Myopia Management",
    description: "Myopia Management에서 환자를 등록하고 안축장·굴절값을 기록해 근시 진행을 확인하는 방법을 안내합니다.",
    element: <UserGuide />,
  },
];

/**
 * 앱의 API 주소는 운영에서 "/api" 같은 상대 주소라 Node 의 fetch 가 못 쓴다.
 * 미리 그리는 동안만 운영 주소를 붙여 준다.
 */
const realFetch = globalThis.fetch;
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  realFetch(typeof input === "string" && input.startsWith("/") ? SITE + input : input, init);

export async function render(path: string): Promise<{ html: string; styles: string }> {
  const page = PAGES.find((p) => p.path === path);
  if (!page) throw new Error(`unknown page ${path}`);

  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // 데이터를 못 받아도 빌드는 계속한다. 그 페이지는 "불러오는 중"으로 그려지고,
  // 브라우저에서는 평소처럼 받아 온다.
  await page.prefetch?.(qc).catch((e) => console.warn(`prerender ${path}: ${e}`));

  const sheet = new ServerStyleSheet();
  try {
    const html = renderToString(
      sheet.collectStyles(
        <QueryClientProvider client={qc}>
          <LanguageProvider>
            <UserContext.Provider value={{ user: null, role: "regular_user", setRole: () => {} }}>
              <StaticRouter location={path}>
                <Routes>
                  <Route element={<HeaderFooterLayout />}>
                    <Route path={path} element={page.element} />
                  </Route>
                </Routes>
              </StaticRouter>
            </UserContext.Provider>
          </LanguageProvider>
        </QueryClientProvider>,
      ),
    );
    return { html, styles: sheet.getStyleTags() };
  } finally {
    sheet.seal();
  }
}
