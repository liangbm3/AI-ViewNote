# AI-ViewNote

AI-ViewNote 是一款基于 Wails v3 构建的现代化桌面应用程序。它集成了本地音视频处理、云端语音识别（ASR）以及大语言模型（LLM）能力，能够帮助用户一键将视频或音频内容转化为结构化的文字笔记和各种风格笔记。

##  功能特性

-  **本地音视频处理**：集成了 FFmpeg，支持音视频格式的快速转换与音频提取。
-  **语音转写提取**：结合火山引擎（Volcengine）等云服务，实现高精度的语音到文本（Speech-to-Text）转换。
-  **AI 智能笔记**：通过标准的 OpenAI 接口（支持多种大模型），快速对转写文本进行深加工，生成核心摘要、结构化大纲和总结笔记。
-  **现代化桌面 UI**：前端采用 React + TypeScript + Vite + Tailwind CSS / Radix UI 构建，提供流畅美观的本地用户体验。

##  技术栈选型

- **桌面端框架**：[Wails v3](https://v3.wails.io/)
- **后端 (Backend)**：Go
- **前端 (Frontend)**：React, TypeScript, Vite, Tailwind CSS, Radix UI 组件库
- **核心依赖包**：
  - github.com/sashabaranov/go-openai：用于对话和提取笔记过程的 AI 交互。
  - github.com/volcengine/ve-tos-golang-sdk/v2：用于对接火山引擎的对象存储与相关云服务。
  - 内部集成的 FFmpeg 库用于本地音视频剪辑及抽取音频。

##  环境要求

开发本项目前，您的开发环境需要具备以下要求：

- [Go](https://go.dev/) 1.20 或更高版本
- [Node.js](https://nodejs.org/) & npm (用于安装前端依赖)
- [Wails v3 CLI](https://v3.wails.io/) 命令行工具包
- [FFmpeg](https://ffmpeg.org/)（应用执行音视频转换相关功能需要系统或内置存在可用依赖）

##  快速开始

### 1. 克隆代码至本地

`sh
git clone https://github.com/your-repo/AI-ViewNote.git
cd AI-ViewNote
`

### 2. 启动开发环境

通过执行以下命令即可启动热重载开发服务器（将同时启动前、后端服务）：

`sh
wails3 dev
`

### 3. 构建发布版本

执行以下命令将代码打包为对应操作系统（当前平台）的独立可执行程序：

`sh
wails3 build
`

编译产物将生成在您的工程结构目录下。

##  开源协议

本项目基于 [MIT License](LICENSE) 协议发布。
