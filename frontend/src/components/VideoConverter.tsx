import React, { useState, useEffect } from 'react';
import { SettingsDialog } from './SettingsDialog';
import { Toaster } from './ui/sonner';
import { MenuBar } from './MenuBar';
import { Sidebar } from './Sidebar';
import { UploadSection } from './UploadSection';
import { FormatSelection } from './FormatSelection';
import { ProgressSection } from './ProgressSection';
import { ActionButtons } from './ActionButtons';
import { LogPanel } from './LogPanel';
import { ContentDisplay } from './ContentDisplay';
import { ErrorPrompt } from './ui/ErrorPrompt';

// Hooks
import { useFileUpload } from '../hooks/useFileUpload';
import { useOutputFormats } from '../hooks/useOutputFormats';
import { useConversion } from '../hooks/useConversion';
import { useLog } from '../hooks/useLog';
import { useTasks } from '../hooks/useTasks';

export function VideoConverter() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUploadInterface, setShowUploadInterface] = useState(true); // 控制是否显示上传界面
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // 选中的任务

  // Custom hooks
  const { logs, addLog, clearLogs, getLogColor } = useLog();
  const { selectedFile, dragActive, handleDrag, handleDrop, handleFileSelect, resetFile } = useFileUpload(addLog);
  const { outputFormats, toggleFormat, getSelectedFormats, getSelectedFormatsCount } = useOutputFormats();
  const { conversionStatus, progress, startConversion, reset: resetConversion, downloadFile } = useConversion(addLog);
  const { tasks, addTask, getStatusColor, getStatusText, getTaskById, refreshTasks } = useTasks();

  // 监听转换状态变化
  useEffect(() => {
    if (conversionStatus === 'completed') {
      setShowUploadInterface(false); // 转换完成后隐藏上传界面
    }
  }, [conversionStatus]);

  const handleStartConversion = () => {
    const selectedFormats = getSelectedFormats();
    if (selectedFile && selectedFormats.length > 0) {
      setShowUploadInterface(true); // 确保显示上传界面
      startConversion(selectedFile, selectedFormats);

      // 简单直接的方法：等待一段时间后选择最新任务
      setTimeout(() => {
        // 给后端足够时间创建任务并发送事件
        console.log('开始查找最新任务，当前任务数量:', tasks.length);
        if (tasks.length > 0) {
          // 选择最新的任务（数组第一个）
          const latestTask = tasks[0];
          console.log('聚焦到任务:', latestTask.fileName, '状态:', latestTask.status);
          setSelectedTask(latestTask);
          setShowUploadInterface(false);
        } else {
          console.log('没有找到任务，可能创建失败');
        }
      }, 1500); // 1.5秒延迟，确保任务创建完成
    }
  };

  const handleReset = () => {
    resetFile();
    resetConversion();
    setShowUploadInterface(true); // 重置时显示上传界面
  };

  // 解析字幕文本
  const parseSubtitles = (transcriptionText?: string | any[]) => {
    if (!transcriptionText) return [];

    try {
      let parsed;

      // 如果已经是对象/数组，直接使用
      if (typeof transcriptionText === 'object') {
        parsed = transcriptionText;
      } else {
        // 如果是字符串，尝试解析 JSON
        parsed = JSON.parse(transcriptionText);
      }

      // 处理数组格式的字幕
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          start_time: item.start_time !== undefined ? item.start_time : (item.start || 0) * 1000,
          text: item.text || ''
        }));
      }

      // 处理单个对象格式的字幕
      if (typeof parsed === 'object' && parsed !== null) {
        // 如果是单个字幕对象，包装成数组
        if (parsed.text) {
          return [{
            start_time: parsed.start_time !== undefined ? parsed.start_time : (parsed.start || 0) * 1000,
            text: parsed.text
          }];
        }
      }

      return [];
    } catch (error) {
      console.error('Failed to parse subtitles:', error, 'Raw data:', transcriptionText);
      return [];
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 pb-2 border-b border-gray-300 overflow-hidden">
      <MenuBar onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          tasks={tasks}
          selectedTaskId={selectedTask?.id}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          onNewTask={() => {
            setShowUploadInterface(true);
            setSelectedTask(null);
            resetConversion();
            resetFile();
          }}
          onTaskSelect={(task) => {
            setSelectedTask(task);
            setShowUploadInterface(false);
          }}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className={`flex-1 p-6 flex flex-col ${showUploadInterface ? 'overflow-y-auto' : 'overflow-hidden min-h-0'}`}>
            <div className={`mx-auto w-full ${showUploadInterface ? 'max-w-4xl space-y-6' : 'max-w-7xl flex-1 flex flex-col min-h-0'}`}>
              {/* 根据状态显示不同界面 */}
              {selectedTask ? (
                // 显示选中任务的内容
                selectedTask.status === 'GeneratingStyleSuccess' ? (
                  <ContentDisplay
                    imageTextContent={selectedTask.markdownContent}
                    subtitles={parseSubtitles(selectedTask.transcriptionText)}
                  />
                ) : selectedTask.status === 'GeneratingStyleFailed' ? (
                  <ErrorPrompt
                    task={selectedTask}
                    onRetry={() => {
                      // TODO: 实现重试逻辑
                      console.log('Retry task:', selectedTask.id);
                    }}
                    onBack={() => {
                      setSelectedTask(null);
                      setShowUploadInterface(true);
                    }}
                  />
                ) : (
                  // 其他状态显示进度页面
                  <ProgressSection
                    conversionStatus="converting"
                    progress={selectedTask.progress}
                  />
                )
              ) : showUploadInterface ? (
                // 显示上传界面
                <>
                  <UploadSection
                    selectedFile={selectedFile}
                    dragActive={dragActive}
                    conversionStatus={conversionStatus}
                    onDrag={handleDrag}
                    onDrop={handleDrop}
                    onFileSelect={handleFileSelect}
                    onReset={handleReset}
                  />

                  <FormatSelection
                    outputFormats={outputFormats}
                    onToggleFormat={toggleFormat}
                  />

                  <ProgressSection
                    conversionStatus={conversionStatus}
                    progress={progress}
                  />

                  <ActionButtons
                    conversionStatus={conversionStatus}
                    selectedFile={selectedFile}
                    onStartConversion={handleStartConversion}
                    onDownload={downloadFile}
                    onReset={handleReset}
                  />
                </>
              ) : (
                <ContentDisplay />
              )}
            </div>
          </div>

          <LogPanel
            logs={logs}
            onClearLogs={clearLogs}
            getLogColor={getLogColor}
          />
        </div>
      </div>

      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toaster />
    </div>
  );
}