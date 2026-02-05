<template>
  <div ref="elRef" style="width:100%;height:100%;" />
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  pacific?: { tempAvg: number; salAvg: number; count: number };
  indian?: { tempAvg: number; salAvg: number; count: number };
}>();

const elRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function render() {
  if (!chart) return;

  const pac = props.pacific;
  const ind = props.indian;

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: (p: any) => {
        const d = p.data;
        return `
          <div><b>${d.name}</b></div>
          <div>温度均值: ${d.tempAvg ?? "-"}</div>
          <div>盐度均值: ${d.salAvg ?? "-"}</div>
          <div>样本数: ${d.count ?? "-"}</div>
        `;
      }
    },
    xAxis: { show: false, type: "value" },
    yAxis: { show: false, type: "value" },
    series: [
      {
        type: "scatter",
        symbolSize: (val: any) => Math.max(30, Math.min(90, val[2] / 10)),
        data: [
          {
            name: "太平洋 (PACIFIC)",
            value: [20, 50, pac?.count ?? 0],
            tempAvg: pac?.tempAvg,
            salAvg: pac?.salAvg,
            count: pac?.count
          },
          {
            name: "印度洋 (INDIAN)",
            value: [80, 50, ind?.count ?? 0],
            tempAvg: ind?.tempAvg,
            salAvg: ind?.salAvg,
            count: ind?.count
          }
        ],
        label: { show: true, formatter: "{b}" }
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
  window.addEventListener("resize", resize);
  render();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  chart?.dispose();
  chart = null;
});

watch(() => [props.pacific, props.indian], () => render(), { deep: true });
</script>
