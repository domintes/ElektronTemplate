import { useState } from 'react'

function ProfileSelector({ profiles, onSelect, onCreate, rememberChoice, setRememberChoice }) {
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
    <div className="modal" style={{ zIndex: 2000 }}>
      <h2>Wybierz profil użytkownika</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', maxHeight: 120, overflowY: 'auto' }}>
        {profiles.map(profile => (
          <li key={profile}>
            <button style={{ margin: 4, minWidth: 120 }} onClick={() => onSelect(profile)}>{profile}</button>
          </li>
        ))}
      </ul>
      <div style={{ margin: '1rem 0' }}>
        <input
          type="text"
          placeholder="Nowy profil..."
          value={newProfileName}
          onChange={e => setNewProfileName(e.target.value)}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', marginRight: 8 }}
        />
        <button onClick={handleCreate}>Utwórz</button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <input
          type="checkbox"
          checked={rememberChoice}
          onChange={e => setRememberChoice(e.target.checked)}
        />
        Zapamiętaj wybór
      </label>
    </div>
  )
}

export default ProfileSelector
