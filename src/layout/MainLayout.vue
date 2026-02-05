<template>
  <el-container class="layout">
    <!-- Sidebar -->
    <el-aside class="sider" width="240px">
      <div class="brand">
        <div class="brand__logo">A</div>
        <div class="brand__text">
          <div class="brand__name">深渊之眼</div>
          <div class="brand__sub">abyss-eye</div>
        </div>
      </div>

      <el-menu class="menu" :default-active="active" router>
        <el-menu-item index="/dashboard">
          <span>可视化展示</span>
        </el-menu-item>
        <el-menu-item index="/upload">
          <span>数据上传</span>
        </el-menu-item>
      </el-menu>

      <div class="sider__footer">
        <div class="sider__hint">Mock / Real 可在 .env 切换</div>
      </div>
    </el-aside>

    <!-- Main -->
    <el-container>
      <el-header class="header">
        <div class="header__left">
          <div class="header__title">深渊探测温盐深数据智能分析与可视化平台</div>
          <div class="header__badge">{{ envBadge }}</div>
        </div>

        <div class="header__right">
          <div class="user">
            <div class="user__avatar">{{ (auth.username || "U").slice(0, 1).toUpperCase() }}</div>
            <div class="user__meta">
              <div class="user__name">{{ auth.username || "用户" }}</div>
              <div class="user__sub">在线</div>
            </div>
          </div>
          <el-button size="small" @click="onLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main">
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

const envBadge = computed(() => {
  // 使用你 main.ts 里 define 的 __APP_ENV__（没有也不影响显示）
  try {
    return typeof __APP_ENV__ === "string" ? __APP_ENV__ : "env";
  } catch {
    return "env";
  }
});

function onLogout() {
  auth.logout();
  router.replace("/login");
}
</script>

<style scoped>
.layout {
  height: 100%;
  background: #f6f7fb;
}

/* Sidebar */
.sider {
  height: 100%;
  background: linear-gradient(180deg, #0b1220, #0a1020);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 14px 16px;
}

.brand__logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(34, 211, 238, 1));
  color: #fff;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.22);
}

.brand__name {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 900;
  font-size: 16px;
  line-height: 1.2;
}

.brand__sub {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.menu {
  background: transparent;
  border-right: none;
  padding: 6px 10px;
}

:deep(.el-menu-item) {
  margin: 6px 6px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.78);
}

:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
}

:deep(.el-menu-item.is-active) {
  background: rgba(59, 130, 246, 0.18);
  color: rgba(255, 255, 255, 0.96);
  position: relative;
}

:deep(.el-menu-item.is-active::before) {
  content: "";
  position: absolute;
  left: 8px;
  top: 10px;
  bottom: 10px;
  width: 4px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 1);
}

.sider__footer {
  margin-top: auto;
  padding: 12px 16px 16px 16px;
}

.sider__hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 64px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
}

.header__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.header__title {
  font-weight: 900;
  color: rgba(15, 23, 42, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header__badge {
  font-size: 12px;
  font-weight: 800;
  color: rgba(59, 130, 246, 1);
  background: rgba(59, 130, 246, 0.12);
  padding: 4px 10px;
  border-radius: 999px;
}

.header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user__avatar {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: rgba(15, 23, 42, 0.8);
}

.user__name {
  font-weight: 800;
  color: rgba(15, 23, 42, 0.9);
  line-height: 1.1;
}

.user__sub {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.5);
  font-weight: 700;
  margin-top: 2px;
}

/* Main */
.main {
  background: #f6f7fb;
  padding: 14px;
}
</style>
