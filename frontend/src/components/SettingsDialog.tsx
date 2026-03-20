import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Folder,
  Globe,
  Bell,
  Sparkles,
  Database,
  Palette,
  Download,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { SettingsDialogProps, SettingsCategory, Language, QualityOption } from '../types';

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');

  // General Settings
  const [language, setLanguage] = useState('zh-CN');
  const [autoStart, setAutoStart] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Output Settings
  const [outputPath, setOutputPath] = useState('/用户/文档/视频转换');
  const [quality, setQuality] = useState('high');
  const [autoOpen, setAutoOpen] = useState(true);
  const [keepOriginal, setKeepOriginal] = useState(true);

  // Advanced Settings
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [multiThreading, setMultiThreading] = useState(true);
  const [cacheSize, setCacheSize] = useState('1024');
  const [autoUpdate, setAutoUpdate] = useState(true);

  const categories = [
    { id: 'general' as const, name: '通用', icon: Globe },
    { id: 'output' as const, name: '输出设置', icon: Download },
    { id: 'advanced' as const, name: '高级', icon: Sparkles },
    { id: 'about' as const, name: '关于', icon: Database },
  ];

  const languages: Language[] = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' },
    { value: 'ja-JP', label: '日本語' },
  ];

  const qualityOptions: QualityOption[] = [
    { value: 'low', label: '低', description: '快速处理，文件较小' },
    { value: 'medium', label: '中', description: '平衡质量与速度' },
    { value: 'high', label: '高', description: '最佳质量，处理较慢' },
  ];

  const handleSave = () => {
    toast.success('设置已保存');
    onClose();
  };

  const handleReset = () => {
    setLanguage('zh-CN');
    setAutoStart(false);
    setNotifications(true);
    setQuality('high');
    setAutoOpen(true);
    setKeepOriginal(true);
    setHardwareAcceleration(true);
    setMultiThreading(true);
    setCacheSize('1024');
    setAutoUpdate(true);
    toast.success('已恢复默认设置');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl h-[600px] bg-white rounded-2xl shadow-2xl flex overflow-hidden"
            >
              {/* Sidebar */}
              <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">设置</h2>
                  <p className="text-sm text-gray-500 mt-1">管理应用程序偏好</p>
                </div>

                <nav className="flex-1 space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                          ${activeCategory === category.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                        <span className="font-medium">{category.name}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                  版本 1.0.0
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {categories.find(c => c.id === activeCategory)?.name}
                  </h3>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeCategory === 'general' && (
                    <div className="space-y-6">
                      {/* Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          语言
                        </label>
                        <div className="space-y-2">
                          {languages.map((lang) => (
                            <button
                              key={lang.value}
                              onClick={() => setLanguage(lang.value)}
                              className={`
                                w-full px-4 py-3 rounded-lg border text-left transition-all flex items-center justify-between
                                ${language === lang.value
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                              `}
                            >
                              <span className="text-sm text-gray-900">{lang.label}</span>
                              <div className={`
                                w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                ${language === lang.value
                                  ? 'border-gray-900 bg-gray-900'
                                  : 'border-gray-300'
                                }
                              `}>
                                {language === lang.value && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggle Settings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">开机自动启动</div>
                            <div className="text-xs text-gray-500 mt-0.5">启动系统时自动打开应用</div>
                          </div>
                          <button
                            onClick={() => setAutoStart(!autoStart)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${autoStart ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${autoStart ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">桌面通知</div>
                            <div className="text-xs text-gray-500 mt-0.5">转换完成时显示通知</div>
                          </div>
                          <button
                            onClick={() => setNotifications(!notifications)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${notifications ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${notifications ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'output' && (
                    <div className="space-y-6">
                      {/* Output Path */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          输出路径
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={outputPath}
                            onChange={(e) => setOutputPath(e.target.value)}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                            placeholder="/用户/文档/视频转换"
                          />
                          <button className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <Folder className="w-4 h-4" strokeWidth={1.5} />
                            浏览
                          </button>
                        </div>
                      </div>

                      {/* Quality */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          输出质量
                        </label>
                        <div className="space-y-2">
                          {qualityOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setQuality(option.value)}
                              className={`
                                w-full px-4 py-3 rounded-lg border text-left transition-all
                                ${quality === option.value
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                              `}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 mb-0.5">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {option.description}
                                  </div>
                                </div>
                                <div className={`
                                  w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5
                                  ${quality === option.value
                                    ? 'border-gray-900 bg-gray-900'
                                    : 'border-gray-300'
                                  }
                                `}>
                                  {quality === option.value && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggle Settings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">转换完成后自动打开</div>
                            <div className="text-xs text-gray-500 mt-0.5">转换完成时自动打开文件</div>
                          </div>
                          <button
                            onClick={() => setAutoOpen(!autoOpen)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${autoOpen ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${autoOpen ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">保留原始文件</div>
                            <div className="text-xs text-gray-500 mt-0.5">转换后不删除源视频文件</div>
                          </div>
                          <button
                            onClick={() => setKeepOriginal(!keepOriginal)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${keepOriginal ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${keepOriginal ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'advanced' && (
                    <div className="space-y-6">
                      {/* Performance Settings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">硬件加速</div>
                            <div className="text-xs text-gray-500 mt-0.5">使用 GPU 加速处理（如果可用）</div>
                          </div>
                          <button
                            onClick={() => setHardwareAcceleration(!hardwareAcceleration)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${hardwareAcceleration ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${hardwareAcceleration ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">多线程处理</div>
                            <div className="text-xs text-gray-500 mt-0.5">同时处理多个任务以提高效率</div>
                          </div>
                          <button
                            onClick={() => setMultiThreading(!multiThreading)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${multiThreading ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${multiThreading ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">自动更新</div>
                            <div className="text-xs text-gray-500 mt-0.5">自动检查并安装更新</div>
                          </div>
                          <button
                            onClick={() => setAutoUpdate(!autoUpdate)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${autoUpdate ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${autoUpdate ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>
                      </div>

                      {/* Cache Size */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          缓存大小 (MB)
                        </label>
                        <input
                          type="number"
                          value={cacheSize}
                          onChange={(e) => setCacheSize(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                          placeholder="1024"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          建议设置为 512-2048 MB 之间
                        </p>
                      </div>

                      {/* Clear Cache Button */}
                      <button
                        onClick={() => toast.success('缓存已清除')}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        清除缓存
                      </button>
                    </div>
                  )}

                  {activeCategory === 'about' && (
                    <div className="space-y-6">
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-10 h-10 text-white" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">视频转文档</h3>
                        <p className="text-gray-500 mb-1">版本 1.0.0</p>
                        <p className="text-sm text-gray-400">简单、快速、高效的视频转换工具</p>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-gray-200">
                        <button className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <span>检查更新</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        </button>
                        <button className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <span>用户协议</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        </button>
                        <button className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <span>隐私政策</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-200">
                        © 2026 视频转文档. All rights reserved.
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="h-16 px-6 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    恢复默认设置
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      保存设置
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}