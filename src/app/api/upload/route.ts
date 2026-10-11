import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    // support both single `file` and multiple `files`
    const filesRaw = formData.getAll("files").length ? formData.getAll("files") : formData.getAll("file");

    if (!filesRaw || filesRaw.length === 0) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const stationId = formData.get("stationId") as string | null;

    if (!stationId) {
        return NextResponse.json({ error: "stationId is required" }, { status: 400 });
    }

    // get uploader from cookie (set by login route)
    const userCookie = req.cookies.get("user")?.value;
    let uploaderId: string | null = null;
    try {
        if (userCookie) {
            const parsed = JSON.parse(userCookie);
            uploaderId = parsed.id;
        }
    } catch (e) {
        // ignore
    }

    if (!uploaderId) {
        return NextResponse.json({ error: "Unauthorized: uploader not found" }, { status: 401 });
    }

    const uploadDirBase = path.join(process.cwd(), "public", "uploads");
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const uploadDir = path.join(uploadDirBase, dateDir);
    fs.mkdirSync(uploadDir, { recursive: true });

    const results: {
        filename: string;
        path: string;
        total: number | null;
        created: number | null;
        errors: string[];
    }[] = [];
    const MAX_BYTES = process.env.UPLOAD_MAX_BYTES ? parseInt(process.env.UPLOAD_MAX_BYTES) : 50 * 1024 * 1024; // 50MB default
    const allowedExts = [
        "csv",
        "xlsx",
        "xls",
        "png",
        "jpg",
        "jpeg",
        "gif",
        "bmp",
    ];

    for (const f of filesRaw) {
        const file = f as File;
        if (!file || typeof file.name !== "string") continue;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const origName = file.name;
        const ext = origName.split(".").pop()?.toLowerCase() || "bin";
        const safeName = origName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const filename = `${Date.now()}_${safeName}`;
        const destPath = path.join(uploadDir, filename);
        // basic server-side validation
        const errors: string[] = [];
        if (buffer.length > MAX_BYTES) {
            errors.push(`文件过大: ${buffer.length} bytes (最大 ${MAX_BYTES} bytes)`);
        }
        if (!allowedExts.includes(ext)) {
            errors.push(`不支持的文件格式: .${ext}`);
        }

        // write file only if not too large (we still write to keep original, but you may change this behavior)
        fs.writeFileSync(destPath, buffer);

        let total: number | null = null;
        let created: number | null = null;

        if (errors.length === 0) {
            try {
                if (ext === "csv") {
                    const text = buffer.toString("utf-8");
                    const lines = text.trim().split("\n");
                    if (lines.length >= 2) {
                        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
                        total = lines.length - 1;
                        created = 0;
                        for (let i = 1; i < lines.length; i++) {
                            const values = lines[i].split(",").map((v) => v.trim());
                            const row: Record<string, string | number> = {};
                            headers.forEach((h, idx) => {
                                row[h] = values[idx];
                            });
                            const depth = parseFloat(String(row["depth"] || row["pressure"] || "0"));
                            const temperature = parseFloat(String(row["temperature"] || row["temp"] || "0"));
                            const salinity = parseFloat(String(row["salinity"] || row["sal"] || "0"));
                            const density = parseFloat(String(row["density"] || row["dens"] || "0"));
                            const dateStr = String(row["date"] || row["datetime"] || new Date().toISOString());
                            if (isNaN(depth) || isNaN(temperature)) {
                                errors.push(`Row ${i}: invalid depth or temperature`);
                                continue;
                            }
                            await prisma.cTDMeasurement.create({
                                data: {
                                    station: { connect: { id: stationId } },
                                    date: new Date(dateStr),
                                    depth,
                                    temperature,
                                    salinity: isNaN(salinity) ? 0 : salinity,
                                    density: isNaN(density) ? 0 : density,
                                    status: "Pending",
                                },
                            });
                            created++;
                        }
                    }
                } else if (ext === "xlsx" || ext === "xls") {
                    const workbook = XLSX.read(buffer, { type: "buffer" });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
                    total = rows.length;
                    created = 0;
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        try {
                            const depth = parseFloat(String(row["depth"] || row["pressure"] || "0"));
                            const temperature = parseFloat(String(row["temperature"] || row["temp"] || "0"));
                            const salinity = parseFloat(String(row["salinity"] || row["sal"] || "0"));
                            const density = parseFloat(String(row["density"] || row["dens"] || "0"));
                            const dateStr = String(row["date"] || row["datetime"] || new Date().toISOString());
                            if (isNaN(depth) || isNaN(temperature)) {
                                errors.push(`Row ${i + 1}: invalid depth or temperature`);
                                continue;
                            }
                            await prisma.cTDMeasurement.create({
                                data: {
                                    station: { connect: { id: stationId } },
                                    date: new Date(dateStr),
                                    depth,
                                    temperature,
                                    salinity: isNaN(salinity) ? 0 : salinity,
                                    density: isNaN(density) ? 0 : density,
                                    status: "Pending",
                                },
                            });
                            created++;
                        } catch (e) {
                            errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "unknown error"}`);
                        }
                    }
                } else {
                    // For images and other allowed file types, we only store the file and metadata
                }
            } catch (e) {
                errors.push(e instanceof Error ? e.message : String(e));
            }
        }

        // create upload record
        const relPath = path.posix.join('/uploads', dateDir, filename);
        await prisma.upload.create({
            data: {
                uploaderId,
                stationId: stationId || undefined,
                filename: origName,
                mime: file.type || "application/octet-stream",
                size: buffer.length,
                path: relPath,
                originalFormat: ext,
                totalRows: total ?? undefined,
                successCount: created ?? undefined,
                // store structured errors as JSON string for compatibility; after running `prisma generate` this can be passed as JSON directly
                errors: errors.length ? JSON.stringify(errors) : undefined,
            },
        });

        results.push({ filename: origName, path: relPath, total: total ?? null, created: created ?? null, errors });
    }

    const summaries = results.map((file) => file.filename).join(", ");
    await createAuditLog(uploaderId, "dataset_uploaded", `Uploaded ${summaries || "dataset"} to station ${stationId}`);

    return NextResponse.json({ success: true, files: results });
}
