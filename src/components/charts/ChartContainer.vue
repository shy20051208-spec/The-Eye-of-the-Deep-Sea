<template>
  <div class="card" style="position:relative; min-height: 340px;">
    <div style="font-weight:700; margin-bottom: 8px; display:flex; align-items:center; justify-content:space-between;">
      <span>{{ title }}</span>
      <slot name="extra" />
    </div>

    <div v-if="loading" style="height:280px;display:flex;align-items:center;justify-content:center;">
      <el-skeleton :rows="6" animated style="width: 100%" />
    </div>

    <div v-else-if="error" style="height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
      <el-result icon="error" title="加载失败" :sub-title="error">
        <template #extra>
          <el-button @click="$emit('retry')">重试</el-button>
        </template>
      </el-result>
    </div>

    <div v-else-if="empty" style="height:280px;display:flex;align-items:center;justify-content:center;">
      <el-empty description="暂无数据" />
    </div>

    <div v-else style="height:280px;">
      <slot />
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
