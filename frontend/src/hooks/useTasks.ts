import { useState, useCallback, useEffect } from 'react';
import { Task } from '../types';
import { GetTaskList } from '../../bindings/AI-ViewNote/backend/service/taskservice.js';
import { Events } from '@wailsio/runtime';

type BackendTaskRecord = {
  id: number;
  title: string;
  file_name: string;
  content_style: string;
  created_at: string;
  progress: number;
  markdown_content?: string;
  transcription_text?: string;
};

type BackendResponse = {
  success: boolean;
  message: string;
  data?: BackendTaskRecord[];
};

function mapProgressToStatus(p: number): Task['status'] {
  switch (p) {
    case 0:
      return 'pending';
    case 8:
      return 'GeneratingStyleSuccess';
    case 9:
      return 'GeneratingStyleFailed';
    case 4:
      return 'completed';
    case 5:
      return 'error';
    default:
      return 'processing';
  }
}

function mapProgressToPercent(p: number): number {
  switch (p) {
    case 0:
      return 0;
    case 1:
      return 25;
    case 2:
      return 50;
    case 3:
      return 75;
    case 4:
      return 100;
    case 5:
      return 0;
    default:
      return 0;
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const applyBackendTasks = useCallback((resp: BackendResponse) => {
    if (!resp || !resp.success || !Array.isArray(resp.data)) {
      console.log('任务列表更新失败或数据无效');
      return;
    }

    console.log('收到任务列表更新，任务数量:', resp.data.length);

    const mapped: Task[] = resp.data.map((t) => ({
      id: String(t.id),
      fileName: t.file_name,
      status: mapProgressToStatus(t.progress),
      progress: mapProgressToPercent(t.progress),
      formats: t.content_style ? [t.content_style] : [],
      timestamp: new Date(t.created_at).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      markdownContent: t.markdown_content,
      transcriptionText: t.transcription_text,
    }));

    console.log('更新任务列表，新任务数量:', mapped.length);
    setTasks(mapped);
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

    // 监听后端任务列表更新事件（从 WailsEvent.data 中取出后端响应）
    const off = Events.On('task_list_update', (event: any) => {
      applyBackendTasks(event?.data as BackendResponse);
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
      formats,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const getStatusColor = useCallback((status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'error': return 'bg-red-100 text-red-700';
      case 'GeneratingStyleSuccess': return 'bg-green-100 text-green-700';
      case 'GeneratingStyleFailed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }, []);

  const getStatusText = useCallback((status: Task['status']) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '处理中';
      case 'error': return '错误';
      case 'GeneratingStyleSuccess': return '已完成';
      case 'GeneratingStyleFailed': return '失败';
      default: return '等待中';
    }
  }, []);

  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  const refreshTasks = useCallback(() => {
    GetTaskList()
      .then((resp: BackendResponse) => {
        applyBackendTasks(resp);
      })
      .catch(() => {
        // 获取失败时保持当前列表
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