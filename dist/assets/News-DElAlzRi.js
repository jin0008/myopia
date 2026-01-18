import{d as x,j as e,r as p}from"./index-Ci6lT7C_.js";import{d as r}from"./styled-components.browser.esm-Db0Q2RpU.js";import{t as n}from"./theme-Dljabw6R.js";const h=async()=>{const t=await fetch("/api/news");if(!t.ok)throw new Error("Failed to fetch news");return t.json()},i=r.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 80px 20px 100px;
`,a=r.div`
  margin-bottom: 60px;
  animation: fadeIn 0.8s ease-out;
`,d=r.h1`
  font-size: 3rem;
  color: ${n.primary};
  margin-bottom: 10px;
  font-weight: 700;
  letter-spacing: -0.02em;
`,m=r.p`
  font-size: 1.2rem;
  color: #666;
  font-weight: 400;
`,u=r.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`,f=r.div`
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  }
`,g=r.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: #888;
`,b=r.span`
  color: ${n.primary};
`,j=r.h3`
  font-size: 1.4rem;
  color: #222;
  margin-bottom: 12px;
  line-height: 1.4;
  font-weight: 700;
`,w=r.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 16px;
  font-style: italic;
`,y=r.div`
  font-size: 1rem;
  color: #444;
  line-height: 1.6;
  margin-bottom: 20px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: ${t=>t.$expanded?"unset":3};
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
`,v=r.div`
  display: flex;
  gap: 12px;
  align-items: center;
`,l=r.button`
  background: none;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  transition: background 0.2s;
  
  &.primary {
    color: ${n.primary};
    background: ${n.primary}10;
    &:hover { background: ${n.primary}20; }
  }

  &.secondary {
    color: #666;
    &:hover { background: #f0f0f0; }
  }
`,k=r.div`
  text-align: center;
  padding: 100px 0;
  color: #666;
  font-size: 1.2rem;
`,z=r.div`
  text-align: center;
  padding: 50px;
  color: #dc3545;
  background: #dc354510;
  border-radius: 20px;
`;function A({article:t}){const[o,s]=p.useState(!1);return e.jsxs(f,{children:[e.jsxs(g,{children:[e.jsx(b,{children:t.journal||"Scientific Article"}),e.jsx("span",{children:new Date(t.date).toLocaleDateString(void 0,{year:"numeric",month:"short",day:"numeric"})})]}),e.jsx(j,{children:t.title}),e.jsxs(w,{children:["by ",t.author]}),e.jsx(y,{$expanded:o,children:t.abstract||"No abstract available for this article."}),e.jsxs(v,{children:[e.jsx(l,{className:"secondary",onClick:()=>s(!o),children:o?"Show Less":"Read Summary"}),e.jsx("a",{href:t.url,target:"_blank",rel:"noopener noreferrer",style:{textDecoration:"none"},children:e.jsx(l,{className:"primary",children:"Full Article ↗"})})]})]})}function N(){const{data:t,isLoading:o,error:s}=x({queryKey:["news"],queryFn:h});return o?e.jsx(i,{children:e.jsxs(a,{children:[e.jsx(d,{children:"Latest Research"}),e.jsx(k,{children:"Fetching latest updates from PubMed..."})]})}):s?e.jsxs(i,{children:[e.jsx(a,{children:e.jsx(d,{children:"Latest Research"})}),e.jsx(z,{children:"Unable to load news. Please try again later."})]}):e.jsxs(i,{children:[e.jsxs(a,{children:[e.jsx(d,{children:"Latest Research"}),e.jsx(m,{children:"Curated Myopia Control updates from the last 6 months."})]}),e.jsx(u,{children:t?.map(c=>e.jsx(A,{article:c},c.id))}),e.jsx("div",{style:{textAlign:"center",marginTop:"60px",color:"#999",fontSize:"0.8rem"},children:"Data source: NCBI PubMed API (Auto-updated)"})]})}export{N as default};
