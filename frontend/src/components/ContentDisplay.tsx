import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, FileText, MessageSquare } from 'lucide-react';

interface SubtitleItem {
  start_time: number;
  text: string;
}

interface ContentDisplayProps {
  imageTextContent?: string;
  subtitles?: SubtitleItem[];
}

export function ContentDisplay({ imageTextContent, subtitles }: ContentDisplayProps) {
  const displayContent = imageTextContent || '';
  const displaySubtitles = subtitles || [];

  // 确保始终有内容显示
  if (!displayContent && !displaySubtitles.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col min-h-0 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-gray-50/50 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">转换结果</h2>
        </div>
        <div className="p-6 flex-1 flex items-center justify-center text-gray-500">
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col min-h-0 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-gray-50/50 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">转换结果</h2>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-200 flex-1 min-h-0">
        {/* 左侧：图文信息 */}
        <div className="p-6 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <FileText className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">图文信息</h3>
          </div>
          <div className="prose prose-sm max-w-none overflow-y-auto flex-1 pr-2">
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
        <div className="p-6 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">字幕</h3>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
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