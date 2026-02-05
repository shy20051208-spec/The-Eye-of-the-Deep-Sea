<template>
  <div class="page">
    <PageHeader title="可视化展示" desc="按区域/时间/深度筛选，并运行算法获取可视化 JSON 输出" />

    <!-- 筛选工具栏（仅UI排版优化，逻辑不变） -->
    <div class="card toolbar-card">
      <div class="toolbar">
        <div class="toolbar__left">
          <div class="field">
            <div class="field__label">区域</div>
            <el-select v-model="filters.area" placeholder="全部" class="w-180">
              <el-option label="全部" value="" />
              <el-option label="太平洋 (PACIFIC)" value="PACIFIC" />
              <el-option label="印度洋 (INDIAN)" value="INDIAN" />
            </el-select>
          </div>

          <div class="field">
            <div class="field__label">深度范围(m)</div>
            <div class="range">
              <el-input-number v-model="filters.depthMin" :min="0" :max="12000" controls-position="right" />
              <span class="range__sep">-</span>
              <el-input-number v-model="filters.depthMax" :min="0" :max="12000" controls-position="right" />
            </div>
          </div>

          <div class="field field--grow">
            <div class="field__label">时间范围</div>
            <el-date-picker
              v-model="filters.timeRange"
              type="datetimerange"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              class="time-picker"
            />
          </div>
        </div>

        <div class="toolbar__right">
          <el-button type="primary" :loading="queryLoading" @click="runQuery">查询数据</el-button>
          <el-button type="success" :loading="analysisLoading" @click="runAnalysis">运行分析/获取结果</el-button>
        </div>
      </div>

      <div class="toolbar__hint">
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

    <div class="mt-12">
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
          <div class="center-state">
            <el-empty description="已关闭对比模块（可开关）" />
          </div>
        </template>
      </ChartContainer>
    </div>

    <div class="card table-card">
      <div class="table-card__title">查询结果预览（用于联调校验）</div>

      <el-table :data="table.list" size="small" height="320" v-loading="queryLoading">
        <el-table-column prop="area" label="area" width="120" />
        <el-table-column prop="depth" label="depth(m)" width="110" />
        <el-table-column prop="temperature" label="temperature(°C)" width="150" />
        <el-table-column prop="salinity" label="salinity(PSU)" width="150" />
        <el-table-column prop="time" label="time" min-width="220" />
      </el-table>

      <div class="table-card__pager">
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
/* 小工具类 */
.mt-12 {
  margin-top: 12px;
}
.w-180 {
  width: 180px;
}

/* 工具栏卡片 */
.toolbar-card {
  margin-bottom: 12px;
  padding: 14px 14px 12px 14px;
}

.toolbar {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
}

.toolbar__left {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
  flex: 1;
  min-width: 520px;
}

.toolbar__right {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 0 0 auto;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field--grow {
  flex: 1;
  min-width: 360px;
}

.field__label {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.66);
  line-height: 1;
  padding-left: 2px;
}

.range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range__sep {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.45);
}

.time-picker {
  width: 100%;
}

.toolbar__hint {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.58);
}

/* 空态居中 */
.center-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表格卡片 */
.table-card {
  margin-top: 12px;
  padding: 14px 14px 12px 14px;
}

.table-card__title {
  font-weight: 800;
  color: rgba(15, 23, 42, 0.9);
  margin-bottom: 10px;
}

.table-card__pager {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>
