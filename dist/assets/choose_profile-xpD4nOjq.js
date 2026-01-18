import{a as s,r as o,U as n,j as e}from"./index-Ci6lT7C_.js";import{d as l}from"./styled-components.browser.esm-Db0Q2RpU.js";import{t as c}from"./theme-Dljabw6R.js";function u(){const t=s(),{setRole:r}=o.useContext(n);return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"64px",alignItems:"center",justifyContent:"center",height:"100%"},children:[e.jsx("h1",{children:"Choose user type"}),e.jsxs("div",{style:{display:"flex",gap:"64px",flexDirection:"row"},children:[e.jsx(i,{title:"Regular user",description:"Register your children and track their axial length growth and treatment.",onClick:()=>{r("regular_user"),t("/")}}),e.jsx(i,{title:"Healthcare professional",description:"Manage your patients. Register their axial length growth and treatment data",onClick:()=>{r("healthcare_professional"),t("/")}})]})]})}const d=l.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 320px;
  height: 240px;
  background-color: ${c.primary};
  padding: 32px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
`;function i({title:t,description:r,onClick:a}){return e.jsxs(d,{onClick:a,children:[e.jsx("h2",{children:t}),e.jsx("p",{children:r})]})}export{u as default};
