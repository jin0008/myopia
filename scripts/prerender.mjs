// 빌드 뒤에 공개 페이지 다섯 개를 HTML 로 미리 그려 dist 에 넣는다.
// 왜 하는지는 src/prerender.tsx 맨 위에 있다.
//
// 실패해도 빌드는 성공으로 둔다 - 미리 그린 HTML 이 없으면 지금처럼 빈 껍데기가
// 나갈 뿐이고, 사이트가 안 뜨는 것보다 낫다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://myopiamanage.org";
const OG_IMAGE = `${SITE}/myopia_manage_screenshot.jpg`;

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

try {
  const { PAGES, render } = await import(pathToFileURL(join(root, "dist-ssr/prerender.js")).href);
  const template = readFileSync(join(root, "dist/index.html"), "utf8");

  for (const page of PAGES) {
    const { html, styles } = await render(page.path);
    const url = SITE + page.path;
    const head = [
      `<title>${esc(page.title)}</title>`,
      `<meta name="description" content="${esc(page.description)}" />`,
      `<link rel="canonical" href="${url}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Myopia Management" />`,
      `<meta property="og:title" content="${esc(page.title)}" />`,
      `<meta property="og:description" content="${esc(page.description)}" />`,
      `<meta property="og:url" content="${url}" />`,
      `<meta property="og:image" content="${OG_IMAGE}" />`,
      // MUI 아이콘 크기는 브라우저에서 붙는 스타일이라 미리 그린 HTML 에는 없다.
      // 없으면 앱이 뜨기 전 잠깐 아이콘이 화면만큼 커진다.
      `<style>.MuiSvgIcon-root{width:1em;height:1em;font-size:1.5rem;fill:currentColor;display:inline-block;flex-shrink:0}</style>`,
      styles,
    ].join("\n    ");
    // 이 HTML 은 다른 주소(로그인 등)로 들어와도 대신 나갈 수 있다(서버가
    // 모르는 주소에 index.html 을 준다). 주소가 다르면 미리 그린 본문을 바로
    // 지워, 앱이 뜨기 전 엉뚱한 페이지가 비치지 않게 한다.
    const guard = `<script>(function(){var p=location.pathname.replace(/\\/+$/,"")||"/";if(p!==${JSON.stringify(page.path)})document.getElementById("root").innerHTML="";})();</script>`;

    const out = template
      .replace('<html lang="en">', '<html lang="ko">')
      .replace(/<title>[^<]*<\/title>/, head)
      .replace('<div id="root"></div>', `<div id="root">${html}</div>${guard}`);
    if (out === template || !out.includes(guard)) throw new Error(`template markers not found for ${page.path}`);

    const file = page.path === "/" ? join(root, "dist/index.html") : join(root, "dist", page.path, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, out);
    console.log(`prerendered ${page.path} (${html.length} chars)`);
  }
} catch (e) {
  console.warn("prerender skipped:", e?.message ?? e);
}
