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
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return parseInt(localStorage.getItem('sidebarWidth') || '280', 10);
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUploadInterface, setShowUploadInterface] = useState(true); // 控制是否显示上传界面
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // 选中的任务

  // Custom hooks
  const { logs, addLog, clearLogs, getLogColor } = useLog();
  const { selectedFile, dragActive, handleDrag, handleDrop, handleFileSelect, resetFile } = useFileUpload(addLog);
  const { outputFormats, toggleFormat, getSelectedFormats, getSelectedFormatsCount } = useOutputFormats();
  const { conversionStatus, progress, startConversion, reset: resetConversion } = useConversion(addLog);
  const { tasks, addTask, getStatusColor, getStatusText, getTaskById, refreshTasks } = useTasks();

  // 监听任务列表的变化，如果当前正在展示某个选中的任务（比如进行中），那么要在 tasks 发生变化时同步更新它
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask && (updatedTask.status !== selectedTask.status || updatedTask.progress !== selectedTask.progress)) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask]);

  const handleStartConversion = async () => {
    const selectedFormats = getSelectedFormats();
    if (selectedFile && selectedFormats.length > 0) {
      // 显示上传界面，表示正在处理
      setShowUploadInterface(true);
      setSelectedTask(null); // 清除之前的选中任务

      // 调用转换并等待结果
      const taskData = await startConversion(selectedFile, selectedFormats);

      if (taskData) {
        console.log('任务创建成功，任务数据:', taskData);

        // 使用返回的任务数据直接设置焦点，而不是依赖tasks数组的顺序
        if (taskData.id) {
          // 先刷新任务列表获取最新数据
          console.log('刷新任务列表...');
          const updatedTasks = await refreshTasks() || [];

          // 尝试从刷新后的任务列表中找到匹配的任务
          const matchedTask = updatedTasks.find(task => task.id === String(taskData.id));
          if (matchedTask) {
            console.log('聚焦到任务:', matchedTask.fileName, '状态:', matchedTask.status);
            setSelectedTask(matchedTask);
            setShowUploadInterface(false); // 跳转到进度页面
          } else {
            // 如果没有找到匹配的任务，等待一小段时间让任务列表更新
            setTimeout(async () => {
              // 再次刷新任务列表
              const nextTasks = await refreshTasks() || [];
              const updatedTask = nextTasks.find(task => task.id === String(taskData.id));
              if (updatedTask) {
                console.log('延迟聚焦到任务:', updatedTask.fileName, '状态:', updatedTask.status);
                setSelectedTask(updatedTask);
                setShowUploadInterface(false);
              } else {
                console.log('任务列表中未找到新创建的任务，ID:', taskData.id);
                // 如果仍然找不到，回退到选择第一个任务（最新任务）
                if (nextTasks.length > 0) {
                  console.log('回退到选择最新任务:', nextTasks[0].fileName);
                  setSelectedTask(nextTasks[0]);
                  setShowUploadInterface(false);
                }
              }
            }, 1000); // 给任务列表更新留出更多时间
          }
        }
      }
    }
  };

  const handleReset = () => {
    resetFile();
    resetConversion();
    setShowUploadInterface(true); // 重置时显示上传界面
  };

  // 解析字幕文本
  const parseSubtitles = (transcriptionText?: Utterance[]) => {
    if (!transcriptionText || !Array.isArray(transcriptionText)) return [];

    try {
      // 转换后端返回的Utterance数组为前端需要的格式
      return transcriptionText.map(item => ({
        start_time: item.start_time || 0,
        text: item.text || ''
      }));
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
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
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
                selectedTask.status === 'completed' ? (
                  <ContentDisplay
                    imageTextContent={selectedTask.markdownContent}
                    subtitles={parseSubtitles(selectedTask.transcriptionText)}
                  />
                ) : selectedTask.status === 'error' ? (
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
                    selectedTask={selectedTask}
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
                    selectedTask={selectedTask}
                  />

                  <ActionButtons
                    conversionStatus={conversionStatus}
                    selectedFile={selectedFile}
                    onStartConversion={handleStartConversion}
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