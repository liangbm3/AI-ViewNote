import React from 'react';
import { Button } from './ui/Button';
import { ConversionStatus, SelectedVideoFile } from '../types';

interface ActionButtonsProps {
  conversionStatus: ConversionStatus;
  selectedFile: SelectedVideoFile | null;
  onStartConversion: () => void;
  onReset: () => void;
}

export function ActionButtons({
  conversionStatus,
  selectedFile,
  onStartConversion,
  onReset
}: ActionButtonsProps) {
  if (conversionStatus === 'completed') {
    return (
      <Button
        variant="secondary"
        size="lg"
        onClick={onReset}
        className="w-full h-11"
      >
        重置
      </Button>
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