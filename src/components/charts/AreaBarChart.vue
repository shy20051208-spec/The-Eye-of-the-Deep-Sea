<template>
  <div ref="elRef" style="width:100%;height:100%;" />
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MetricType } from "@/types";

const props = defineProps<{
  metric: MetricType; // temperature | salinity
  data: Array<{ area: string; tempAvg: number; salAvg: number; count: number }>;
}>();

const emit = defineEmits<{
  (e: "areaClick", area: string): void;
}>();

const elRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function render() {
  if (!chart) return;
  const areas = props.data.map((x) => x.area);
  const values = props.data.map((x) => (props.metric === "temperature" ? x.tempAvg : x.salAvg));

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const p = params?.[0];
        const row = props.data[p.dataIndex];
        return `
          <div><b>${row.area}</b></div>
          <div>温度均值: ${row.tempAvg}</div>
          <div>盐度均值: ${row.salAvg}</div>
          <div>样本数: ${row.count}</div>
        `;
      }
    },
    grid: { left: 70, right: 18, top: 40, bottom: 40 },

    xAxis: { type: "category", data: areas, axisLabel: { rotate: 0 } },
    yAxis: {
  type: "value",
  name: props.metric === "temperature" ? "温度(°C)" : "盐度(PSU)",
  nameLocation: "end",
  nameRotate: 0,
  nameGap: 10,
  nameTextStyle: { align: "left" }
},


    series: [
      {
        type: "bar",
        data: values,
        barMaxWidth: 48
      }
    ]
  };

  chart.setOption(option, true);
}

function resize() {
  chart?.resize();
}

onMounted(() => {
  if (!elRef.value) return;
  chart = echarts.init(elRef.value);
  chart.on("click", (p: any) => {
    const area = props.data[p.dataIndex]?.area;
    if (area) emit("areaClick", area);
  });
  window.addEventListener("resize", resize);
  render();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  chart?.dispose();
  chart = null;
});

watch(
  () => [props.metric, props.data],
  () => render(),
  { deep: true }
);
</script>
