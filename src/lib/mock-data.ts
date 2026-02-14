export type DatasetStatus = "Verified" | "Pending" | "Flagged";

export interface DatasetRow {
  station: string;
  date: string;
  depth: number;
  temp: number;
  salinity: number;
  density: number;
  status: DatasetStatus;
}

export const stats = [
  {
    key: "totalDatasets",
    labelKey: "dataManagement.stats.totalDatasets",
    value: "2,847",
    helperKey: "dataManagement.stats.totalDatasetsHelper",
    icon: "database",
    iconColor: "#0ea5e9",
  },
  {
    key: "ctdStations",
    labelKey: "dataManagement.stats.ctdStations",
    value: "156",
    helperKey: "dataManagement.stats.ctdStationsHelper",
    icon: "map-pin",
    iconColor: "#06b6d4",
  },
  {
    key: "avgTemp",
    labelKey: "dataManagement.stats.avgTemp",
    value: "18.42",
    unit: "℃",
    helperKey: "dataManagement.stats.avgTempHelper",
    icon: "thermometer",
    iconColor: "#ef4444",
  },
  {
    key: "avgSalinity",
    labelKey: "dataManagement.stats.avgSalinity",
    value: "34.857",
    unit: "PSU",
    helperKey: "dataManagement.stats.avgSalinityHelper",
    icon: "droplets",
    iconColor: "#3b82f6",
  },
];

export const datasets: DatasetRow[] = [
  {
    station: "ST-001",
    date: "2024-03-15",
    depth: 125.3,
    temp: 22.45,
    salinity: 34.821,
    density: 1024.56,
    status: "Verified",
  },
  {
    station: "ST-002",
    date: "2024-03-15",
    depth: 250.7,
    temp: 15.83,
    salinity: 35.142,
    density: 1026.18,
    status: "Pending",
  },
  {
    station: "ST-003",
    date: "2024-04-02",
    depth: 78.2,
    temp: 24.17,
    salinity: 33.965,
    density: 1023.41,
    status: "Verified",
  },
  {
    station: "ST-001",
    date: "2024-04-10",
    depth: 500.0,
    temp: 8.76,
    salinity: 34.512,
    density: 1027.33,
    status: "Flagged",
  },
  {
    station: "ST-002",
    date: "2024-05-18",
    depth: 180.5,
    temp: 19.32,
    salinity: 35.087,
    density: 1025.72,
    status: "Verified",
  },
];

export const chartCards = [
  {
    key: "depthTempProfile",
    titleKey: "visualization.charts.depthTempProfile",
    icon: "thermometer",
    color: "#ef4444",
    legendKeys: [
      "visualization.legend.surface",
      "visualization.legend.thermocline",
      "visualization.legend.deep",
    ],
  },
  {
    key: "tsDiagram",
    titleKey: "visualization.charts.tsDiagram",
    icon: "grid-3x3",
    color: "#8b5cf6",
    legendKeys: [
      "visualization.legend.layer1",
      "visualization.legend.layer2",
      "visualization.legend.layer3",
    ],
  },
  {
    key: "depthSalinityProfile",
    titleKey: "visualization.charts.depthSalinityProfile",
    icon: "droplets",
    color: "#3b82f6",
    legendKeys: [
      "visualization.legend.inshore",
      "visualization.legend.shelf",
      "visualization.legend.offshore",
    ],
  },
  {
    key: "temperatureHeatmap",
    titleKey: "visualization.charts.temperatureHeatmap",
    icon: "flame",
    color: "#f59e0b",
    legendKeys: [
      "visualization.legend.temp5",
      "visualization.legend.temp16",
      "visualization.legend.temp28",
    ],
  },
];

export const timeSeriesCards = [
  "visualization.timeSeriesCards.monthlyTempTrend",
  "visualization.timeSeriesCards.seasonalSalinityPatterns",
  "visualization.timeSeriesCards.densityStratification",
  "visualization.timeSeriesCards.stationCoverageMap",
];
