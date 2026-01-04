/**
 * Settings modal component - account preferences and configuration
 */

'use client';

import { useState } from 'react';
import { Modal } from '../Modal/Modal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Settings {
  language: string;
  notifications: {
    orderConfirmations: boolean;
    priceAlerts: boolean;
    fundingReminders: boolean;
  };
  display: {
    pricePrecision: number;
    sizePrecision: number;
    compactMode: boolean;
  };
  trading: {
    defaultLeverage: number;
    defaultOrderSize: string;
    confirmOrders: boolean;
    soundEffects: boolean;
  };
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({
    language: 'en',
    notifications: {
      orderConfirmations: true,
      priceAlerts: true,
      fundingReminders: true,
    },
    display: {
      pricePrecision: 2,
      sizePrecision: 4,
      compactMode: false,
    },
    trading: {
      defaultLeverage: 10,
      defaultOrderSize: '1.0',
      confirmOrders: true,
      soundEffects: false,
    },
  });

  // Update a primitive setting value (language)
  const updatePrimitiveSetting = <S extends 'language'>(
    section: S,
    value: Settings[S]
  ) => {
    setSettings(prev => ({ ...prev, [section]: value }));
  };

  // Update a nested setting value (notifications, display, trading)
  const updateNestedSetting = <S extends 'notifications' | 'display' | 'trading'>(
    section: S,
    key: keyof Settings[S],
    value: Settings[S][typeof key]
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage or API
    localStorage.setItem('liquidvex-settings', JSON.stringify(settings));
    onClose();
  };

  const handleReset = () => {
    setSettings({
      language: 'en',
      notifications: {
        orderConfirmations: true,
        priceAlerts: true,
        fundingReminders: true,
      },
      display: {
        pricePrecision: 2,
        sizePrecision: 4,
        compactMode: false,
      },
      trading: {
        defaultLeverage: 10,
        defaultOrderSize: '1.0',
        confirmOrders: true,
        soundEffects: false,
      },
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liquidvex-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
      } catch (error) {
        console.error('Failed to import settings:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Language & Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Appearance</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => updatePrimitiveSetting('language', e.target.value)}
                className="w-full p-2 bg-surface-elevated border border-border rounded text-text-primary"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="compact-mode"
              checked={settings.display.compactMode}
              onChange={(e) => updateNestedSetting('display', 'compactMode', e.target.checked)}
              className="w-4 h-4 text-accent bg-surface-elevated border-border rounded"
            />
            <label htmlFor="compact-mode" className="text-sm text-text-primary">
              Compact Mode (reduce padding and spacing)
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-text-primary">Order Confirmations</label>
                <p className="text-xs text-text-secondary">Show confirmation dialogs for orders</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.orderConfirmations}
                onChange={(e) => updateNestedSetting('notifications', 'orderConfirmations', e.target.checked)}
                className="w-4 h-4 text-accent bg-surface-elevated border-border rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-text-primary">Price Alerts</label>
                <p className="text-xs text-text-secondary">Notify when price reaches target</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.priceAlerts}
                onChange={(e) => updateNestedSetting('notifications', 'priceAlerts', e.target.checked)}
                className="w-4 h-4 text-accent bg-surface-elevated border-border rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-text-primary">Funding Reminders</label>
                <p className="text-xs text-text-secondary">Remind about upcoming funding payments</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.fundingReminders}
                onChange={(e) => updateNestedSetting('notifications', 'fundingReminders', e.target.checked)}
                className="w-4 h-4 text-accent bg-surface-elevated border-border rounded"
              />
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Display</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Price Precision ({settings.display.pricePrecision} decimals)
              </label>
              <input
                type="range"
                min="0"
                max="8"
                value={settings.display.pricePrecision}
                onChange={(e) => updateNestedSetting('display', 'pricePrecision', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Size Precision ({settings.display.sizePrecision} decimals)
              </label>
              <input
                type="range"
                min="0"
                max="8"
                value={settings.display.sizePrecision}
                onChange={(e) => updateNestedSetting('display', 'sizePrecision', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Trading */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Trading</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Default Leverage</label>
              <select
                value={settings.trading.defaultLeverage}
                onChange={(e) => updateNestedSetting('trading', 'defaultLeverage', parseInt(e.target.value))}
                className="w-full p-2 bg-surface-elevated border border-border rounded text-text-primary"
              >
                {[1, 2, 5, 10, 20, 50, 100].map(leverage => (
                  <option key={leverage} value={leverage}>{leverage}x</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">Default Order Size</label>
              <input
                type="text"
                value={settings.trading.defaultOrderSize}
                onChange={(e) => updateNestedSetting('trading', 'defaultOrderSize', e.target.value)}
                className="w-full p-2 bg-surface-elevated border border-border rounded text-text-primary"
                placeholder="e.g., 1.0 or 1000"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-text-primary">Confirm Orders</label>
                <p className="text-xs text-text-secondary">Require confirmation before placing orders</p>
              </div>
              <input
                type="checkbox"
                checked={settings.trading.confirmOrders}
                onChange={(e) => updateNestedSetting('trading', 'confirmOrders', e.target.checked)}
                className="w-4 h-4 text-accent bg-surface-elevated border-border rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-text-primary">Sound Effects</label>
                <p className="text-xs text-text-secondary">Play sounds for order events</p>
              </div>
              <input
                type="checkbox"
                checked={settings.trading.soundEffects}
                onChange={(e) => updateNestedSetting('trading', 'soundEffects', e.target.checked)}
                className="w-4 h-4 text-accent bg-surface-elevated border-border rounded"
              />
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-4 border-t border-border pt-4">
          <h3 className="text-lg font-semibold text-text-primary">Account Actions</h3>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={handleSave}
              className="p-2 bg-accent text-black rounded font-medium hover:bg-accent/90 transition-colors"
            >
              Save Settings
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-surface-elevated text-text-primary border border-border rounded font-medium hover:bg-surface-hover transition-colors"
            >
              Reset to Default
            </button>

            <button
              onClick={handleExport}
              className="p-2 bg-surface-elevated text-text-primary border border-border rounded font-medium hover:bg-surface-hover transition-colors"
            >
              Export Settings
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2 p-2 bg-surface-elevated border border-border rounded cursor-pointer hover:bg-surface-hover transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <span className="text-text-primary">Import Settings</span>
            </label>

            <button
              onClick={() => {
                localStorage.removeItem('liquidvex-settings');
                alert('Settings cleared. Please refresh the page.');
              }}
              className="p-2 bg-loss/20 text-loss border border-loss/50 rounded font-medium hover:bg-loss/30 transition-colors"
            >
              Clear All Settings
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}