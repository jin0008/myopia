import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const router = Router();
const prisma = new PrismaClient();

function getClientIp(req: any): string {
  const fwd = (req.headers["x-forwarded-for"] as string) || "";
  const ipFromFwd = fwd.split(",")[0]?.trim();
  return ipFromFwd || req.socket?.remoteAddress || "unknown";
}

function ipHash(ip: string, ua: string): string {
  const salt = process.env.VISITOR_SALT || "change-me";
  return crypto.createHash("sha256").update(`${ip}|${ua}|${salt}`).digest("hex");
}

function kstMidnight(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const off = Number(process.env.KST_OFFSET_HOURS ?? 9);
  const kstNow = new Date(utc + off * 3600000);
  const kstStart = new Date(kstNow);
  kstStart.setHours(0, 0, 0, 0);
  return new Date(kstStart.getTime() - off * 3600000);
}

// 방문 기록 + 집계
router.post("/track", async (req: any, res) => {
  try {
    const path = (req.body?.path as string) || "/";
    const ua = req.get("user-agent") ?? "";
    const ip = getClientIp(req);

    await prisma.pageView.create({
      data: { path, userAgent: ua, ipHash: ipHash(ip, ua) },
    });

    const today = kstMidnight();
    const [daily, total] = await Promise.all([
      prisma.pageView.count({ where: { visitedAt: { gte: today } } }),
      prisma.pageView.count(),
    ]);

    res.json({ dailyVisits: daily, totalVisits: total });
  } catch (e) {
    console.error("[/api/track] error:", e);
    res.status(500).json({ error: "Failed to track visit" });
  }
});

// 집계만
router.get("/stats", async (_req, res) => {
  try {
    const today = kstMidnight();
    const [daily, total] = await Promise.all([
      prisma.pageView.count({ where: { visitedAt: { gte: today } } }),
      prisma.pageView.count(),
    ]);
    res.json({ dailyVisits: daily, totalVisits: total });
  } catch (e) {
    console.error("[/api/stats] error:", e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
