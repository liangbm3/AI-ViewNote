import { useState, useCallback, useEffect, useRef } from 'react';
import { Events } from '@wailsio/runtime';
import { ChatMessage, QuickPrompt } from '../types';
import {
  SendChatMessage,
  GetChatHistory,
  ClearChatHistory,
  GetQuickPrompts,
} from '../../bindings/AI-ViewNote/backend/service/chatservice.js';

export function useChat(taskId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef<string | null>(null);

  // 加载后端快速提问模板
  useEffect(() => {
    GetQuickPrompts()
      .then((resp: any) => {
        if (resp.success && Array.isArray(resp.data)) {
          setQuickPrompts(
            resp.data.map((p: any) => ({
              title: String(p.title ?? ''),
              message: String(p.message ?? ''),
            }))
          );
        }
      })
      .catch((e: unknown) => {
        console.error('Failed to load quick prompts:', e);
      });
  }, []);

  // 打开面板时加载历史记录（每个 taskId 只加载一次）
  useEffect(() => {
    if (!taskId || loadedRef.current === taskId) return;
    loadedRef.current = taskId;

    GetChatHistory(parseInt(taskId))
      .then((resp: any) => {
        if (resp.success && Array.isArray(resp.data)) {
          setMessages(
            resp.data.map((m: any) => ({
              id: String(m.id),
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))
          );
        }
      })
      .catch((e: unknown) => {
        console.error('Failed to load chat history:', e);
      });
  }, [taskId]);

  // 订阅流式事件（复用 useLog.ts 的 Events.On 模式）
  useEffect(() => {
    const offToken = Events.On('chat_token', (event: any) => {
      const { task_id, token } = event?.data ?? {};
      if (String(task_id) !== taskId) return;
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== 'assistant') return prev;
        return [
          ...prev.slice(0, -1),
          { ...last, content: last.content + token, isStreaming: true },
        ];
      });
    });

    const offDone = Events.On('chat_done', (event: any) => {
      const { task_id } = event?.data ?? {};
      if (String(task_id) !== taskId) return;
      setStreaming(false);
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, isStreaming: false }];
      });
    });

    const offError = Events.On('chat_error', (event: any) => {
      const { task_id, error: errMsg } = event?.data ?? {};
      if (String(task_id) !== taskId) return;
      setStreaming(false);
      setError(errMsg ?? '发生错误，请重试');
      // 移除流式占位消息
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.isStreaming) return prev.slice(0, -1);
        return prev;
      });
    });

    return () => {
      if (typeof offToken === 'function') offToken();
      if (typeof offDone === 'function') offDone();
      if (typeof offError === 'function') offError();
    };
  }, [taskId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!taskId || streaming || !message.trim()) return;

      setError(null);
      setStreaming(true);

      // 乐观追加：用户消息 + 助手占位
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message.trim(),
      };
      const assistantPlaceholder: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        isStreaming: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

      try {
        const resp: any = await SendChatMessage(parseInt(taskId), message.trim());
        if (!resp.success) {
          setStreaming(false);
          setError(resp.message);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.isStreaming) return prev.slice(0, -1);
            return prev;
          });
        }
      } catch (e: unknown) {
        setStreaming(false);
        setError(e instanceof Error ? e.message : '发送失败，请重试');
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.isStreaming) return prev.slice(0, -1);
          return prev;
        });
      }
    },
    [taskId, streaming]
  );

  const clearHistory = useCallback(async () => {
    if (!taskId) return;
    try {
      const resp: any = await ClearChatHistory(parseInt(taskId));
      if (resp.success) {
        setMessages([]);
        setError(null);
        loadedRef.current = null; // 允许重新加载（虽然已清空）
      }
    } catch (e: unknown) {
      console.error('Failed to clear chat history:', e);
    }
  }, [taskId]);

  return { messages, quickPrompts, streaming, error, sendMessage, clearHistory };
}
