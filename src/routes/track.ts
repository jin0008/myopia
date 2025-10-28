// myopiaBackend/src/routes/track.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const router = Router();
const prisma = new PrismaClient();

function getClientIp(req: Request): string {
  const fwd = (req.headers["x-forwarded-for"] as string) || "";
  const ipFromFwd = fwd.split(",")[0]?.trim();
  // @ts-ignore - remoteAddress is available on the socket
  return ipFromFwd || (req.socket?.remoteAddress as string) || "unknown";
}

function ipHash(ip: string, ua: string): string {
  const salt = process.env.VISITOR_SALT || "change-me";
  return createHash("sha256").update(`${ip}|${ua}|${salt}`).digest("hex");
}

function kstMidnight(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const off = Number(process.env.KST_OFFSET_HOURS ?? 9);
  const kstNow = new Date(utc + off * 3600000);
  kstNow.setHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - off * 3600000);
}

// 방문 기록 + 집계
router.post("/track", async (req: Request, res: Response) => {
  try {
    const path =
      typeof req.body?.path === "string" ? (req.body.path as string) : "/";
    const ua = req.get("user-agent") ?? "";
    const ip = getClientIp(req);

    await prisma.pageView.create({
      data: { path, userAgent: ua, ipHash: ipHash(ip, ua) }
    });

    const today = kstMidnight();
    const [daily, total] = await Promise.all([
      prisma.pageView.count({ where: { visitedAt: { gte: today } } }),
      prisma.pageView.count()
    ]);

    res.json({ dailyVisits: daily, totalVisits: total });
  } catch (e) {
    console.error("[POST /api/track] error:", e);
    res.status(500).json({ error: "Failed to track visit" });
  }
});

// 집계만
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const today = kstMidnight();
    const [daily, total] = await Promise.all([
      prisma.pageView.count({ where: { visitedAt: { gte: today } } }),
      prisma.pageView.count()
    ]);
    res.json({ dailyVisits: daily, totalVisits: total });
  } catch (e) {
    console.error("[GET /api/stats] error:", e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
