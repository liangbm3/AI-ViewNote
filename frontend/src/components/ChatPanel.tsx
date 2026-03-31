import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Trash2, Send, Bot, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';

interface ChatPanelProps {
  taskId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ taskId, isOpen, onClose }: ChatPanelProps) {
  const { messages, quickPrompts, streaming, error, sendMessage, clearHistory } = useChat(
    isOpen ? taskId : undefined
  );
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 新消息时自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 面板打开时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-2xl flex flex-col z-50">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-gray-700" />
          <span className="font-semibold text-gray-900">AI 对话</span>
          {messages.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              disabled={streaming}
              title="清空聊天记录"
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
              <Sparkles className="w-7 h-7 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">基于视频内容提问</p>
              <p className="text-xs text-gray-400">AI 将结合生成的笔记内容为你解答</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' && !msg.isStreaming ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0">
                    <ReactMarkdown>{msg.content || (msg.isStreaming ? '\u200b' : '')}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}

                {msg.role === 'assistant' && msg.isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-gray-500 animate-pulse ml-0.5 align-middle rounded-full" />
                )}

                {/* 悬浮复制按钮 */}
                {!msg.isStreaming && msg.content && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    title="复制"
                    className={`absolute -top-2.5 opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity ${
                      msg.role === 'user'
                        ? 'left-1 bg-gray-800 text-white'
                        : 'right-1 bg-white border border-gray-200 text-gray-500 shadow-sm'
                    }`}
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 快速提问（仅在空白时显示） */}
      {messages.length === 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2 flex-shrink-0">
          {quickPrompts.map((p) => (
            <button
              key={p.title}
              onClick={() => sendMessage(p.message)}
              disabled={streaming}
              className="text-xs px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息… (Shift+Enter 换行)"
            disabled={streaming}
            rows={2}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:bg-gray-50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {streaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 text-right">Enter 发送 · Shift+Enter 换行</p>
      </div>
    </div>
  );
}
