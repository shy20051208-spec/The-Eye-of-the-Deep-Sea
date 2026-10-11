# Abyss Eye - 深渊之眼 CTD 数据管理系统
![GitHub](https://img.shields.io/github/license/shy20051208-spec/The-Eye-of-the-Deep-Sea) 门户（Next.js）

面向“深渊探测温盐深（CTD/TSG）数据”的管理、分析与可视化门户（PC 优先）。  
当前版本以 **Mock 数据** 为主（便于独立演示），后续可对接 Spring Boot + MySQL（8081）与算法结果接口。

---

## 1. 技术栈

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS v4**（设计系统/主题样式）
- **shadcn/ui + Radix UI**（高质量组件）
- **lucide-react**（图标）
- **next-themes**（暗色/亮色切换）
- **ESLint**（代码规范）

---

## 2. 快速开始（安装 / 运行）

### 2.1 环境要求
- Node.js 建议 **18+ / 20+**
- npm / pnpm 均可（本项目同时存在 `package-lock.json` 与 `pnpm-lock.yaml`，建议团队统一一种包管理器）

### 2.2 安装依赖
任选其一：

```bash
npm install
# 或
pnpm install
```

## CTD Data Cleaning TEOS-10 Integration

The data-cleaning module can derive TEOS-10 variables (Absolute Salinity, Conservative Temperature, sigma-t, etc.) using a TEOS-10 implementation at runtime. To enable derivation, install a JS TEOS-10 library such as `gsw-js` or `gsw` in your project:

```bash
npm install gsw-js
```

The `deriveVars` function in `src/lib/data-cleaning.ts` will attempt to dynamically import `gsw` or `gsw-js`. If not installed, derivation is skipped and measurements will be annotated with `no_gsw` in their `reasons` array.

If you prefer Python `gsw`, consider creating a small service to compute derived fields and call it from your Node.js code.

### 2.3 Upload.errors 字段说明
- `Upload.errors` 在 SQLite 中保持为 `String?` 类型。
- 实际保存的是 JSON 字符串，例如：`["Row 1: invalid depth", "Row 2: invalid temperature"]`。
- 在后端或前端读取时，需要先将字符串反序列化为数组。

示例：

```ts
import { parseUploadErrors } from "@/lib/utils"

const errorList = parseUploadErrors(upload.errors)
```

如果直接处理原始字段：

```ts
const errorList = upload.errors ? JSON.parse(upload.errors) : []
```

Prisma 查询示例：

```ts
const uploads = await prisma.upload.findMany()
const uploadsWithErrors = uploads.map((upload) => ({
  ...upload,
  errors: upload.errors ? JSON.parse(upload.errors) : [],
}))
```
