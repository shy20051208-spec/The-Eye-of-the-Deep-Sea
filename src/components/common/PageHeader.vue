<template>
  <div class="ph">
    <div class="ph__left">
      <div class="ph__titleRow">
        <div class="ph__dot" />
        <div class="ph__title">{{ title }}</div>
      </div>

      <div v-if="desc" class="ph__desc">{{ desc }}</div>
    </div>

    <div class="ph__right">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; desc?: string }>();
</script>

<style scoped>
.ph {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 24px rgba(2, 10, 35, 0.05);
  backdrop-filter: blur(10px);
}

.ph__left {
  min-width: 0;
}

.ph__titleRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ph__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(34, 211, 238, 1));
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.18);
  flex: 0 0 auto;
}

.ph__title {
  font-size: 18px;
  font-weight: 900;
  color: rgba(15, 23, 42, 0.92);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ph__desc {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.55);
  max-width: 980px;
}

.ph__right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 0 0 auto;
}
</style>
