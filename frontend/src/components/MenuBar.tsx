import { Settings, HelpCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface MenuBarProps {
  onOpenSettings: () => void;
}

export function MenuBar({ onOpenSettings }: MenuBarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-6">
      <div className="flex items-center gap-2">
        <img src="/appicon.png" alt="AI ViewNote" className="w-8 h-8 object-contain shrink-0" />
        <span className="font-semibold text-gray-900">视频转文档</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
        </button>
        <button className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors">
          <HelpCircle className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}