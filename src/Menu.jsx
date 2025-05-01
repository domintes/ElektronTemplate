import { FaUserCog, FaMoon, FaSun, FaSignOutAlt, FaBars } from 'react-icons/fa'
import { useState } from 'react'

function Menu({ darkMode, onThemeToggle, onProfileManager, onExit }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2000 }}>
      <button onClick={() => setOpen(o => !o)} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>
        <FaBars />
      </button>
      {open && (
        <div style={{ background: '#222', color: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0008', minWidth: 180, marginTop: 8, padding: 8 }}>
          <button onClick={onThemeToggle} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', color: 'inherit', padding: 8, cursor: 'pointer' }}>
            {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? 'Jasny motyw' : 'Ciemny motyw'}
          </button>
          <button onClick={onProfileManager} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', color: 'inherit', padding: 8, cursor: 'pointer' }}>
            <FaUserCog /> Profile Manager
          </button>
          <button onClick={onExit} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', color: 'inherit', padding: 8, cursor: 'pointer' }}>
            <FaSignOutAlt /> Wyjdź
          </button>
        </div>
      )}
    </div>
  )
}

export default Menu
