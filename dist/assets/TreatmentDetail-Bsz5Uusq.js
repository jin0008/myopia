import{j as t,i as m,L as p}from"./index-Ci6lT7C_.js";import{d as e}from"./styled-components.browser.esm-Db0Q2RpU.js";import{t as l}from"./treatments-6x4kQL2P.js";import{c as h}from"./createSvgIcon-Dil9waPb.js";import"./DefaultPropsProvider-BgWlOGG4.js";const r=h(t.jsx("path",{d:"M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"})),n=e.div`
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
`,o=e(p)`
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
`,f=e.div`
  display: flex;
  gap: 60px;
  margin-bottom: 100px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 40px;
    margin-bottom: 60px;
  }
`,g=e.div`
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
`,b=e.div`
  flex: 1;
  width: 100%;
`,j=e.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--link-color);
  margin-bottom: 15px;
  letter-spacing: 0.1em;
`,w=e.h1`
  font-size: 4rem;
  margin-bottom: 25px;
  color: var(--primary-text);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`,u=e.p`
  font-size: 1.5rem;
  color: var(--secondary-text);
  line-height: 1.5;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`,v=e.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`,a=e.div`
  background: white;
  padding: 50px;
  border-radius: 30px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  transition: transform 0.3s;
  
  @media (max-width: 768px) {
    padding: 30px;
  }
`,s=e.h2`
  font-size: 2rem;
  color: var(--primary-text);
  margin-bottom: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`,x=e.p`
  font-size: 1.2rem;
  color: var(--secondary-text);
  line-height: 1.7;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;function L(){const{id:d}=m(),i=l.find(c=>c.id===d);return i?t.jsxs(n,{children:[t.jsxs(o,{to:"/treatments",children:[t.jsx(r,{})," Treatments"]}),t.jsxs(f,{children:[t.jsx(g,{children:t.jsx("img",{src:i.imageUrl,alt:i.title})}),t.jsxs(b,{children:[t.jsx(j,{children:"Myopia Control Technology"}),t.jsx(w,{children:i.title}),t.jsx(u,{children:i.longDescription})]})]}),t.jsxs(v,{children:[t.jsxs(a,{children:[t.jsx(s,{children:"Mechanism"}),t.jsx(x,{children:i.mechanism})]}),t.jsxs(a,{children:[t.jsx(s,{children:"Clinical Efficacy"}),t.jsx(x,{children:i.efficacy})]})]})]}):t.jsxs(n,{children:[t.jsxs(o,{to:"/treatments",children:[t.jsx(r,{})," Treatments"]}),t.jsx("h1",{children:"Treatment not found"})]})}export{L as default};
