import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stations = [
    { name: "ST-001", latitude: 18.2, longitude: 115.8, seaArea: "South China Sea", type: "Cruise" },
    { name: "ST-002", latitude: 21.5, longitude: 118.3, seaArea: "South China Sea", type: "Cruise" },
    { name: "ST-003", latitude: 35.1, longitude: 139.7, seaArea: "North Pacific", type: "Argo" },
    { name: "ST-004", latitude: 28.6, longitude: 127.2, seaArea: "East China Sea", type: "Cruise" },
    { name: "ST-005", latitude: 15.8, longitude: 112.5, seaArea: "South China Sea", type: "Mooring" },
    { name: "ST-006", latitude: 40.2, longitude: 142.1, seaArea: "North Pacific", type: "Argo" },
    { name: "ST-007", latitude: 25.3, longitude: 123.8, seaArea: "East China Sea", type: "Cruise" },
    { name: "ST-008", latitude: 10.5, longitude: 120.0, seaArea: "South China Sea", type: "Mooring" },
];

const users = [
    { name: "Dr. Zhang Wei", email: "zhang.wei@ouc.edu.cn", initials: "ZW", role: "Admin", department: "Marine Science", status: "Active" },
    { name: "Prof. Li Ming", email: "li.ming@ouc.edu.cn", initials: "LM", role: "Researcher", department: "Oceanography", status: "Active" },
    { name: "Wang Jun", email: "wang.jun@sjtu.edu.cn", initials: "WJ", role: "Analyst", department: "Data Science", status: "Active" },
    { name: "Chen Yue", email: "chen.yue@pku.edu.cn", initials: "CY", role: "Student", department: "Physics", status: "Pending" },
    { name: "Sun Hao", email: "sun.hao@xmu.edu.cn", initials: "SH", role: "Viewer", department: "Geography", status: "Inactive" },
];

// Simulate realistic CTD temperature profile with thermocline
function generateTemp(depth: number, surfaceTemp: number): number {
    const deepTemp = 2.5;
    const thermoclineCenter = 150; // meters
    const thermoclineWidth = 100;
    const t =
        deepTemp +
        (surfaceTemp - deepTemp) /
        (1 + Math.exp((depth - thermoclineCenter) / (thermoclineWidth / 4)));
    return Math.round((t + (Math.random() - 0.5) * 0.6) * 100) / 100;
}

function generateSalinity(depth: number): number {
    // Salinity increases slightly with depth then stabilizes
    const base = 34.0;
    const increase = Math.min(depth / 500, 1) * 1.2;
    return Math.round((base + increase + (Math.random() - 0.5) * 0.3) * 1000) / 1000;
}

function generateDensity(temp: number, salinity: number): number {
    // Simplified UNESCO equation approximation
    const rho = 1000 + 0.8 * salinity - 0.065 * temp - 0.004 * temp * temp;
    return Math.round((rho + (Math.random() - 0.5) * 0.2) * 100) / 100;
}

const depths = [5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000];
const statuses = ["Verified", "Verified", "Verified", "Verified", "Verified", "Verified", "Verified", "Pending", "Pending", "Flagged"];

async function main() {
    console.log("🌊 Seeding Abyss Eye database...");

    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.cTDMeasurement.deleteMany();
    await prisma.user.deleteMany();
    await prisma.station.deleteMany();

    // Create stations
    const createdStations = [];
    for (const s of stations) {
        const station = await prisma.station.create({ data: s });
        createdStations.push(station);
    }
    console.log(`✅ Created ${createdStations.length} stations`);

    // Create measurements (about 200 records)
    const startDate = new Date("2023-06-01");
    let measurementCount = 0;

    for (const station of createdStations) {
        // Each station gets 3-4 date groups
        const numDates = 3 + Math.floor(Math.random() * 2);
        const surfaceTemp = 22 + Math.random() * 6; // 22-28°C

        for (let d = 0; d < numDates; d++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + Math.floor(Math.random() * 365));

            // Each date gets a subset of depths
            const selectedDepths = depths.filter(() => Math.random() > 0.3);
            if (selectedDepths.length < 5) selectedDepths.push(...depths.slice(0, 5));
            const uniqueDepths = [...new Set(selectedDepths)].sort((a, b) => a - b);

            for (const depth of uniqueDepths) {
                const temperature = generateTemp(depth, surfaceTemp);
                const salinity = generateSalinity(depth);
                const density = generateDensity(temperature, salinity);
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                await prisma.cTDMeasurement.create({
                    data: {
                        stationId: station.id,
                        date,
                        depth,
                        temperature,
                        salinity,
                        density,
                        status,
                    },
                });
                measurementCount++;
            }
        }
    }
    console.log(`✅ Created ${measurementCount} CTD measurements`);

    // Create users
    const createdUsers = [];
    for (const u of users) {
        const user = await prisma.user.create({
            data: {
                ...u,
                lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
            },
        });
        createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create audit logs
    const actions = [
        { action: "uploaded_dataset", detail: "Uploaded CTD cast data (CSV, 45 records)" },
        { action: "ran_analysis", detail: "Thermocline detection on ST-001" },
        { action: "exported_report", detail: "PDF report for ST-003" },
        { action: "modified_metadata", detail: "Updated station coordinates for ST-005" },
        { action: "verified_data", detail: "Batch verified 12 records" },
        { action: "deleted_records", detail: "Removed 3 flagged records" },
        { action: "uploaded_dataset", detail: "Uploaded cruise data (Excel, 28 records)" },
        { action: "ran_analysis", detail: "Water mass classification on ST-002" },
    ];

    for (const a of actions) {
        const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: a.action,
                detail: a.detail,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)),
            },
        });
    }
    console.log(`✅ Created ${actions.length} audit logs`);

    console.log("🎉 Seed complete!");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
