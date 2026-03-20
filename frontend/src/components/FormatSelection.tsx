import React from 'react';
import { OutputFormat } from '../types';

interface FormatSelectionProps {
  outputFormats: OutputFormat[];
  onToggleFormat: (id: string) => void;
}

export function FormatSelection({ outputFormats, onToggleFormat }: FormatSelectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">输出风格</h2>
        <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">
          单选
        </span>
      </div>

      <div className="p-6 grid grid-cols-2 gap-3">
        {outputFormats.map((format) => (
          <button
            key={format.id}
            onClick={() => onToggleFormat(format.id)}
            className={`
              px-4 py-3 rounded-lg border text-left transition-all
              ${format.selected
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-medium text-gray-900 text-sm">{format.name}</span>
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5
                ${format.selected
                  ? 'border-gray-900 bg-gray-900'
                  : 'border-gray-300'
                }
              `}>
                {format.selected && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">{format.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}