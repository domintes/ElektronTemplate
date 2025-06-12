import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { userPreferencesAtom } from '../../store'
import './Settings.css'

const Settings = () => {
  const [preferences, setPreferences] = useAtom(userPreferencesAtom)
  const [isElectronEnv, setIsElectronEnv] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    setIsElectronEnv(window.electron !== undefined)
  }, [])

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'osu', label: 'osu! Integration', icon: '🎵' },
    { id: 'collections', label: 'Collections', icon: '📁' },
    { id: 'interface', label: 'Interface', icon: '🎨' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ]

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleOsuConnect = () => {
    if (isElectronEnv) {
      window.electron.ipcRenderer.send('osu-auth-user')
    }
  }

  const handleClearCache = () => {
    if (isElectronEnv) {
      window.electron.ipcRenderer.send('clear-cache')
    }
  }

  const handleExportData = () => {
    if (isElectronEnv) {
      window.electron.ipcRenderer.send('export-collections')
    }
  }

  const handleImportData = () => {
    if (isElectronEnv) {
      window.electron.ipcRenderer.send('import-collections')
    }
  }

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>General Settings</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Theme
          <select 
            value={preferences.theme || 'system'} 
            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Language
          <select 
            value={preferences.language || 'en'} 
            onChange={(e) => handlePreferenceChange('language', e.target.value)}
          >
            <option value="en">English</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.autoSave || true}
            onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
          />
          Auto-save collections
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.startMinimized || false}
            onChange={(e) => handlePreferenceChange('startMinimized', e.target.checked)}
          />
          Start minimized
        </label>
      </div>
    </div>
  )

  const renderOsuSettings = () => (
    <div className="settings-section">
      <h3>osu! Integration</h3>
      
      <div className="setting-group">
        <div className="osu-auth-section">
          <h4>Account Connection</h4>
          <p>Connect your osu! account to access additional features like downloading beatmaps and syncing collections.</p>
          
          {!preferences.osuConnected ? (
            <button className="btn-primary" onClick={handleOsuConnect}>
              Connect osu! Account
            </button>
          ) : (
            <div className="connected-info">
              <span className="status-indicator connected">Connected</span>
              <span>Connected as: {preferences.osuUsername}</span>
              <button className="btn-secondary" onClick={() => handlePreferenceChange('osuConnected', false)}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Default download location
          <div className="file-input-group">
            <input 
              type="text" 
              value={preferences.downloadPath || ''} 
              placeholder="Choose download folder..."
              readOnly
            />
            <button className="btn-secondary">Browse</button>
          </div>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.autoDownload || false}
            onChange={(e) => handlePreferenceChange('autoDownload', e.target.checked)}
          />
          Auto-download beatmaps when added to collection
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.syncCollections || false}
            onChange={(e) => handlePreferenceChange('syncCollections', e.target.checked)}
          />
          Sync collections with osu! account
        </label>
      </div>
    </div>
  )

  const renderCollectionSettings = () => (
    <div className="settings-section">
      <h3>Collection Management</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Default collection behavior
          <select 
            value={preferences.defaultCollectionBehavior || 'ask'} 
            onChange={(e) => handlePreferenceChange('defaultCollectionBehavior', e.target.value)}
          >
            <option value="ask">Ask where to add</option>
            <option value="default">Add to default collection</option>
            <option value="recent">Add to most recent collection</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.autoGenerateTags || true}
            onChange={(e) => handlePreferenceChange('autoGenerateTags', e.target.checked)}
          />
          Auto-generate tags based on collection
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.duplicateDetection || true}
            onChange={(e) => handlePreferenceChange('duplicateDetection', e.target.checked)}
          />
          Detect duplicate beatmaps
        </label>
      </div>

      <div className="setting-group">
        <h4>Backup & Sync</h4>
        <div className="action-buttons">
          <button className="btn-secondary" onClick={handleExportData}>
            Export Collections
          </button>
          <button className="btn-secondary" onClick={handleImportData}>
            Import Collections
          </button>
        </div>
      </div>
    </div>
  )

  const renderInterfaceSettings = () => (
    <div className="settings-section">
      <h3>Interface Preferences</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Table density
          <select 
            value={preferences.tableDensity || 'normal'} 
            onChange={(e) => handlePreferenceChange('tableDensity', e.target.value)}
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="comfortable">Comfortable</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Items per page
          <select 
            value={preferences.itemsPerPage || 50} 
            onChange={(e) => handlePreferenceChange('itemsPerPage', parseInt(e.target.value))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.showBeatmapPreviews || true}
            onChange={(e) => handlePreferenceChange('showBeatmapPreviews', e.target.checked)}
          />
          Show beatmap previews
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.enableAnimations || true}
            onChange={(e) => handlePreferenceChange('enableAnimations', e.target.checked)}
          />
          Enable animations
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.compactSidebar || false}
            onChange={(e) => handlePreferenceChange('compactSidebar', e.target.checked)}
          />
          Compact sidebar by default
        </label>
      </div>
    </div>
  )

  const renderAdvancedSettings = () => (
    <div className="settings-section">
      <h3>Advanced Settings</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Cache size limit (MB)
          <input 
            type="number" 
            value={preferences.cacheSize || 1000} 
            onChange={(e) => handlePreferenceChange('cacheSize', parseInt(e.target.value))}
            min="100"
            max="10000"
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          API request timeout (seconds)
          <input 
            type="number" 
            value={preferences.apiTimeout || 30} 
            onChange={(e) => handlePreferenceChange('apiTimeout', parseInt(e.target.value))}
            min="5"
            max="120"
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input 
            type="checkbox" 
            checked={preferences.enableDebugMode || false}
            onChange={(e) => handlePreferenceChange('enableDebugMode', e.target.checked)}
          />
          Enable debug mode
        </label>
      </div>

      <div className="setting-group">
        <h4>Data Management</h4>
        <div className="action-buttons">
          <button className="btn-secondary" onClick={handleClearCache}>
            Clear Cache
          </button>
          <button className="btn-danger">
            Reset All Settings
          </button>
        </div>
      </div>

      <div className="setting-group">
        <h4>Application Info</h4>
        <div className="app-info">
          <div className="info-item">
            <span>Version:</span>
            <span>1.0.0</span>
          </div>
          <div className="info-item">
            <span>Build:</span>
            <span>2024.01.01</span>
          </div>
          <div className="info-item">
            <span>Platform:</span>
            <span>{isElectronEnv ? 'Desktop' : 'Web'}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings()
      case 'osu':
        return renderOsuSettings()
      case 'collections':
        return renderCollectionSettings()
      case 'interface':
        return renderInterfaceSettings()
      case 'advanced':
        return renderAdvancedSettings()
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your osudeit experience</p>
      </div>

      <div className="settings-content">
        <nav className="settings-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <main className="settings-main">
          {renderTabContent()}
        </main>
      </div>
    </div>
  )
}

export default Settings
