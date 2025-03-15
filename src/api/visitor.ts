import { jsonFetch } from "../lib/fetch";
import { API_ROOT } from "./root";

// Update visitor count when someone visits the site
export function updateVisitorCount() {
  return jsonFetch(API_ROOT + "/api/update-visitor", { method: "POST" });
}

// Fetch visitor statistics
export function getVisitorStats() {
  return jsonFetch(API_ROOT + "/api/visitor-stats");
}