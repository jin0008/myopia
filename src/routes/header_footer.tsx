import { Outlet } from "react-router";
import Header from "../components/header";
import Footer from "../components/footer";

export default function HeaderFooterLayout() {
  return (
    <div
      style={{
        // flex:1 (not height:100%) so it fills #root whose height is now
        // min-height, not a definite height — keeps the footer pinned to the
        // bottom while the sticky header still works on long pages.
        flex: 1,
        minHeight: 0,
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
