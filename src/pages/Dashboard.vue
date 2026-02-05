<template>
  <div class="page">
    <PageHeader title="可视化展示" desc="按区域/时间/深度筛选，并运行算法获取可视化 JSON 输出" />

    <!-- ✅ 仅做UI排版优化：更紧凑、更对齐的“工具栏”式筛选区；逻辑不变 -->
    <div class="card" style="margin-bottom:12px;">
      <div class="flex-row" style="gap:14px; align-items:flex-end; flex-wrap:wrap;">
        <div class="flex-row" style="gap:10px;">
          <span class="muted">区域</span>
          <el-select v-model="filters.area" placeholder="全部" style="width:180px">
            <el-option label="全部" value="" />
            <el-option label="太平洋 (PACIFIC)" value="PACIFIC" />
            <el-option label="印度洋 (INDIAN)" value="INDIAN" />
          </el-select>
        </div>

        <div class="flex-row" style="gap:10px;">
          <span class="muted">深度范围(m)</span>
          <el-input-number v-model="filters.depthMin" :min="0" :max="12000" controls-position="right" />
          <span class="muted">-</span>
          <el-input-number v-model="filters.depthMax" :min="0" :max="12000" controls-position="right" />
        </div>

        <div class="flex-row" style="gap:10px; flex:1; min-width:360px;">
          <span class="muted">时间范围</span>
          <el-date-picker
            v-model="filters.timeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            style="flex:1;"
          />
        </div>

        <div class="flex-row" style="gap:10px;">
          <el-button type="primary" :loading="queryLoading" @click="runQuery">查询数据</el-button>
          <el-button type="success" :loading="analysisLoading" @click="runAnalysis">运行分析/获取结果</el-button>
        </div>
      </div>

      <div class="muted" style="margin-top:10px; font-size:12px;">
        交互：点击柱状图某个区域将自动作为筛选条件联动刷新折线图。
      </div>
    </div>

    <div class="grid-2">
      <ChartContainer
        title="图1：区域温度/盐度分布柱状图"
        :loading="analysisLoading"
        :empty="areaAgg.length === 0"
        :error="analysisError"
        @retry="runAnalysis"
      >
        <template #extra>
          <el-radio-group v-model="metric" size="small">
            <el-radio-button label="temperature">温度</el-radio-button>
            <el-radio-button label="salinity">盐度</el-radio-button>
          </el-radio-group>
        </template>

        <AreaBarChart :metric="metric" :data="areaAgg" @areaClick="onAreaClick" />
      </ChartContainer>

      <ChartContainer
        title="图2：深度-温度变化折线图"
        :loading="analysisLoading"
        :empty="depthSeries.length === 0"
        :error="analysisError"
        @retry="runAnalysis"
      >
        <template #extra>
          <el-switch v-model="showSalinity" active-text="叠加盐度" />
        </template>

        <DepthLineChart :data="depthSeries" :show-salinity="showSalinity" />
      </ChartContainer>
    </div>

    <div style="margin-top:12px;">
      <ChartContainer
        title="图3：太平洋 vs 印度洋对比（可插拔模块）"
        :loading="analysisLoading"
        :empty="!compare"
        :error="analysisError"
        @retry="runAnalysis"
      >
        <template #extra>
          <el-switch v-model="showCompare" active-text="显示对比模块" />
        </template>

        <template v-if="showCompare && compare">
          <CompareMap :pacific="compare.pacific" :indian="compare.indian" />
        </template>

        <template v-else>
          <div style="height:100%;display:flex;align-items:center;justify-content:center;">
            <el-empty description="已关闭对比模块（可开关）" />
          </div>
        </template>
      </ChartContainer>
    </div>

    <div class="card" style="margin-top:12px;">
      <div style="font-weight:700;margin-bottom:8px;">查询结果预览（用于联调校验）</div>
      <el-table :data="table.list" size="small" height="320" v-loading="queryLoading">
        <el-table-column prop="area" label="area" width="120" />
        <el-table-column prop="depth" label="depth(m)" width="110" />
        <el-table-column prop="temperature" label="temperature(°C)" width="150" />
        <el-table-column prop="salinity" label="salinity(PSU)" width="150" />
        <el-table-column prop="time" label="time" min-width="220" />
      </el-table>
      <div style="margin-top:10px; display:flex; justify-content:flex-end;">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :page-size="table.pageSize"
          :current-page="table.page"
          :total="table.total"
          @current-change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from "vue";
