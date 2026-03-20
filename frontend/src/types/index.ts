export type OutputFormat = {
  id: string;
  name: string;
  extension: string;
  description: string;
  selected: boolean;
};

export type Task = {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  formats: string[];
  timestamp: string;
};

export type LogEntry = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
};

export type ConversionStatus = 'idle' | 'converting' | 'completed';

export type SettingsCategory = 'general' | 'output' | 'advanced' | 'about';

export type Language = {
  value: string;
  label: string;
};

export type QualityOption = {
  value: string;
  label: string;
  description: string;
};

export type SettingsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};