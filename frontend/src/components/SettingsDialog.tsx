import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  Sparkles,
  Database,
  Palette,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { SettingsDialogProps, SettingsCategory } from '../types';
import { SaveConfig, GetConfig } from '../../bindings/AI-ViewNote/backend/service/configservice';
import { Browser } from '@wailsio/runtime';
import packageJson from '../../package.json';

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');

  // 如果当前选中的是高级设置或通用设置，自动切换到服务设置
  useEffect(() => {
    if (activeCategory === 'advanced') {
      setActiveCategory('service');
    }
  }, [activeCategory]);

  // General Settings
  const [runInBackground, setRunInBackground] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [logFolding, setLogFolding] = useState(true);

  // Service Settings
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmModelId, setLlmModelId] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [asrAppId, setAsrAppId] = useState('');
  const [asrAccessToken, setAsrAccessToken] = useState('');
  const [asrClusterId, setAsrClusterId] = useState('');
  const [ossEndpoint, setOssEndpoint] = useState('');
  const [ossBucket, setOssBucket] = useState('');
  const [ossRegion, setOssRegion] = useState('');
  const [ossAccessKey, setOssAccessKey] = useState('');
  const [ossSecretKey, setOssSecretKey] = useState('');

  // Advanced Settings
  const [smartScreenshot, setSmartScreenshot] = useState(true);
  const [cacheSize, setCacheSize] = useState('1024');
  const [autoUpdate, setAutoUpdate] = useState(true);

  // Load settings from backend when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveCategory('general');
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      // 分别加载每个配置项
      const loadConfig = async (key: string, defaultValue: any = '') => {
        try {
          const response = await GetConfig(key);
          if (response.success && response.data && response.data.value) {
            return response.data.value;
          }
        } catch (error) {
          console.warn(`Failed to load config ${key}:`, error);
        }
        return defaultValue;
      };

      // 加载各个配置项
      setRunInBackground(await loadConfig('RunInBackground', 'false') === 'true');
      setNotifications(await loadConfig('DesktopNotifications', 'false') === 'true');
      setLogFolding(await loadConfig('LogFolding', 'true') === 'true');
      setLlmBaseUrl(await loadConfig('LlmBaseURL', ''));
      setLlmModelId(await loadConfig('LlmModelID', ''));
      setLlmApiKey(await loadConfig('LlmApiKey', ''));
      setAsrAppId(await loadConfig('AucAppID', ''));
      setAsrAccessToken(await loadConfig('AucAccessToken', ''));
      setAsrClusterId(await loadConfig('AucClusterID', ''));
      setOssEndpoint(await loadConfig('StorageEndpoint', ''));
      setOssBucket(await loadConfig('StorageBucket', ''));
      setOssRegion(await loadConfig('StorageRegion', ''));
      setOssAccessKey(await loadConfig('StorageAccessKey', ''));
      setOssSecretKey(await loadConfig('StorageSecretKey', ''));

      // 对于高级设置，使用默认值（后端可能没有这些配置项）
      setSmartScreenshot(true);
      setCacheSize('1024');
      setAutoUpdate(true);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('加载设置失败');
    }
  };

  const categories = [
    { id: 'general' as const, name: '通用', icon: Globe },
    { id: 'service' as const, name: '服务', icon: Database },
    { id: 'advanced' as const, name: '高级', icon: Sparkles },
    { id: 'about' as const, name: '关于', icon: Palette },
  ];

  
  const handleSave = async () => {
    try {
      // 分别保存每个配置项到后端
      const saveOperations = [
        { key: 'RunInBackground', value: runInBackground ? 'true' : 'false' },
        { key: 'DesktopNotifications', value: notifications ? 'true' : 'false' },
        { key: 'LogFolding', value: logFolding ? 'true' : 'false' },
        { key: 'LlmBaseURL', value: llmBaseUrl },
        { key: 'LlmModelID', value: llmModelId },
        { key: 'LlmApiKey', value: llmApiKey },
        { key: 'AucAppID', value: asrAppId },
        { key: 'AucAccessToken', value: asrAccessToken },
        { key: 'AucClusterID', value: asrClusterId },
        { key: 'StorageEndpoint', value: ossEndpoint },
        { key: 'StorageBucket', value: ossBucket },
        { key: 'StorageRegion', value: ossRegion },
        { key: 'StorageAccessKey', value: ossAccessKey },
        { key: 'StorageSecretKey', value: ossSecretKey }
      ];

      // 执行所有保存操作
      const results = await Promise.allSettled(
        saveOperations.map(({ key, value }) => SaveConfig(key, value))
      );

      // 检查是否有失败的保存操作
      const failedCount = results.filter(result => result.status === 'rejected').length;

      if (failedCount === 0) {
        toast.success('设置已保存');
        onClose();
      } else {
        toast.error(`保存设置失败: ${failedCount} 个配置项保存失败`);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('保存设置失败');
    }
  };

  const handleReset = () => {
    setRunInBackground(false);
    setNotifications(false);
    setLogFolding(true);
    setLlmBaseUrl('');
    setLlmModelId('');
    setLlmApiKey('');
    setAsrAppId('');
    setAsrAccessToken('');
    setAsrClusterId('');
    setOssEndpoint('');
    setOssBucket('');
    setOssRegion('');
    setOssAccessKey('');
    setOssSecretKey('');
    setSmartScreenshot(true);
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
                  {categories.filter(cat => cat.id !== 'advanced').map((category) => {
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
                  版本 {packageJson.version}
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
                      {/* Close Action */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          关闭选项
                        </label>
                        <div className="space-y-2">
                          <button
                            onClick={() => setRunInBackground(true)}
                            className={`
                              w-full px-4 py-3 rounded-lg border text-left transition-all flex items-center justify-between
                              ${runInBackground
                                ? 'border-gray-900 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <span className="text-sm text-gray-900">在后台运行</span>
                            <div className={`
                              w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                              ${runInBackground
                                ? 'border-gray-900 bg-gray-900'
                                : 'border-gray-300'
                              }
                            `}>
                              {runInBackground && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => setRunInBackground(false)}
                            className={`
                              w-full px-4 py-3 rounded-lg border text-left transition-all flex items-center justify-between
                              ${!runInBackground
                                ? 'border-gray-900 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <span className="text-sm text-gray-900">关闭程序</span>
                            <div className={`
                              w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                              ${!runInBackground
                                ? 'border-gray-900 bg-gray-900'
                                : 'border-gray-300'
                              }
                            `}>
                              {!runInBackground && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Toggle Settings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">日志默认折叠</div>
                            <div className="text-xs text-gray-500 mt-0.5">打开应用时日志栏默认折叠</div>
                          </div>
                          <button
                            onClick={() => setLogFolding(!logFolding)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${logFolding ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${logFolding ? 'translate-x-6' : 'translate-x-1'}
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

                  {activeCategory === 'service' && (
                    <div className="space-y-8">
                      {/* LLM Service */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">LLM 服务</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Base URL</label>
                            <input
                              type="text"
                              value={llmBaseUrl}
                              onChange={(e) => setLlmBaseUrl(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="例如: https://api.openai.com/v1"
                            />
                          </div>
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Model ID</label>
                            <input
                              type="text"
                              value={llmModelId}
                              onChange={(e) => setLlmModelId(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="例如: gpt-4o"
                            />
                          </div>
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">API Key</label>
                            <input
                              type="password"
                              value={llmApiKey}
                              onChange={(e) => setLlmApiKey(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="输入你的 API Key"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ASR Service */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">ASR 服务</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">App ID</label>
                            <input
                              type="text"
                              value={asrAppId}
                              onChange={(e) => setAsrAppId(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="输入 App ID"
                            />
                          </div>
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Access Token</label>
                            <input
                              type="password"
                              value={asrAccessToken}
                              onChange={(e) => setAsrAccessToken(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="输入 Access Token"
                            />
                          </div>
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Cluster ID</label>
                            <input
                              type="text"
                              value={asrClusterId}
                              onChange={(e) => setAsrClusterId(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="例如: volcano"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Object Storage Service */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">对象存储服务</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Endpoint</label>
                            <input
                              type="text"
                              value={ossEndpoint}
                              onChange={(e) => setOssEndpoint(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="例如: oss-cn-hangzhou.aliyuncs.com"
                            />
                          </div>
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Bucket</label>
                            <input
                              type="text"
                              value={ossBucket}
                              onChange={(e) => setOssBucket(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="例如: my-video-bucket"
                            />
                          </div>
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Region</label>
                            <input
                              type="text"
                              value={ossRegion}
                              onChange={(e) => setOssRegion(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="例如: cn-hangzhou"
                            />
                          </div>
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Access Key</label>
                            <input
                              type="text"
                              value={ossAccessKey}
                              onChange={(e) => setOssAccessKey(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="输入 Access Key"
                            />
                          </div>
                          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                            <label className="text-sm text-gray-600 font-medium text-right">Secret Key</label>
                            <input
                              type="password"
                              value={ossSecretKey}
                              onChange={(e) => setOssSecretKey(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 transition-colors"
                              placeholder="输入 Secret Key"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'advanced' && (
                    <div className="space-y-6">
                      {/* Smart Screenshot Toggle */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="text-sm font-medium text-gray-900">启用智能截图</div>
                            <div className="text-xs text-gray-500 mt-0.5">自动识别并截取关键画面</div>
                          </div>
                          <button
                            onClick={() => setSmartScreenshot(!smartScreenshot)}
                            className={`
                              w-11 h-6 rounded-full transition-colors relative
                              ${smartScreenshot ? 'bg-gray-900' : 'bg-gray-200'}
                            `}
                          >
                            <div className={`
                              w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                              ${smartScreenshot ? 'translate-x-6' : 'translate-x-1'}
                            `} />
                          </button>
                        </div>
                      </div>

                      {/* Auto Update Setting */}
                      <div className="space-y-4">
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
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <img
                            src="/appicon.png"
                            alt="AI-ViewNote"
                            className="w-20 h-20 object-contain"
                          />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-ViewNote</h3>
                        <p className="text-gray-500 mb-1">版本 {packageJson.version}</p>
                        <p className="text-sm text-gray-400">AI驱动的视频笔记工具</p>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-gray-200">
                        <button
                          onClick={() => Browser.OpenURL('https://github.com/liangbm3/AI-ViewNote/releases/')}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span>检查更新</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => Browser.OpenURL('https://github.com/liangbm3/AI-ViewNote/blob/main/TERMS.md')}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span>用户协议</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => Browser.OpenURL('https://github.com/liangbm3/AI-ViewNote/blob/main/PRIVACY.md')}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span>隐私政策</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-200">
                        © 2026 AI-ViewNote. All rights reserved.
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="h-16 px-6 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden"
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
