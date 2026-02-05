<template>
  <div class="page">
    <PageHeader title="数据上传" desc="上传 CSV/Excel 到后端入库，后续用于查询与算法分析">
      <template #default>
        <el-tag type="info">后端端口：8081</el-tag>
      </template>
    </PageHeader>

    <div class="card">
      <div class="flex-row">
        <el-upload
          :auto-upload="false"
          :limit="1"
          :on-change="onFileChange"
          :on-exceed="onExceed"
          accept=".csv,.xlsx,.xls"
        >
          <el-button>选择文件</el-button>
          <template #tip>
            <div style="opacity:.7;font-size:12px;margin-top:6px;">
              支持 CSV / Excel（.xlsx/.xls）
            </div>
          </template>
        </el-upload>

        <el-button type="primary" :disabled="!file" :loading="loading" @click="onUpload">
          上传
        </el-button>

        <div style="opacity:.75" v-if="file">已选择：<b>{{ file.name }}</b></div>
      </div>

      <div style="margin-top:16px;">
        <el-alert v-if="result" :title="resultTitle" type="success" show-icon :closable="true">
          <template #default>
            <div>文件名：{{ result.fileName }}</div>
            <div>入库条数：{{ result.insertedRows }}</div>
            <div>上传时间：{{ result.uploadedAt }}</div>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import PageHeader from "@/components/common/PageHeader.vue";
import { apiUpload } from "@/api";
import type { UploadResp } from "@/types";

const file = ref<File | null>(null);
const loading = ref(false);
const result = ref<UploadResp | null>(null);

const resultTitle = computed(() => `上传成功（Mock/真实后端均可）`);

function onExceed() {
  ElMessage.warning("一次只能选择一个文件");
}

function onFileChange(uploadFile: any) {
  file.value = uploadFile.raw;
  result.value = null;
}

async function onUpload() {
  if (!file.value) return;
  loading.value = true;
  try {
    const res = await apiUpload(file.value);
    result.value = res;
    ElMessage.success("上传成功");
  } finally {
    loading.value = false;
  }
}
</script>
