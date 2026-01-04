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
  sessionKeys: {
    enabled: boolean;
    keys: SessionKey[];
  };
}

interface SessionKey {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
  permissions: string[];
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'session-keys'>('general');
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
    sessionKeys: {
      enabled: false,
      keys: [],
    },
  });

  // Session key creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [sessionKeyError, setSessionKeyError] = useState<string | null>(null);

  // Session key revocation confirmation state
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

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
      sessionKeys: {
        enabled: false,
        keys: [],
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

  const handleOpenCreateModal = () => {
    setNewKeyName('');
    setSelectedPermissions([]);
    setSessionKeyError(null);
    setShowCreateModal(true);
  };

  const handleCreateSessionKey = async () => {
    // Validation
    if (!newKeyName.trim()) {
      setSessionKeyError('Session key name is required');
      return;
    }
    if (selectedPermissions.length === 0) {
      setSessionKeyError('At least one permission is required');
      return;
    }

    try {
      // This would call the API to create a session key
      const response = await fetch('/api/wallet/create-session-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          permissions: selectedPermissions
        })
      });

      if (response.ok) {
        const newKey = await response.json();
        // Add local fields for display
        const keyWithLocalFields = {
          ...newKey,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          isActive: true
        };
        setSettings(prev => ({
          ...prev,
          sessionKeys: {
            ...prev.sessionKeys,
            keys: [...prev.sessionKeys.keys, keyWithLocalFields]
          }
        }));
        setShowCreateModal(false);
        setSessionKeyError(null);
      } else {
        setSessionKeyError('Failed to create session key');
      }
    } catch (error) {
      console.error('Failed to create session key:', error);
      setSessionKeyError('Failed to create session key');
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleOpenRevokeConfirm = (keyId: string) => {
    setKeyToRevoke(keyId);
    setShowRevokeConfirm(true);
  };

  const handleConfirmRevoke = async () => {
    if (!keyToRevoke) return;

    try {
      const response = await fetch(`/api/wallet/revoke-session-key/${keyToRevoke}`, {
        method: 'POST'
      });

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          sessionKeys: {
            ...prev.sessionKeys,
            keys: prev.sessionKeys.keys.map(key =>
              key.id === keyToRevoke ? { ...key, isActive: false } : key
            )
          }
        }));
        setShowRevokeConfirm(false);
        setKeyToRevoke(null);
      }
    } catch (error) {
      console.error('Failed to revoke session key:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings" data-testid="settings-modal">
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

        {/* Session Keys */}
        <div className="space-y-4" data-testid="session-keys-section">
          <h3 className="text-lg font-semibold text-text-primary">Session Keys</h3>

          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="session-keys-enabled"
              checked={settings.sessionKeys.enabled}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                sessionKeys: { ...prev.sessionKeys, enabled: e.target.checked }
              }))}
              className="w-4 h-4 text-accent bg-surface-elevated border-border rounded"
              data-testid="session-keys-toggle"
            />
            <label htmlFor="session-keys-enabled" className="text-sm text-text-primary">
              Enable Session Keys for reduced signing
            </label>
          </div>

          {settings.sessionKeys.enabled && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-text-secondary">Active Session Keys</span>
                <button
                  onClick={handleOpenCreateModal}
                  className="p-1 bg-accent text-black rounded text-sm hover:bg-accent/90 transition-colors"
                  data-testid="create-session-key-button"
                >
                  Create Session Key
                </button>
              </div>

              {settings.sessionKeys.keys.length === 0 ? (
                <div className="text-sm text-text-tertiary p-3 bg-surface-elevated border border-border rounded" data-testid="session-keys-empty">
                  No session keys created yet. Create a session key to reduce signing requirements for trades.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto" data-testid="session-key-list">
                  {settings.sessionKeys.keys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 bg-surface-elevated border border-border rounded" data-testid="session-key-item">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">{key.name}</div>
                        <div className="text-xs text-text-tertiary">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                          {' • '}
                          Last used: {new Date(key.lastUsed).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-text-tertiary" data-testid="session-key-permissions">
                          Permissions: {key.permissions.join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          key.isActive
                            ? 'bg-success/20 text-success border border-success/50'
                            : 'bg-loss/20 text-loss border border-loss/50'
                        }`} data-testid="session-key-status">
                          {key.isActive ? 'Active' : 'Revoked'}
                        </span>
                        {key.isActive && (
                          <button
                            onClick={() => handleOpenRevokeConfirm(key.id)}
                            className="p-1 bg-loss/20 text-loss border border-loss/50 rounded text-sm hover:bg-loss/30 transition-colors"
                            data-testid="revoke-session-key-button"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

      {/* Create Session Key Modal */}
      {showCreateModal && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center" data-testid="create-session-key-modal">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="modal-content relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Create Session Key</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-surface-elevated rounded transition-colors"
                data-testid="close-create-modal-button"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Session Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Trading Bot Key"
                  className="w-full p-2 bg-surface-elevated border border-border rounded text-text-primary"
                  data-testid="session-key-name-input"
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Permissions</label>
                <div className="space-y-2">
                  {['trade', 'view', 'withdraw'].map(permission => (
                    <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="w-4 h-4 text-accent bg-surface-elevated border-border rounded"
                        data-testid={`permission-${permission}-checkbox`}
                      />
                      <span className="text-sm text-text-primary capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {sessionKeyError && (
                <div className="text-sm text-error bg-loss/10 border border-loss/30 rounded p-2" data-testid="session-key-error">
                  {sessionKeyError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-surface-elevated border border-border rounded hover:bg-surface-hover transition-colors text-text-primary"
                  data-testid="cancel-create-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSessionKey}
                  className="flex-1 px-4 py-2 bg-accent text-black rounded hover:bg-accent/90 transition-colors"
                  data-testid="confirm-session-key-button"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeConfirm && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center" data-testid="revoke-confirm-modal">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="modal-content relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-sm mx-4 animate-fade-in">
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Confirm Revocation</h2>
              <p className="text-sm text-text-secondary">
                Are you sure you want to revoke this session key? This action cannot be undone.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowRevokeConfirm(false)}
                  className="flex-1 px-4 py-2 bg-surface-elevated border border-border rounded hover:bg-surface-hover transition-colors text-text-primary"
                  data-testid="cancel-revoke-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRevoke}
                  className="flex-1 px-4 py-2 bg-loss/20 text-loss border border-loss/50 rounded hover:bg-loss/30 transition-colors"
                  data-testid="confirm-revoke-button"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}