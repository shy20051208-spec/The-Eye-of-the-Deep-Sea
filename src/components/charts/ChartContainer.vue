<template>
  <div class="chart-card">
    <div class="chart-card__header">
      <div class="chart-card__title">
        <span class="chart-card__title-text">{{ title }}</span>
      </div>

      <div class="chart-card__extra">
        <slot name="extra" />
      </div>
    </div>

    <div class="chart-card__divider"></div>

    <div class="chart-card__body">
      <div v-if="loading" class="chart-card__state">
        <el-skeleton :rows="6" animated style="width: 100%" />
      </div>

      <div v-else-if="error" class="chart-card__state">
        <el-result icon="error" title="加载失败" :sub-title="error">
          <template #extra>
            <el-button @click="$emit('retry')">重试</el-button>
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
  position: relative;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.06);
  overflow: hidden;
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
  min-width: 0;
}

.chart-card__title-text {
  font-weight: 800;
  font-size: 16px;
  line-height: 1.2;
  color: rgba(15, 23, 42, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-card__extra {
  display: flex;
  align-items: center;
  gap: 8px;
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
