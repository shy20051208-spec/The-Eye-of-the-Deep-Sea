<template>
  <div class="login-wrap">
    <div class="bg-blobs" aria-hidden="true">
      <div class="blob b1"></div>
      <div class="blob b2"></div>
      <div class="blob b3"></div>
    </div>

    <div class="login-card card">
      <div class="brand">
        <div class="logo"></div>
        <div>
          <div class="title">深渊之眼（abyss-eye）</div>
          <div class="sub muted">温盐深数据智能分析与可视化平台</div>
        </div>
      </div>

      <div class="hr"></div>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="0px" @keyup.enter="onSubmit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" clearable>
            <template #prefix>
              <span class="muted" style="font-size:12px;">👤</span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            placeholder="密码"
            type="password"
            show-password
            size="large"
            clearable
          >
            <template #prefix>
              <span class="muted" style="font-size:12px;">🔒</span>
            </template>
          </el-input>
        </el-form-item>

        <el-button class="login-btn" type="primary" :loading="loading" size="large" @click="onSubmit">
          登录
        </el-button>
      </el-form>

      
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


const router = useRouter();
const auth = useAuthStore();


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

<style scoped>
.login-wrap{
  height: 100%;
  min-height: 100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 18px;
  position: relative;
  background: radial-gradient(1200px 800px at 20% 10%, rgba(31,111,235,.18), transparent 60%),
              radial-gradient(900px 600px at 90% 20%, rgba(110,231,255,.22), transparent 55%),
              radial-gradient(900px 600px at 40% 90%, rgba(99,102,241,.14), transparent 55%),
              var(--bg);
  overflow:hidden;
}

.bg-blobs{ position:absolute; inset:0; pointer-events:none; }
.blob{
  position:absolute;
  filter: blur(12px);
  opacity: .7;
  border-radius: 999px;
}
.b1{ width: 420px; height: 420px; left: -140px; top: -140px; background: rgba(31,111,235,.28); }
.b2{ width: 380px; height: 380px; right: -140px; top: 80px; background: rgba(110,231,255,.28); }
.b3{ width: 360px; height: 360px; left: 30%; bottom: -160px; background: rgba(99,102,241,.22); }

.login-card{
  width: 440px;
  padding: 18px;
  position: relative;
  backdrop-filter: blur(8px);
}

.brand{
  display:flex;
  align-items:center;
  gap: 12px;
  padding: 6px 6px 10px 6px;
}

.logo{
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(135deg,#1f6feb,#6ee7ff);
  box-shadow: 0 12px 18px rgba(31,111,235,.18);
}

.title{
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
}

.sub{
  margin-top: 4px;
  font-size: 12px;
}

.login-btn{
  width: 100%;
  margin-top: 6px;
  border-radius: 12px;
  font-weight: 800;
}

.foot{
  margin-top: 12px;
  font-size: 12px;
  text-align:center;
}
.foot code{
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(17,24,39,.06);
  border: 1px solid rgba(17,24,39,.08);
}
</style>
