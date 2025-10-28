// myopia/src/components/VisitorStats.tsx
import { useEffect, useRef, useState } from "react";

type Stats = { dailyVisits: number; totalVisits: number };

export default function VisitorStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const sentRef = useRef(false); // StrictMode(개발)에서 중복 호출 가드

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
      <strong>Visitors</strong>
      <span>Today: {stats ? stats.dailyVisits.toLocaleString() : "—"}</span>
      <span>Total: {stats ? stats.totalVisits.toLocaleString() : "—"}</span>
    </div>
  );
}
