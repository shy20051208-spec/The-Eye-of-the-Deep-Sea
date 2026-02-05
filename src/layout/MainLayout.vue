<template>
  <el-container style="height: 100%">
    <el-aside width="220px" style="border-right: 1px solid #eee">
      <div style="padding: 16px; font-weight: 700; font-size: 16px">
        深渊之眼 <span style="opacity: 0.6">(abyss-eye)</span>
      </div>
      <el-menu :default-active="active" router>
        <el-menu-item index="/dashboard">可视化展示</el-menu-item>
        <el-menu-item index="/upload">数据上传</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header
        style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee"
      >
        <div style="font-weight: 600">深渊探测温盐深数据智能分析与可视化平台</div>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="opacity:.75">你好，{{ auth.username || "用户" }}</span>
          <el-button size="small" @click="onLogout">退出</el-button>
        </div>
      </el-header>
      <el-main style="background:#f6f7fb">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const active = computed(() => route.path);

function onLogout() {
  auth.logout();
  router.replace("/login");
}
</script>
