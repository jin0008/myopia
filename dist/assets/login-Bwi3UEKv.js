import{j as e,r as a,a as x,u as f,G as y,p as j,g as m}from"./index-Ci6lT7C_.js";import{d as u}from"./styled-components.browser.esm-Db0Q2RpU.js";import{P as l}from"./button-DpILQc1R.js";import{L as c}from"./input-dlL0Jff_.js";function v(){return e.jsx("div",{style:{width:"1px",backgroundColor:"#ccc"}})}const d=u.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 320px;
  gap: 32px;
`,p=u.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 320px;
`;function L(){const r=a.useRef(""),s=a.useRef(""),i=x(),t=f();function g(){j(r.current,s.current).then(()=>i("/choose_profile")).then(()=>{t.invalidateQueries({queryKey:["currentUser"]}),t.invalidateQueries({queryKey:["hospital"]})}).catch(n=>{console.error(n),alert(`Login failed
`+n.message)})}function h(n){m(n).then(()=>i("/choose_profile")).then(()=>{t.invalidateQueries({queryKey:["currentUser"]}),t.invalidateQueries({queryKey:["hospital"]})}).catch(o=>{console.error(o),alert(`Login failed
`+o.message)})}return e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"32px",justifyContent:"center",alignItems:"center",height:"100%"},children:e.jsxs("div",{style:{display:"flex",gap:"32px",height:"40%"},children:[e.jsxs(d,{children:[e.jsxs("div",{children:[e.jsx(c,{defaultValue:"",onChange:n=>r.current=n.target.value,placeholder:"Username"}),e.jsx(c,{defaultValue:"",onChange:n=>s.current=n.target.value,placeholder:"Password",type:"password"})]}),e.jsx(l,{onClick:()=>g(),children:"Sign in"}),e.jsx(y,{shape:"pill",text:"signin_with",useOneTap:!0,onSuccess:n=>{n.credential&&h(n.credential)}})]}),e.jsx(v,{}),e.jsxs(p,{children:[e.jsx("p",{children:"Don't have an account?"}),e.jsx(l,{onClick:()=>i("/signup"),children:"Sign up"})]})]})})}const D=Object.freeze(Object.defineProperty({__proto__:null,ButtonsDiv:p,LoginDiv:d,default:L},Symbol.toStringTag,{value:"Module"}));export{p as B,d as L,v as V,D as l};
