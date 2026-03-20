import { useState, useCallback } from 'react';
import { OutputFormat } from '../types';

const defaultFormats: OutputFormat[] = [
  { id: 'knowledge', name: '知识笔记', extension: 'md', description: '结构化的知识总结', selected: true },
  { id: 'xiaohongshu', name: '小红书', extension: 'md', description: '小红书风格内容', selected: false },
  { id: 'mp', name: '公众号', extension: 'md', description: '微信公众号文章', selected: false },
  { id: 'summary', name: '内容总结', extension: 'md', description: '简洁的内容摘要', selected: false },
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