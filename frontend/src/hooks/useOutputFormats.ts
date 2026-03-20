import { useState, useCallback } from 'react';
import { OutputFormat } from '../types';

const defaultFormats: OutputFormat[] = [
  { id: 'srt', name: 'SRT 字幕', extension: 'srt', description: '标准字幕格式', selected: true },
  { id: 'vtt', name: 'VTT 字幕', extension: 'vtt', description: 'Web 字幕格式', selected: false },
  { id: 'txt', name: 'TXT 文本', extension: 'txt', description: '纯文本文件', selected: true },
  { id: 'docx', name: 'Word', extension: 'docx', description: 'Microsoft Word', selected: false },
  { id: 'pdf', name: 'PDF', extension: 'pdf', description: 'PDF 文档', selected: true },
  { id: 'md', name: 'Markdown', extension: 'md', description: '标记语言', selected: false },
];

export function useOutputFormats() {
  const [outputFormats, setOutputFormats] = useState<OutputFormat[]>(defaultFormats);

  const toggleFormat = useCallback((id: string) => {
    setOutputFormats(formats =>
      formats.map(format =>
        format.id === id
          ? { ...format, selected: true }
          : { ...format, selected: false }
      )
    );
  }, []);

  const getSelectedFormats = useCallback(() => {
    return outputFormats.filter(f => f.selected);
  }, [outputFormats]);

  const getSelectedFormatsCount = useCallback(() => {
    return outputFormats.filter(f => f.selected).length;
  }, [outputFormats]);

  return {
    outputFormats,
    toggleFormat,
    getSelectedFormats,
    getSelectedFormatsCount
  };
}