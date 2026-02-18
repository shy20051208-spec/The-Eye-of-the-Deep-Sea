import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const stationId = formData.get("stationId") as string;
    if (!stationId) {
        return NextResponse.json({ error: "stationId is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rows: Record<string, string | number>[] = [];

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
        // Parse CSV manually
        const text = buffer.toString("utf-8");
        const lines = text.trim().split("\n");
        if (lines.length < 2) {
            return NextResponse.json({ error: "CSV file must have a header row and at least one data row" }, { status: 400 });
        }
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((v) => v.trim());
            const row: Record<string, string | number> = {};
            headers.forEach((h, idx) => {
                row[h] = values[idx];
            });
            rows.push(row);
        }
    } else if (ext === "xlsx" || ext === "xls") {
        // Parse Excel with SheetJS
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet);
    } else {
        return NextResponse.json({ error: "Unsupported file format. Use CSV or Excel (.xlsx/.xls)" }, { status: 400 });
    }

    // Map common column names
    let created = 0;
    const errors: string[] = [];

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
                    stationId,
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

    return NextResponse.json({
        success: true,
        created,
        total: rows.length,
        errors: errors.length > 0 ? errors : undefined,
    });
}
