<template>
  <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:12px;">
    <div>
      <div style="font-size:18px;font-weight:700;">{{ title }}</div>
      <div v-if="desc" style="opacity:.7;margin-top:4px;">{{ desc }}</div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; desc?: string }>();
</script>
