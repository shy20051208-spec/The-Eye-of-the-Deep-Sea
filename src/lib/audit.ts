import { prisma } from "@/lib/prisma";

export async function createAuditLog(userId: string | null | undefined, action: string, detail: string) {
  if (!userId) return;

  try {
    await prisma.auditLog.create({
      data: {
        userId: String(userId),
        action,
        detail: detail.length > 500 ? detail.slice(0, 500) : detail,
      },
    });
  } catch (error) {
    console.error("createAuditLog error", error);
  }
}

export function getUserIdFromRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)user=([^;]+)/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return parsed?.id ? String(parsed.id) : null;
  } catch {
    return null;
  }
}
