<template>
  <el-container style="height: 100%; background: var(--bg);">
    <el-aside width="240px" style="padding: 14px;">
      <div class="card" style="height: calc(100vh - 28px); display:flex; flex-direction:column; padding: 14px;">
        <!-- 品牌区 -->
        <div style="display:flex;align-items:center;gap:10px;padding:6px 8px;">
          <div style="width:34px;height:34px;border-radius:12px; background: linear-gradient(135deg,#1f6feb,#6ee7ff); box-shadow: 0 10px 18px rgba(31,111,235,.18);"></div>
          <div>
            <div style="font-weight:800; font-size:16px; line-height: 1.1;">深渊之眼</div>
            <div class="muted" style="font-size:12px;">abyss-eye</div>
          </div>
        </div>

        <div class="hr"></div>

        <!-- 菜单 -->
        <el-menu
          :default-active="active"
          router
          style="border:none; background: transparent;"
        >
          <el-menu-item index="/dashboard">可视化展示</el-menu-item>
          <el-menu-item index="/upload">数据上传</el-menu-item>
        </el-menu>

        <div style="flex:1;"></div>

        <!-- 底部小信息 -->
        <div class="muted" style="font-size:12px; padding: 8px;">
          后端默认：localhost:8081
        </div>
      </div>
    </el-aside>

    <el-container style="padding: 14px 14px 14px 0;">
      <el-header style="height:auto; padding:0; background: transparent;">
        <div class="card" style="display:flex;align-items:center;justify-content:space-between; padding: 12px 14px;">
          <div>
            <div style="font-weight:800; font-size:16px;">深渊探测温盐深数据智能分析与可视化平台</div>
            <div class="muted" style="font-size:12px; margin-top:2px;">Temperature · Salinity · Depth</div>
          </div>

          <div style="display:flex;align-items:center;gap:10px;">
            <el-tag type="info" effect="light">{{ auth.username || "用户" }}</el-tag>
            <el-button size="small" type="danger" plain @click="onLogout">退出</el-button>
          </div>
        </div>
      </el-header>

      <el-main style="padding: 14px 0 0 0; background: transparent;">
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
