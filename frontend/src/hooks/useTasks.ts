import { useState, useCallback, useEffect } from 'react';
import { Task } from '../types';
import { GetTaskList } from '../../bindings/AI-ViewNote/backend/service/taskservice.js';
import { Events } from '@wailsio/runtime';

type BackendTaskRecord = {
  id: number;
  title: string;
  file_path: string;
  style: string;
  created_at: string;
  updated_at?: string;
  progress: number;
  markdown_content?: string;
  transcription_text?: any[];
};

type BackendResponse = {
  success: boolean;
  message: string;
  data?: BackendTaskRecord[];
};

function mapProgressToStatus(p: number): Task['status'] {
  switch (p) {
    case 0: // NotStarted
      return 'pending';
    case 1: // ExtractingAudio
    case 4: // ExtractingText
    case 7: // GeneratingMarkdown
      return 'processing';
    case 2: // ExtractingAudioSuccess
    case 5: // ExtractingTextSuccess
    case 8: // GeneratingMarkdownSuccess
      return 'completed';
    case 3: // ExtractingAudioFailed
    case 6: // ExtractingTextFailed
    case 9: // GeneratingMarkdownFailed
      return 'error';
    default:
      return 'processing';
  }
}

function mapProgressToErrorStage(p: number): Task['errorStage'] {
  switch (p) {
    case 3: // ExtractingAudioFailed
      return 'ExtractingAudioFailed';
    case 6: // ExtractingTextFailed
      return 'ExtractingTextFailed';
    case 9: // GeneratingMarkdownFailed
      return 'GeneratingMarkdownFailed';
    default:
      return undefined;
  }
}

function mapProgressToPercent(p: number): number {
  switch (p) {
    case 0: // NotStarted
      return 0;
    case 1: // ExtractingAudio
      return 25;
    case 2: // ExtractingAudioSuccess
      return 30;
    case 3: // ExtractingAudioFailed
      return 0;
    case 4: // ExtractingText
      return 50;
    case 5: // ExtractingTextSuccess
      return 75;
    case 6: // ExtractingTextFailed
      return 0;
    case 7: // GeneratingMarkdown
      return 85;
    case 8: // GeneratingMarkdownSuccess
      return 100;
    case 9: // GeneratingMarkdownFailed (如果存在)
      return 0;
    default:
      return 0;
  }
}

// 将英文格式名称映射为中文
function mapFormatToChinese(format: string): string {
  const formatMap: { [key: string]: string } = {
    'note': '知识笔记',
    'xiaohongshu': '小红书',
    'wechat': '公众号',
    'summary': '内容总结'
  };
  return formatMap[format] || format;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const applyBackendTasks = useCallback((resp: BackendResponse) => {
    if (!resp || !resp.success || !Array.isArray(resp.data)) {
      console.log('任务列表更新失败或数据无效');
      return [];
    }

    console.log('收到任务列表更新，任务数量:', resp.data.length);

    const mapped: Task[] = resp.data.map((t) => ({
      id: String(t.id),
      fileName: t.file_path ? t.file_path.split(/[/\\]/).pop() || t.file_path : 'Unknown',
      status: mapProgressToStatus(t.progress),
      progress: mapProgressToPercent(t.progress),
      formats: t.style ? [mapFormatToChinese(t.style)] : [],
      timestamp: new Date(t.created_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      markdownContent: t.markdown_content,
      transcriptionText: t.transcription_text ? t.transcription_text : [],
      errorStage: mapProgressToErrorStage(t.progress),
    }));

    console.log('更新任务列表，新任务数量:', mapped.length);
    setTasks(mapped);
    return mapped;
  }, []);

  useEffect(() => {
    // 初始化时获取任务列表
    GetTaskList()
      .then((resp: BackendResponse) => {
        applyBackendTasks(resp);
      })
      .catch(() => {
        // 获取失败时保持空列表
      });

    // 监听后端任务更新事件（从 WailsEvent.data 中取出后端响应）
    const off = Events.On('task_update', (event: any) => {
      // 任务更新时重新获取任务列表
      GetTaskList()
        .then((resp: BackendResponse) => {
          applyBackendTasks(resp);
        })
        .catch(() => {
          // 获取失败时保持当前列表
        });
    });

    return () => {
      if (typeof off === 'function') {
        off();
      }
    };
  }, [applyBackendTasks]);

  const addTask = useCallback((fileName: string, formats: string[]) => {
    const newTask: Task = {
      id: Date.now().toString(),
      fileName,
      status: 'pending',
      progress: 0,
      formats: formats.map(format => mapFormatToChinese(format)),
      timestamp: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const getStatusColor = useCallback((status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }, []);

  const getStatusText = useCallback((status: Task['status'], errorStage?: Task['errorStage']) => {
    // 任务列表只显示"失败"，详情页面才显示具体失败阶段
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '处理中';
      case 'error': return '失败';
      default: return '等待中';
    }
  }, []);

  const getErrorStageText = useCallback((errorStage?: Task['errorStage']) => {
    if (!errorStage) return '';

    switch (errorStage) {
      case 'ExtractingAudioFailed': return '提取音频失败';
      case 'ExtractingTextFailed': return '提取文本失败';
      case 'GeneratingMarkdownFailed': return '生成Markdown失败';
      default: return '';
    }
  }, []);

  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  const refreshTasks = useCallback(() => {
    return GetTaskList()
      .then((resp: BackendResponse) => {
        return applyBackendTasks(resp);
      })
      .catch((error) => {
        console.log('刷新任务列表失败:', error);
        // 获取失败时保持当前列表
        throw error; // 重新抛出错误以便调用者可以处理
      });
  }, [applyBackendTasks]);

  return {
    tasks,
    addTask,
    getStatusColor,
    getStatusText,
    getTaskById,
    refreshTasks
  };
}