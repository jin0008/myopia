import{j as e,u as v,a as f,b as y,r as s,U as b,L as w,l as j,O as k}from"./index-Ci6lT7C_.js";import{d as n}from"./styled-components.browser.esm-Db0Q2RpU.js";import{P as a}from"./button-DpILQc1R.js";import{c as u}from"./createSvgIcon-Dil9waPb.js";import"./theme-Dljabw6R.js";import"./DefaultPropsProvider-BgWlOGG4.js";const C="/assets/logo-BbN40VP1.svg",L=u(e.jsx("path",{d:"M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"})),z=u(e.jsx("path",{d:"M3 18h18v-2H3zm0-5h18v-2H3zm0-7v2h18V6z"})),$=n.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: background-color 0.3s ease;
  width: 100%;
`,M=n.div`
  max-width: 980px;
  margin: 0 auto;
  height: 54px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
`,N=n.img`
  height: 24px;
  cursor: pointer;
  transition: opacity 0.2s;
  z-index: 1002; /* Above mobile menu */
  
  &:hover {
    opacity: 0.8;
  }
`,O=n.div`
  display: flex;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 768px) {
    display: none;
  }
`,S=n.div`
  display: none;
  cursor: pointer;
  z-index: 1002;
  color: var(--primary-text);
  
  @media (max-width: 768px) {
    display: block;
  }
`,A=n.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 40px;
  opacity: ${o=>o.$isOpen?1:0};
  pointer-events: ${o=>o.$isOpen?"all":"none"};
  transition: opacity 0.3s ease;
`,E=n.span`
  font-size: 24px;
  font-weight: 600;
  color: ${o=>o.$isActive?"var(--link-color)":"var(--primary-text)"};
  cursor: pointer;
  
  &:active {
    opacity: 0.6;
  }
`,I=n.span`
  font-size: 13px;
  color: ${o=>o.$isActive?"var(--primary-text)":"var(--secondary-text)"};
  cursor: pointer;
  transition: color 0.2s;
  font-weight: 500;
  
  &:hover {
    color: var(--link-color);
  }
`,H=n.div`
  font-size: 11px;
  color: var(--secondary-text);
  margin-right: 15px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;function _(){const o=v(),i=f(),r=y(),{user:l,role:p}=s.useContext(b),[g,m]=s.useState(!1),[c,d]=s.useState(!1);s.useEffect(()=>{const t=()=>{m(window.scrollY>0)};return window.addEventListener("scroll",t),()=>window.removeEventListener("scroll",t)},[]),s.useEffect(()=>{d(!1)},[r.pathname]);const x=()=>{j().then(()=>o.invalidateQueries({queryKey:["currentUser"]})).catch(()=>alert("Logout failed")).finally(()=>i("/login"))},h=[{label:"Growth Chart",path:`/axial_length_growth/${p}`,show:!0},{label:"News",path:"/news",show:!0},{label:"Who We Are",path:"/who_we_are",show:!0},{label:"Treatments",path:"/treatments",show:!0},{label:"Profile",path:"/profile",show:!0}];return e.jsxs(e.Fragment,{children:[e.jsx($,{className:g?"glass":"",children:e.jsxs(M,{children:[e.jsx(N,{src:C,alt:"logo",onClick:()=>i("/")}),e.jsx(O,{children:h.map(t=>e.jsx(I,{$isActive:r.pathname.includes(t.path),onClick:()=>i(t.path),children:t.label},t.label))}),e.jsxs("div",{style:{display:"flex",alignItems:"center"},children:[l&&e.jsxs(H,{children:[p," (",e.jsx(w,{to:"/choose_profile",style:{color:"inherit",textDecoration:"underline"},children:"change"}),")"]}),e.jsx("div",{className:"desktop-only",style:{display:window.innerWidth>768?"block":"none"},children:l?e.jsx(a,{style:{padding:"4px 12px",fontSize:"12px",height:"auto",borderRadius:"12px"},onClick:x,children:"Logout"}):e.jsx(a,{style:{padding:"4px 12px",fontSize:"12px",height:"auto",borderRadius:"12px"},onClick:()=>i("/login"),children:"Login"})}),e.jsx(S,{onClick:()=>d(!c),children:c?e.jsx(L,{}):e.jsx(z,{})})]})]})}),e.jsxs(A,{$isOpen:c,children:[h.map(t=>e.jsx(E,{$isActive:r.pathname.includes(t.path),onClick:()=>i(t.path),children:t.label},t.label)),l?e.jsx(a,{onClick:x,style:{marginTop:"20px"},children:"Logout"}):e.jsx(a,{onClick:()=>i("/login"),style:{marginTop:"20px"},children:"Login"})]})]})}function W(){return e.jsxs("div",{style:{height:"100%",display:"flex",flexDirection:"column"},children:[e.jsx(_,{}),e.jsx("div",{style:{flexGrow:1},children:e.jsx(k,{})})]})}export{W as default};
