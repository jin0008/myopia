import { Outlet } from "react-router";
import Header from "../components/header";

export default function HeaderRoute() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header></Header>
      <div
        style={{
          flexGrow: 1,
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
