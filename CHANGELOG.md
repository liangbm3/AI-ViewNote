# 更新日志 (Changelog)

本项目的所有显著更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，并且本项目采用 [语义化版本控制 (Semantic Versioning)](https://semver.org/lang/zh-CN/)。

## [Unreleased] (未发布)

### 新增 (Added)

### 更改 (Changed)

### 修复 (Fixed)

---

## [1.1.0] - 2026-03-24

### 新增 (Added)

- ✨ 失败界面支持显示具体错误信息
- ✨ 新增弹出消息通知功能，支持开启任务完成后弹窗提醒
- ✨ 支持更改关闭按钮的默认行为，可以选择后台运行或者关闭程序
- ✨ 支持设置打开程序栏时日志栏的折叠行为


### 更改 (Changed)

- 🎨 设置界面默认打开通用设置页面

### 修复 (Fixed)

- 🐛 修复文件大小始终显示为0的问题
- 🐛 禁用拖拽上传功能以修复相关bug

### 构建 (Build)

- 🔧 更新GitHub工作流配置
- 🔧 更新多平台构建配置（Windows、Linux、macOS）

---

## [1.0.1] - 2026-03-23

### 新增 (Added)
- 🎉 AI-ViewNote v1.0.1 正式发布！
- 🎬 本地音视频处理功能 - 集成 FFmpeg，支持音视频格式转换与音频提取
- 🎤 语音转写功能 - 集成火山引擎 ASR 服务，实现高精度语音到文本转换
- 🤖 AI 智能笔记生成 - 支持多种笔记风格：
  - 📚 知识笔记：结构化知识总结，含时间标记
  - 💄 小红书风格：亲切有趣，善用 Emoji 和标签
  - 📱 公众号风格：专业文章格式，逻辑清晰
  - 📝 内容总结：简明摘要，突出核心观点
- 🎨 现代化桌面 UI - 基于 React + TypeScript + Wails v3 构建
- ⚙️ 多服务集成 - 支持火山引擎 LLM、TOS 存储和 ASR 服务
- 🔧 完整的配置管理系统 - 支持 API 密钥和服务配置
---

[Unreleased]: https://github.com/liangbm3/AI-ViewNote/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/liangbm3/AI-ViewNote/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/liangbm3/AI-ViewNote/releases/tag/v1.0.1
