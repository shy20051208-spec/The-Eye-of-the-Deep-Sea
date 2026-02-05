<template>
  <div ref="elRef" style="width:100%;height:100%;" />
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  data: Array<{ depth: number; temperature: number; salinity?: number }>;
  showSalinity: boolean;
}>();

const elRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function render() {
  if (!chart) return;

  const depths = props.data.map((x) => x.depth);
  const temps = props.data.map((x) => x.temperature);
  const sals = props.data.map((x) => x.salinity ?? null);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const d = params?.[0]?.axisValue;
        const t = params?.find((p: any) => p.seriesName === "温度")?.data;
        const s = params?.find((p: any) => p.seriesName === "盐度")?.data;
        return `
          <div><b>深度: ${d} m</b></div>
          <div>温度: ${t ?? "-"}</div>
          <div>盐度: ${s ?? "-"}</div>
        `;
      }
    },
    grid: { left: 70, right: 24, top: 40, bottom: 45 },

    xAxis: { type: "category", data: depths, name: "深度(m)" },
    yAxis: [
  {
    type: "value",
    name: "温度(°C)",
    nameLocation: "end",
    nameRotate: 0,
    nameGap: 10,
    nameTextStyle: { align: "left" }
  },
  {
    type: "value",
    name: "盐度(PSU)",
    nameLocation: "end",
    nameRotate: 0,
    nameGap: 10,
    nameTextStyle: { align: "right" }
  }
],

    series: [
      { name: "温度", type: "line", data: temps, smooth: true },
      ...(props.showSalinity
        ? [{ name: "盐度", type: "line", data: sals, yAxisIndex: 1, smooth: true }]
        : [])
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
  window.addEventListener("resize", resize);
  render();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  chart?.dispose();
  chart = null;
});

watch(
  () => [props.data, props.showSalinity],
  () => render(),
  { deep: true }
);
</script>