import { ElMessage } from "element-plus";
import PageHeader from "@/components/common/PageHeader.vue";
import ChartContainer from "@/components/charts/ChartContainer.vue";
import AreaBarChart from "@/components/charts/AreaBarChart.vue";
import DepthLineChart from "@/components/charts/DepthLineChart.vue";
import CompareMap from "@/components/charts/CompareMap.vue";
import { apiAnalyze, apiQuery } from "@/api";
import type { AnalysisResult, MetricType, PageResp, QueryParams, TSGRecord } from "@/types";
import { throttle } from "@/utils/throttle";

const filters = reactive<{
  area: string;
  depthMin: number | null;
  depthMax: number | null;
  timeRange: [string, string] | null;
}>({
  area: "",
  depthMin: 0,
  depthMax: 6000,
  timeRange: null
});

const queryLoading = ref(false);
const analysisLoading = ref(false);
const analysisError = ref("");

const table = reactive<PageResp<TSGRecord>>({
  list: [],
  page: 1,
  pageSize: 50,
  total: 0
});

const metric = ref<MetricType>("temperature");
const showSalinity = ref(true);
const showCompare = ref(true);

const analysis = ref<AnalysisResult>({
  areaAgg: [],
  depthSeries: []
});

const areaAgg = computed(() => analysis.value.areaAgg || []);
const depthSeries = computed(() => analysis.value.depthSeries || []);
const compare = computed(() => analysis.value.compare);

function buildParams(extra?: Partial<QueryParams>): QueryParams {
  const [timeStart, timeEnd] = filters.timeRange || [undefined as any, undefined as any];
  return {
    area: filters.area || "",
    depthMin: filters.depthMin,
    depthMax: filters.depthMax,
    timeStart,
    timeEnd,
    page: table.page,
    pageSize: table.pageSize,
    ...extra
  };
}

async function runQuery() {
  queryLoading.value = true;
  try {
    const res = await apiQuery(buildParams());
    table.list = res.list;
    table.page = res.page;
    table.pageSize = res.pageSize;
    table.total = res.total;
    ElMessage.success("查询成功");
  } finally {
    queryLoading.value = false;
  }
}

async function runAnalysis() {
  analysisLoading.value = true;
  analysisError.value = "";
  try {
    const res = await apiAnalyze(buildParams({ page: 1, pageSize: 999999 }));
    analysis.value = res;

    if (!res.areaAgg?.length && !res.depthSeries?.length) {
      ElMessage.warning("分析结果为空（请调整筛选条件或检查后端/算法输出）");
    } else {
      ElMessage.success("分析结果已更新");
    }
  } catch (e: any) {
    analysisError.value = e?.message || "分析失败";
  } finally {
    analysisLoading.value = false;
  }
}

const runAnalysisThrottled = throttle(() => runAnalysis(), 400);

function onAreaClick(area: string) {
  filters.area = area;
  table.page = 1;
  ElMessage.info(`已选择区域：${area}（联动刷新折线图）`);
  runAnalysisThrottled();
}

async function onPageChange(p: number) {
  table.page = p;
  await runQuery();
}

runQuery();
runAnalysis();
</script>

<!-- ✅ 只加一个小的 muted 工具类；不会影响逻辑 -->
<style scoped>
.muted {
  opacity: 0.75;
}
</style>
