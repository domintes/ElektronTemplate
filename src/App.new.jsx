import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { activeProfileAtom } from './store'
import ProfileSelector from './ProfileSelector'
import Sidebar from './components/organisms/Sidebar/Sidebar'
import LocalCollection from './pages/LocalCollection/LocalCollection'
import Collection from './pages/Collection/Collection'
import Settings from './pages/Settings/Settings'
import './App.css'

// Sprawdzanie, czy aplikacja działa w środowisku Electron
const isElectron = () => {
  return window.electron !== undefined
}

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [isElectronEnv, setIsElectronEnv] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Profile state
  const [profiles, setProfiles] = useState(() => {
    const stored = localStorage.getItem('profiles')
    return stored ? JSON.parse(stored) : ['Default']
  })
  const [activeProfile, setActiveProfile] = useState(() => {
    const remembered = localStorage.getItem('rememberedProfile')
    if (remembered && JSON.parse(localStorage.getItem('rememberChoice'))) {
      return remembered
    }
    return ''
  })
  const [showProfileSelector, setShowProfileSelector] = useState(!activeProfile)
  const [rememberChoice, setRememberChoice] = useState(() => {
    const stored = localStorage.getItem('rememberChoice')
    return stored ? JSON.parse(stored) : false
  })
  
  const [, setActiveProfileAtom] = useAtom(activeProfileAtom)

  // Sprawdzenie środowiska przy montowaniu komponentu
  useEffect(() => {
    setIsElectronEnv(isElectron())
    
    // Sprawdź, czy użytkownik preferuje ciemny motyw
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDarkMode)
    
    // Zastosuj odpowiedni motyw
    applyTheme(prefersDarkMode)
  }, [])

  useEffect(() => {
    localStorage.setItem('profiles', JSON.stringify(profiles))
  }, [profiles])
  
  useEffect(() => {
    if (activeProfile) {
      localStorage.setItem('rememberedProfile', activeProfile)
    }
  }, [activeProfile])
  
  useEffect(() => {
    localStorage.setItem('rememberChoice', JSON.stringify(rememberChoice))
  }, [rememberChoice])

  // Funkcja przełączająca motyw
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    applyTheme(newDarkMode)
  }

  // Funkcja aplikująca motyw
  const applyTheme = (isDark) => {
    if (isDark) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }

  // Profile actions
  const handleSelectProfile = (profile) => {
    setActiveProfile(profile)
    setActiveProfileAtom(profile)
    setShowProfileSelector(false)
  }
  
  const handleCreateProfile = (name) => {
    setProfiles(p => [...p, name])
    setActiveProfile(name)
    setActiveProfileAtom(name)
    setShowProfileSelector(false)
  }

  if (showProfileSelector || !activeProfile) {
    return (
      <ProfileSelector
        profiles={profiles}
        onSelect={handleSelectProfile}
        onCreate={handleCreateProfile}
        rememberChoice={rememberChoice}
        setRememberChoice={setRememberChoice}
      />
    )
  }

  return (
    <Router>
      <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          darkMode={darkMode}
          onThemeToggle={toggleDarkMode}
          activeProfile={activeProfile}
          profiles={profiles}
          onProfileSwitch={handleSelectProfile}
          onProfileCreate={handleCreateProfile}
          isElectronEnv={isElectronEnv}
        />
        
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/collection" replace />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/local" element={<LocalCollection />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
