<template>
  <div class="chart-card">
    <!-- Header -->
    <div class="chart-card__header">
      <div class="chart-card__title">
        <div class="chart-card__dot" />
        <span class="chart-card__titleText">{{ title }}</span>
      </div>

      <div class="chart-card__extra">
        <slot name="extra" />
      </div>
    </div>

    <div class="chart-card__divider" />

    <!-- Body -->
    <div class="chart-card__body">
      <div v-if="loading" class="chart-card__state">
        <el-skeleton :rows="6" animated style="width: 100%" />
      </div>

      <div v-else-if="error" class="chart-card__state">
        <el-result icon="error" title="加载失败" :sub-title="error">
          <template #extra>
            <el-button type="primary" @click="$emit('retry')">重试</el-button>
          </template>
        </el-result>
      </div>

      <div v-else-if="empty" class="chart-card__state">
        <el-empty description="暂无数据" />
      </div>

      <div v-else class="chart-card__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  loading: boolean;
  empty: boolean;
  error: string;
}>();
defineEmits<{ (e: "retry"): void }>();
</script>

<style scoped>
.chart-card {
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(2, 10, 35, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.06);
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.chart-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 36px rgba(2, 10, 35, 0.08);
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px 16px;
}

.chart-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.chart-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(34, 211, 238, 1));
  box-shadow: 0 6px 14px rgba(59, 130, 246, 0.22);
  flex: 0 0 auto;
}

.chart-card__titleText {
  font-weight: 800;
  font-size: 16px;
  color: rgba(15, 23, 42, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-card__extra {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 0 0 auto;
}

.chart-card__divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.06),
    rgba(15, 23, 42, 0.02),
    rgba(15, 23, 42, 0.06)
  );
}

.chart-card__body {
  padding: 12px 16px 16px 16px;
}

.chart-card__state {
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-card__content {
  height: 280px;
}
</style>
