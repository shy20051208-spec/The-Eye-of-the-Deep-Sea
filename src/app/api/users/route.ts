import { prisma } from "@/lib/prisma";
import { createAuditLog, getUserIdFromRequest } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function GET() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            initials: true,
            role: true,
            department: true,
            status: true,
            lastActiveAt: true,
            createdAt: true,
        },
        orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, role, status } = body ?? {};

        if (!id) {
            return NextResponse.json({ error: "User id is required" }, { status: 400 });
        }

        const updateData: Record<string, string> = {};
        if (role) updateData.role = String(role);
        if (status) updateData.status = String(status);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: String(id) },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                initials: true,
                role: true,
                department: true,
                status: true,
                lastActiveAt: true,
                createdAt: true,
            },
        });

        const actorId = getUserIdFromRequest(req);
        await createAuditLog(actorId, "user_updated", `Updated user ${user.name}: role=${user.role}, status=${user.status}`);

        return NextResponse.json(user);
    } catch (err) {
        console.error("update user error", err);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}
