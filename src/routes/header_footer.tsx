import { Outlet } from "react-router";
import Header from "../components/header";
import Footer from "../components/footer";

export default function HeaderFooterLayout() {
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
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <div style={{ flexGrow: 1 }}>
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  );
}
