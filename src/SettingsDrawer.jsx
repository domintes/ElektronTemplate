import { FaCog } from 'react-icons/fa'

function SettingsDrawer({ open, onClose, onThemeToggle, darkMode, onManageProfiles, onExit }) {
  return (
    <>
      {open && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 260,
          height: '100%',
          background: darkMode ? '#232323' : '#fff',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.18)',
          zIndex: 1500,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 1rem',
          transition: 'right 0.2s',
        }}>
          <button onClick={onClose} style={{ alignSelf: 'flex-end', background: '#9b3535', color: '#fff', border: 'none', borderRadius: 16, width: 32, height: 32, fontSize: 18, marginBottom: 16 }}>✕</button>
          <h3 style={{ marginTop: 0 }}>Ustawienia</h3>
          <button onClick={onThemeToggle} style={{ margin: '12px 0' }}>
            Motyw: {darkMode ? 'Ciemny' : 'Jasny'}
          </button>
          <button onClick={onManageProfiles} style={{ margin: '12px 0' }}>
            Zarządzaj profilami
          </button>
          <button onClick={onExit} style={{ margin: '12px 0', background: '#9b3535', color: '#fff' }}>
            Wyjście
          </button>
        </div>
      )}
      <button
        onClick={open ? onClose : onManageProfiles}
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          width: 48,
          height: 48,
          background: '#4361ee',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          zIndex: 1600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          cursor: 'pointer',
        }}
        title="Ustawienia"
      >
        <FaCog />
      </button>
    </>
  )
}

export default SettingsDrawer
