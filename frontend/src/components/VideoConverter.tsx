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

  // Custom hooks
  const { logs, addLog, clearLogs, getLogColor } = useLog();
  const { selectedFile, dragActive, handleDrag, handleDrop, handleFileSelect, resetFile } = useFileUpload(addLog);
  const { outputFormats, toggleFormat, getSelectedFormats, getSelectedFormatsCount } = useOutputFormats();
  const { conversionStatus, progress, startConversion, reset: resetConversion, downloadFile } = useConversion(addLog);
  const { tasks, addTask, getStatusColor, getStatusText } = useTasks();

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
    }
  };

  const handleReset = () => {
    resetFile();
    resetConversion();
    setShowUploadInterface(true); // 重置时显示上传界面
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 pb-2 border-b border-gray-300 overflow-hidden">
      <MenuBar onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          tasks={tasks}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          onNewTask={() => {
            setShowUploadInterface(true);
            resetConversion();
            resetFile();
          }}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className={`flex-1 p-6 flex flex-col ${showUploadInterface ? 'overflow-y-auto' : 'overflow-hidden min-h-0'}`}>
            <div className={`mx-auto w-full ${showUploadInterface ? 'max-w-4xl space-y-6' : 'max-w-7xl flex-1 flex flex-col min-h-0'}`}>
              {/* 根据状态显示不同界面 */}
              {showUploadInterface ? (
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