import{j as r}from"./index-Ci6lT7C_.js";import{a as c,P as d}from"./button-DpILQc1R.js";import{D as l,a as p,b as x,c as m}from"./DialogTitle-C7sNHUiA.js";import{d as n}from"./styled-components.browser.esm-Db0Q2RpU.js";import{t as h}from"./theme-Dljabw6R.js";import{d as g}from"./delete-CVpkQKAj.js";const v=({open:i,title:t,content:s,onClose:o,onConfirm:a})=>r.jsxs(l,{open:i,onClose:o,children:[r.jsx(p,{children:t}),r.jsx(x,{children:s}),r.jsxs(m,{children:[r.jsx(c,{onClick:o,color:"primary",children:"Cancel"}),r.jsx(d,{onClick:a,color:"primary",autoFocus:!0,children:"Confirm"})]})]}),u=n.div`
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 8px 0;

  cursor: pointer;

  transition: background 1s;

  &:hover {
    background-color: ${h.primary50};
  }
`,j=n.img`
  width: 24px;
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`;function w({registration:i,dateOfBirth:t,sex:s,onClick:o,onDelete:a}){return r.jsxs(u,{onClick:o,children:[r.jsxs("div",{style:{display:"flex",flexDirection:"row",justifyContent:"space-between"},children:[r.jsx("h2",{children:i}),r.jsx(j,{src:g,style:{width:"16px"},onClick:e=>{e.stopPropagation(),a()}})]}),r.jsxs("p",{children:[t,"/",s]})]})}export{v as C,w as P};
