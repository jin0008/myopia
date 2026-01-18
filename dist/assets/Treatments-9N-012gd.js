import{j as t,L as r}from"./index-Ci6lT7C_.js";import{d as i}from"./styled-components.browser.esm-Db0Q2RpU.js";import{t as n}from"./treatments-6x4kQL2P.js";const a=i.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 80px 20px 100px;
  
  @media (max-width: 768px) {
    padding: 40px 20px 80px;
  }
`,s=i.div`
  text-align: center;
  margin-bottom: 80px;
  animation: fadeIn 1s ease-out;
  
  @media (max-width: 768px) {
    margin-bottom: 40px;
  }
`,d=i.h1`
  font-size: 3.5rem;
  color: var(--primary-text);
  margin-bottom: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`,x=i.p`
  font-size: 1.3rem;
  color: var(--secondary-text);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.4;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`,m=i.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Reduced min-width for mobile */
  gap: 30px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr; /* Stack on very small screens */
  }
`,o=i(r)`
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
`,c=i.div`
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
  
  ${o}:hover & img {
    transform: scale(1.05);
  }
`,p=i.div`
  padding: 30px;
  background: white;
  z-index: 2;
  
  @media (max-width: 768px) {
    padding: 24px;
  }
`,l=i.span`
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--secondary-text);
  margin-bottom: 8px;
`,h=i.h2`
  font-size: 1.7rem;
  margin-bottom: 10px;
  color: var(--primary-text);
  font-weight: 600;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`,g=i.p`
  font-size: 1.05rem;
  color: var(--secondary-text);
  line-height: 1.5;
`,f=i.div`
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

  ${o}:hover & {
    background: var(--link-color);
    color: white;
  }
`;function v(){return t.jsxs(a,{children:[t.jsxs(s,{children:[t.jsx(d,{children:"Treatments."}),t.jsx(x,{children:"Advanced solutions for myopia control."})]}),t.jsx(m,{children:n.map(e=>t.jsxs(o,{to:`/treatments/${e.id}`,children:[t.jsx(f,{children:"+"}),t.jsx(c,{children:t.jsx("img",{src:e.imageUrl,alt:e.title})}),t.jsxs(p,{children:[t.jsx(l,{children:"Technology"}),t.jsx(h,{children:e.title}),t.jsx(g,{children:e.shortDescription})]})]},e.id))})]})}export{v as default};
