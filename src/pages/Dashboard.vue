<template>
  <div class="page">
    <PageHeader title="可视化展示" desc="按区域/时间/深度筛选，并运行算法获取可视化 JSON 输出" />

    <!-- ✅ UI：顶部工具栏卡片（不改逻辑） -->
    <div class="toolbar-card">
      <div class="toolbar-top">
        <div class="toolbar-title">
          <span class="toolbar-title__text">筛选条件</span>
          <span class="toolbar-title__sub">Filter</span>
        </div>

        <div class="toolbar-actions">
          <el-button type="primary" :loading="queryLoading" @click="runQuery">查询数据</el-button>
          <el-button type="success" :loading="analysisLoading" @click="runAnalysis">运行分析/获取结果</el-button>
        </div>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-grid">
        <div class="field">
          <div class="field__label">区域</div>
          <el-select v-model="filters.area" placeholder="全部" class="field__control">
            <el-option label="全部" value="" />
            <el-option label="太平洋 (PACIFIC)" value="PACIFIC" />
            <el-option label="印度洋 (INDIAN)" value="INDIAN" />
          </el-select>
        </div>

        <div class="field">
          <div class="field__label">深度范围 (m)</div>
          <div class="field__depth">
            <el-input-number v-model="filters.depthMin" :min="0" :max="12000" controls-position="right" />
            <span class="field__sep">—</span>
            <el-input-number v-model="filters.depthMax" :min="0" :max="12000" controls-position="right" />
          </div>
        </div>

        <div class="field field--span2">
          <div class="field__label">时间范围</div>
          <el-date-picker
            v-model="filters.timeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            class="field__control"
          />
        </div>
      </div>

      <div class="toolbar-hint">
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

    <!-- ✅ UI：表格卡片更像“模块” -->
    <div class="table-card">
      <div class="table-card__header">
        <div class="table-card__title">查询结果预览</div>
        <div class="table-card__sub">用于联调校验</div>
      </div>

      <el-table :data="table.list" size="small" height="320" v-loading="queryLoading">
        <el-table-column prop="area" label="area" width="120" />
        <el-table-column prop="depth" label="depth(m)" width="110" />
        <el-table-column prop="temperature" label="temperature(°C)" width="150" />
        <el-table-column prop="salinity" label="salinity(PSU)" width="150" />
        <el-table-column prop="time" label="time" min-width="220" />
      </el-table>

      <div class="table-card__footer">
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

<style scoped>
/* --- Toolbar Card --- */
.toolbar-card {
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(2, 10, 35, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.06);
  padding: 14px 16px 12px 16px;
  margin-bottom: 12px;
}

.toolbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.toolbar-title__text {
  font-weight: 900;
  font-size: 16px;
  color: rgba(15, 23, 42, 0.92);
}

.toolbar-title__sub {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.45);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.toolbar-divider {
  height: 1px;
  margin: 10px 0 12px 0;
  background: linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.06),
    rgba(15, 23, 42, 0.02),
    rgba(15, 23, 42, 0.06)
  );
}

.toolbar-grid {
  display: grid;
  grid-template-columns: 220px 360px 1fr;
  gap: 12px 14px;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field--span2 {
  grid-column: span 1;
  min-width: 320px;
}

.field__label {
  font-size: 12px;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.55);
}

.field__control {
  width: 100%;
}

.field__depth {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field__sep {
  opacity: 0.5;
  font-weight: 700;
}

.toolbar-hint {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.55);
}

/* --- Table Card --- */
.table-card {
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(2, 10, 35, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.06);
  padding: 12px 16px 14px 16px;
  margin-top: 12px;
}

.table-card__header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.table-card__title {
  font-weight: 900;
  color: rgba(15, 23, 42, 0.92);
}

.table-card__sub {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.5);
  font-weight: 700;
}

.table-card__footer {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 1100px) {
  .toolbar-grid {
    grid-template-columns: 1fr 1fr;
  }
  .field--span2 {
    grid-column: span 2;
  }
}

@media (max-width: 720px) {
  .toolbar-top {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-actions {
    justify-content: flex-start;
  }
  .toolbar-grid {
    grid-template-columns: 1fr;
  }
  .field--span2 {
    grid-column: span 1;
  }
}
</style>
