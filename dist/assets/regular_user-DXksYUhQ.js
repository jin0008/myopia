import{h as f,A as g,r as s,U as C,j as e,a as D,u as x,d as h}from"./index-Ci6lT7C_.js";import{d as y}from"./styled-components.browser.esm-Db0Q2RpU.js";import{a as v,P}from"./button-DpILQc1R.js";import{T as b}from"./div-Coub_ivx.js";import{u as j}from"./useMutation-D6MJQ69v.js";import{P as S,C as T}from"./patient_card-NkrMbLat.js";import{t as O}from"./theme-Dljabw6R.js";import{g as R}from"./hospital-DZ8E4L1t.js";import{T as p}from"./input-dlL0Jff_.js";import{N as q}from"./not_logged_in-Cu4pqUFC.js";import{D as E,a as _,b as A,c as F}from"./DialogTitle-C7sNHUiA.js";import"./delete-CVpkQKAj.js";import"./DefaultPropsProvider-BgWlOGG4.js";function I(){return f(g+"/user/patient")}function Q({hospitalId:r,registration:n,dateOfBirth:i}){return f(g+"/user/patient",{method:"POST"},{hospital_id:r,registration_number:n,date_of_birth:i},!1)}function k(r){return f(g+"/user/patient/"+r,{method:"DELETE"},void 0,!1)}function ee(){const{user:r}=s.useContext(C);return r==null?e.jsx(q,{}):e.jsxs(b,{style:{margin:"0 128px",marginTop:"32px"},children:[e.jsx("h1",{children:"Child list"}),e.jsx(B,{})]})}const w=y.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
  padding: 16px;
  width: 100%;
`;function B(){const r=D(),n=x(),i=h({queryKey:["user","patient"],queryFn:I}),c=j({mutationFn:k,onSuccess:()=>{n.invalidateQueries({queryKey:["user","patient"]}),a(!1)},onError:()=>alert("An error occured")}),[d,l]=s.useState(!1),[u,a]=s.useState(!1),[o,m]=s.useState();return e.jsxs(e.Fragment,{children:[e.jsxs(w,{children:[i.data?.map(t=>e.jsx(S,{registration:t.registration_number,dateOfBirth:t.date_of_birth.split("T")[0],sex:t.sex==="male"?"M":"F",onClick:()=>r(`/chart/${t.id}?edit=false`),onDelete:()=>{m(t),a(!0)}},t.id)),e.jsx(U,{onClick:()=>l(!0),children:"register child"})]}),o&&e.jsx(T,{title:"Confirm deletion",content:"Are you sure you want to delete this entry?",open:u,onClose:()=>a(!1),onConfirm:()=>{c.mutate(o.id)}}),e.jsx(K,{open:d,onClose:()=>l(!1)})]})}const U=y.div`
  background-color: ${O.primary};
  color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 8px 0;
  text-align: center;
  align-content: center;

  cursor: pointer;
`;function K({open:r,onClose:n}){const i=h({queryKey:["hospital"],queryFn:R}),c=x(),d=j({mutationFn:Q,onSuccess:()=>{c.invalidateQueries({queryKey:["user","patient"]}),n()},onError:()=>alert("An error occured")}),[l,u]=s.useState(""),a=s.useRef(""),o=s.useRef(new Date().toISOString().split("T")[0]);s.useEffect(()=>{if(i.isSuccess){const t=i.data[0];u(t?.id)}},[i.isSuccess]);const m=()=>{if(!a.current){alert("Missing field: registration #");return}const t={hospitalId:l,registration:a.current,dateOfBirth:o.current};d.mutate(t)};return e.jsxs(E,{open:r,onClose:n,fullWidth:!0,children:[e.jsx(_,{children:"Register your child"}),e.jsx(A,{children:e.jsxs("div",{style:{display:"flex",flexDirection:"column"},children:[e.jsxs("label",{children:["Hospital:",e.jsx(p,{as:"select",value:l,onChange:t=>u(t.target.value),children:i.data?.map(t=>e.jsxs("option",{value:t.id,children:[t.name,"(",t.country.code,")"]},t.id))})]}),e.jsxs("label",{children:["Registration #",e.jsx(p,{onChange:t=>a.current=t.target.value})]}),e.jsxs("label",{children:["Date of birth:",e.jsx(p,{type:"date",defaultValue:o.current,onChange:t=>o.current=t.target.value})]})]})}),e.jsxs(F,{children:[e.jsx(v,{onClick:n,children:"Dismiss"}),e.jsx(P,{onClick:m,children:"Confirm"})]})]})}export{ee as default};
