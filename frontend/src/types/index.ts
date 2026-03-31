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
  markdownContent?: string;
  transcriptionText?: Utterance[];
  errorStage?: 'ExtractingAudioFailed' | 'ExtractingTextFailed' | 'GeneratingMarkdownFailed' | 'InterruptedFailed';
};

export type Utterance = {
  start_time: number;
  end_time: number;
  text: string;
};

export type SelectedVideoFile = {
  name: string;
  size: number;
  path: string;
};

export type LogEntry = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
};

export type ConversionStatus = 'idle' | 'converting' | 'completed';

export type SettingsCategory = 'general' | 'service' | 'prompts' | 'advanced' | 'about';

export type PromptProfile = {
  style: string;
  label: string;
  description: string;
  key: string;
  default_prompt: string;
  custom_prompt: string;
  effective_prompt: string;
};

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

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

export type QuickPrompt = {
  title: string;
  message: string;
};