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
