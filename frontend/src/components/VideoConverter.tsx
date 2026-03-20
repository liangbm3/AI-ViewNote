import React, { useState } from 'react';
import { SettingsDialog } from './SettingsDialog';
import { Toaster } from './ui/sonner';
import { MenuBar } from './MenuBar';
import { Sidebar } from './Sidebar';
import { UploadSection } from './UploadSection';
import { FormatSelection } from './FormatSelection';
import { ProgressSection } from './ProgressSection';
import { ActionButtons } from './ActionButtons';
import { LogPanel } from './LogPanel';

// Hooks
import { useFileUpload } from '../hooks/useFileUpload';
import { useOutputFormats } from '../hooks/useOutputFormats';
import { useConversion } from '../hooks/useConversion';
import { useLog } from '../hooks/useLog';
import { useTasks } from '../hooks/useTasks';

export function VideoConverter() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Custom hooks
  const { logs, addLog, clearLogs, getLogColor } = useLog();
  const { selectedFile, dragActive, handleDrag, handleDrop, handleFileSelect, resetFile } = useFileUpload(addLog);
  const { outputFormats, toggleFormat, getSelectedFormats, getSelectedFormatsCount } = useOutputFormats();
  const { conversionStatus, progress, startConversion, reset: resetConversion, downloadFile } = useConversion(addLog);
  const { tasks, addTask, getStatusColor, getStatusText } = useTasks();

  const handleStartConversion = () => {
    const selectedFormats = getSelectedFormats();
    if (selectedFile && selectedFormats.length > 0) {
      startConversion(selectedFile, selectedFormats);
      // Add to task list when conversion completes
      setTimeout(() => {
        addTask(selectedFile.name, selectedFormats.map(f => f.extension.toUpperCase()));
      }, 100);
    }
  };

  const handleReset = () => {
    resetFile();
    resetConversion();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <MenuBar onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          tasks={tasks}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
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