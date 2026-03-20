import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/Button';
import { ConversionStatus } from '../types';

interface ActionButtonsProps {
  conversionStatus: ConversionStatus;
  selectedFile: File | null;
  onStartConversion: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export function ActionButtons({
  conversionStatus,
  selectedFile,
  onStartConversion,
  onDownload,
  onReset
}: ActionButtonsProps) {
  if (conversionStatus === 'completed') {
    return (
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onDownload}
          className="flex-1 h-11"
        >
          <Download className="w-4 h-4 mr-2" strokeWidth={2} />
          下载文件
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={onReset}
          className="h-11"
        >
          重置
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={onStartConversion}
      disabled={!selectedFile || conversionStatus === 'converting'}
      className="w-full h-11"
    >
      {conversionStatus === 'converting' ? '转换中...' : '开始转换'}
    </Button>
  );
}