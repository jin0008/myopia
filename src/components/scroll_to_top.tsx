import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Resets scroll to the top on every route (pathname) change. SPAs keep the
 * previous scroll position by default; this restores the expected "new page
 * starts at the top" behavior. Renders nothing.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
