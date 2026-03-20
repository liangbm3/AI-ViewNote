import React from 'react';
import ReactMarkdown from 'react-markdown';

interface SubtitleItem {
  start_time: number;
  text: string;
}

interface ContentDisplayProps {
  imageTextContent?: string;
  subtitles?: SubtitleItem[];
}

export function ContentDisplay({ imageTextContent, subtitles }: ContentDisplayProps) {
  // 模拟数据
  const mockImageTextContent = `# 视频内容分析

## 主要知识点

### 1. 人工智能基础概念
人工智能（AI）是指由人制造出来的机器所表现出来的智能。它通过学习、推理、感知、理解、交流等能力，模拟人类的思维过程。

### 2. 机器学习分类
- **监督学习**：有标签数据训练
- **无监督学习**：无标签数据聚类
- **强化学习**：通过奖励机制学习

### 3. 深度学习应用
深度学习是机器学习的一个分支，主要应用于：
- 计算机视觉
- 自然语言处理
- 语音识别
- 推荐系统

## 实践建议

1. **数据质量**：确保训练数据的质量和多样性
2. **模型选择**：根据任务特点选择合适的模型架构
3. **评估指标**：使用合适的评估指标衡量模型性能

> 人工智能的发展正在深刻改变我们的生活和工作方式，掌握相关技能对个人发展至关重要。`;

  const mockSubtitles: SubtitleItem[] = [
    { start_time: 0, text: "大家好，今天我们来学习人工智能的基础知识" },
    { start_time: 3000, text: "人工智能是指由人制造出来的机器所表现出来的智能" },
    { start_time: 6000, text: "它通过学习、推理、感知等能力模拟人类的思维过程" },
    { start_time: 9000, text: "机器学习是人工智能的一个重要分支" },
    { start_time: 12000, text: "监督学习需要有标签的数据进行训练" },
    { start_time: 15000, text: "无监督学习则是在无标签数据中发现模式" },
    { start_time: 18000, text: "强化学习通过奖励机制来指导学习过程" },
    { start_time: 21000, text: "深度学习在计算机视觉领域有广泛应用" },
    { start_time: 24000, text: "自然语言处理让机器能够理解和生成人类语言" },
    { start_time: 27000, text: "语音识别技术让机器能够听懂人类的语音" },
  ];

  const displayContent = imageTextContent || mockImageTextContent;
  const displaySubtitles = subtitles || mockSubtitles;

  // 确保始终有内容显示
  if (!displayContent && !displaySubtitles.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">转换结果</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          暂无内容，请稍后再试...
        </div>
      </div>
    );
  }

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">转换结果</h2>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* 左侧：图文信息 */}
        <div className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">图文信息</h3>
          <div className="prose prose-sm max-w-none overflow-y-auto max-h-96">
            <ReactMarkdown
              components={{
                h1: ({children}) => <h1 className="text-lg font-semibold text-gray-900 mb-3">{children}</h1>,
                h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-4">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-medium text-gray-900 mb-2 mt-3">{children}</h3>,
                p: ({children}) => <p className="text-sm text-gray-700 leading-relaxed mb-3">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({children}) => <li className="text-sm text-gray-700">{children}</li>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">{children}</blockquote>,
                code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                pre: ({children}) => <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto mb-3">{children}</pre>,
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>

        {/* 右侧：字幕 */}
        <div className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">字幕</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {displaySubtitles.map((subtitle, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded flex-shrink-0">
                  {formatTime(subtitle.start_time)}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {subtitle.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}