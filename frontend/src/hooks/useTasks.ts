import { useState, useCallback } from 'react';
import { Task } from '../types';

const defaultTasks: Task[] = [
  {
    id: '1',
    fileName: 'demo_video.mp4',
    status: 'completed',
    progress: 100,
    formats: ['SRT', 'TXT', 'PDF'],
    timestamp: '14:32'
  },
  {
    id: '2',
    fileName: 'presentation.mov',
    status: 'processing',
    progress: 67,
    formats: ['PDF', 'DOCX'],
    timestamp: '14:45'
  }
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);

  const addTask = useCallback((fileName: string, formats: string[]) => {
    const newTask: Task = {
      id: Date.now().toString(),
      fileName,
      status: 'completed',
      progress: 100,
      formats,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
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

  const getStatusText = useCallback((status: Task['status']) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '处理中';
      case 'error': return '错误';
      default: return '等待中';
    }
  }, []);

  return {
    tasks,
    addTask,
    getStatusColor,
    getStatusText
  };
}