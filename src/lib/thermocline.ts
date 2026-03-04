/**
 * 温跃层检测算法 — 梯度法
 * 通过查找温度梯度 (dT/dz) 的最大值来检测温跃层位置
 */

export interface ThermoclineResult {
    topDepth: number;
    bottomDepth: number;
    centerDepth: number;
    maxGradient: number;
    layers: {
        name: string;
        depthRange: [number, number];
        tempRange: [number, number];
    }[];
}

export interface DepthTempPoint {
    depth: number;
    temperature: number;
}

const GRADIENT_THRESHOLD = 0.02; // ℃/m — minimum gradient to consider as thermocline

export function detectThermocline(
    data: DepthTempPoint[]
): ThermoclineResult | null {
    if (data.length < 3) return null;

    // Sort by depth ascending
    const sorted = [...data].sort((a, b) => a.depth - b.depth);

    // Calculate gradients between adjacent points
    const gradients: { depth: number; gradient: number; temp: number }[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        const dz = sorted[i + 1].depth - sorted[i].depth;
        if (dz <= 0) continue;
        const dT = Math.abs(sorted[i].temperature - sorted[i + 1].temperature);
        gradients.push({
            depth: (sorted[i].depth + sorted[i + 1].depth) / 2,
            gradient: dT / dz,
            temp: (sorted[i].temperature + sorted[i + 1].temperature) / 2,
        });
    }

    if (gradients.length === 0) return null;

    // Find maximum gradient
    let maxIdx = 0;
    for (let i = 1; i < gradients.length; i++) {
        if (gradients[i].gradient > gradients[maxIdx].gradient) {
            maxIdx = i;
        }
    }

    const maxGradient = gradients[maxIdx].gradient;
    if (maxGradient < GRADIENT_THRESHOLD) return null;

    // Expand from max gradient to find thermocline boundaries
    let topIdx = maxIdx;
    let bottomIdx = maxIdx;

    while (topIdx > 0 && gradients[topIdx - 1].gradient > GRADIENT_THRESHOLD) {
        topIdx--;
    }
    while (
        bottomIdx < gradients.length - 1 &&
        gradients[bottomIdx + 1].gradient > GRADIENT_THRESHOLD
    ) {
        bottomIdx++;
    }

    const topDepth = gradients[topIdx].depth;
    const bottomDepth = gradients[bottomIdx].depth;
    const centerDepth = gradients[maxIdx].depth;

    // Classify water layers
    const surfaceData = sorted.filter((p) => p.depth < topDepth);
    const thermoclineData = sorted.filter(
        (p) => p.depth >= topDepth && p.depth <= bottomDepth
    );
    const deepData = sorted.filter((p) => p.depth > bottomDepth);

    const getRange = (
        pts: DepthTempPoint[]
    ): { depthRange: [number, number]; tempRange: [number, number] } => {
        if (pts.length === 0)
            return { depthRange: [0, 0], tempRange: [0, 0] };
        const depths = pts.map((p) => p.depth);
        const temps = pts.map((p) => p.temperature);
        return {
            depthRange: [Math.min(...depths), Math.max(...depths)],
            tempRange: [
                Math.round(Math.min(...temps) * 10) / 10,
                Math.round(Math.max(...temps) * 10) / 10,
            ],
        };
    };

    const surface = getRange(surfaceData);
    const thermo = getRange(thermoclineData);
    const deep = getRange(deepData);

    return {
        topDepth: Math.round(topDepth * 10) / 10,
        bottomDepth: Math.round(bottomDepth * 10) / 10,
        centerDepth: Math.round(centerDepth * 10) / 10,
        maxGradient: Math.round(maxGradient * 1000) / 1000,
        layers: [
            { name: "Surface Layer", ...surface },
            { name: "Thermocline", ...thermo },
            { name: "Deep Layer", ...deep },
        ],
    };
}
