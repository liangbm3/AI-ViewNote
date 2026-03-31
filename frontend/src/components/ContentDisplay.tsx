import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, FileText, MessageSquare, Download, FileDown, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { DownloadMarkdown, DownloadSubtitles } from '../../bindings/AI-ViewNote/backend/service/taskservice.js';
import { ChatPanel } from './ChatPanel';

interface SubtitleItem {
  start_time: number;
  text: string;
}

interface ContentDisplayProps {
  imageTextContent?: string;
  subtitles?: SubtitleItem[];
  taskId?: string; // 添加任务ID用于下载功能
}

export function ContentDisplay({ imageTextContent, subtitles, taskId }: ContentDisplayProps) {
  const [downloading, setDownloading] = useState<{[key: string]: boolean}>({});
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 下载Markdown
  const handleDownloadMarkdown = async () => {
    if (!taskId) return;

    setDownloading(prev => ({ ...prev, markdown: true }));
    try {
      const response = await DownloadMarkdown(parseInt(taskId));
      if (response.success) {
        toast.success('Markdown文件已保存到下载目录', {
          description: response.data?.filename || '文件保存成功'
        });
      } else {
        toast.error('下载失败', {
          description: response.message
        });
      }
    } catch (error) {
      toast.error('下载出错', {
        description: error instanceof Error ? error.message : '未知错误'
      });
      console.error('下载Markdown失败:', error);
    } finally {
      setDownloading(prev => ({ ...prev, markdown: false }));
    }
  };

  // 下载字幕
  const handleDownloadSubtitles = async (format: 'srt' | 'vtt' | 'txt') => {
    if (!taskId) return;

    setDownloading(prev => ({ ...prev, subtitles: true }));
    try {
      const response = await DownloadSubtitles(parseInt(taskId), format);
      if (response.success) {
        const formatNames = {
          srt: 'SRT字幕',
          vtt: 'VTT字幕',
          txt: 'TXT字幕'
        };
        toast.success(`${formatNames[format]}文件已保存到下载目录`, {
          description: response.data?.filename || '文件保存成功'
        });
      } else {
        toast.error('下载失败', {
          description: response.message
        });
      }
    } catch (error) {
      toast.error('下载出错', {
        description: error instanceof Error ? error.message : '未知错误'
      });
      console.error('下载字幕失败:', error);
    } finally {
      setDownloading(prev => ({ ...prev, subtitles: false }));
    }
  };
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
    <>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col min-h-0 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">转换结果</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* AI 对话按钮 */}
          {taskId && (
            <button
              onClick={() => setIsChatOpen(true)}
              title="AI 对话"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Bot className="w-4 h-4" />
              AI 对话
            </button>
          )}

          {/* 下载按钮组 */}
          {taskId && (
          <div className="flex items-center gap-3">
            {/* Markdown下载按钮 */}
            <button
              onClick={handleDownloadMarkdown}
              disabled={downloading.markdown}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {downloading.markdown ? '下载中...' : '下载Markdown'}
            </button>

            {/* 字幕下载下拉菜单 */}
            <div className="relative group">
              <button
                      disabled={downloading.subtitles}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileDown className="w-4 h-4" />
                  {downloading.subtitles ? '下载中...' : '下载字幕'}
              </button>

              {/* 下拉菜单 */}
              <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => handleDownloadSubtitles('srt')}
                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    SRT格式
                  </button>
                  <button
                    onClick={() => handleDownloadSubtitles('vtt')}
                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    VTT格式
                  </button>
                  <button
                    onClick={() => handleDownloadSubtitles('txt')}
                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    TXT格式
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
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
    <ChatPanel taskId={taskId} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}