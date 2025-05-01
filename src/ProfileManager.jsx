import { useState } from 'react'
import { FaTimes, FaTrash, FaPlus } from 'react-icons/fa'

function ProfileManager({ profiles, activeProfile, onSwitch, onCreate, onDelete, onClose }) {
  const [newProfileName, setNewProfileName] = useState('')
  const [error, setError] = useState('')

  const handleCreate = () => {
    if (!newProfileName.trim()) {
      setError('Nazwa profilu nie może być pusta')
      return
    }
    if (profiles.includes(newProfileName.trim())) {
      setError('Profil o tej nazwie już istnieje')
      return
    }
    onCreate(newProfileName.trim())
    setNewProfileName('')
    setError('')
  }

  return (
    <div className="modal" style={{ zIndex: 3000, minWidth: 340 }}>
      <button className="modal-close" onClick={onClose} aria-label="Zamknij">
        <FaTimes />
      </button>
      <h2>Zarządzaj profilami</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', maxHeight: 120, overflowY: 'auto' }}>
        {profiles.map(profile => (
          <li key={profile} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button
              style={{ minWidth: 100, fontWeight: profile === activeProfile ? 'bold' : 'normal' }}
              onClick={() => onSwitch(profile)}
              disabled={profile === activeProfile}
            >
              {profile} {profile === activeProfile && '(aktywny)'}
            </button>
            <button
              style={{ background: '#9b3535', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => onDelete(profile)}
              disabled={profiles.length === 1}
              aria-label={`Usuń profil ${profile}`}
            >
              <FaTrash /> Usuń
            </button>
          </li>
        ))}
      </ul>
      <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          placeholder="Nowy profil..."
          value={newProfileName}
          onChange={e => setNewProfileName(e.target.value)}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', marginRight: 8 }}
        />
        <button onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FaPlus /> Utwórz
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
    </div>
  )
}

export default ProfileManager
