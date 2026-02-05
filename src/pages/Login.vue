<template>
  <div style="height:100%;display:flex;align-items:center;justify-content:center;background:#f6f7fb;padding:16px;">
    <div class="card" style="width:420px;">
      <div style="font-size:20px;font-weight:800;margin-bottom:6px;">深渊之眼（abyss-eye）</div>
      <div style="opacity:.7;margin-bottom:16px;">登录后进入温盐深数据智能分析与可视化平台</div>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" type="password" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" style="width:100%" @click="onSubmit">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div style="opacity:.65;font-size:12px;">
        当前模式：<b>{{ useMock ? "Mock" : "Real API" }}</b>（通过 VITE_USE_MOCK 切换）
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { apiLogin } from "@/api";
import { useAuthStore } from "@/store";
import { useRouter } from "vue-router";
import { USE_MOCK } from "@/mock";

const router = useRouter();
const auth = useAuthStore();
const useMock = USE_MOCK;

const form = reactive({ username: "", password: "" });
const formRef = ref<FormInstance>();
const loading = ref(false);

const rules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

async function onSubmit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    const res = await apiLogin({ ...form });
    if (!res.token) throw new Error("登录失败：token 为空");
    auth.setAuth(res.token, res.username || form.username);
    ElMessage.success("登录成功");
    router.replace("/dashboard");
  } finally {
    loading.value = false;
  }
}
</script>
