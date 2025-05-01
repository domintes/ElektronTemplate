import { useState, useEffect } from 'react'
import ProfileSelector from './ProfileSelector'
import ProfileManager from './ProfileManager'
import SettingsDrawer from './SettingsDrawer'
import './App.css'

// Sprawdzanie, czy aplikacja działa w środowisku Electron
const isElectron = () => {
  return window.electron !== undefined
}

// Funkcja generująca unikalny identyfikator
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function App() {
  const [sourceFolder, setSourceFolder] = useState('')
  const [destinationFolder, setDestinationFolder] = useState('')
  const [beatmaps, setBeatmaps] = useState([])
  const [filteredBeatmaps, setFilteredBeatmaps] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBeatmaps, setSelectedBeatmaps] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isElectronEnv, setIsElectronEnv] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [progress, setProgress] = useState(null)
  const [showActions, setShowActions] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  
  const ITEMS_PER_PAGE = 100

  // Profile state
  const [profiles, setProfiles] = useState(() => {
    const stored = localStorage.getItem('profiles')
    return stored ? JSON.parse(stored) : ['Domyślny']
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
  const [showProfileManager, setShowProfileManager] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  // Sprawdzenie środowiska przy montowaniu komponentu
  useEffect(() => {
    setIsElectronEnv(isElectron())
    
    // Sprawdź, czy użytkownik preferuje ciemny motyw
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDarkMode)
    
    // Zastosuj odpowiedni motyw
    applyTheme(prefersDarkMode)
    
    if (!isElectron()) {
      setMessage('Aplikacja działa w przeglądarce. Funkcje systemowe (wybór folderów, wyszukiwanie i przenoszenie beatmap) są niedostępne.')
      
      // Dodajemy przykładowe dane w trybie webowym dla demonstracji interfejsu
      const exampleBeatmaps = generateExampleBeatmaps(50)
      setBeatmaps(exampleBeatmaps)
      setFilteredBeatmaps(exampleBeatmaps)
    }
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
  
  // Generowanie przykładowych danych dla wersji webowej
  const generateExampleBeatmaps = (count) => {
    const examples = []
    const artists = ['DECO*27', 'Camellia', 'REOL', 'Yoasobi', 'Eve', 'Kenshi Yonezu', 'Yorushika']
    const creators = ['Sotarks', 'Monstrata', 'Lasse', 'Akitoshi', 'Doormat', 'pishifat']
    
    for (let i = 0; i < count; i++) {
      const artist = artists[Math.floor(Math.random() * artists.length)]
      const title = `Example Map ${i + 1}`
      const creator = creators[Math.floor(Math.random() * creators.length)]
      const bpm = Math.floor(Math.random() * 100) + 140
      const totalTime = Math.floor(Math.random() * 180) + 60
      
      examples.push({
        id: `example-${i}-${generateUniqueId()}`,
        artist,
        title,
        creator,
        version: `${Math.floor(Math.random() * 5) + 1}★ Difficulty`,
        bpm,
        totalTime
      })
    }
    
    return examples
  }
  
  // Obsługa wyboru folderu źródłowego
  const handleChooseSourceFolder = async () => {
    if (!isElectronEnv) {
      setMessage('Funkcja wyboru folderu jest niedostępna w przeglądarce')
      return
    }
    
    try {
      window.electron.ipcRenderer.send('choose-source-folder')
    } catch (error) {
      setMessage(`Błąd przy wyborze folderu: ${error.message}`)
    }
  }
  
  // Obsługa wyboru folderu docelowego
  const handleChooseDestinationFolder = async () => {
    if (!isElectronEnv) {
      setMessage('Funkcja wyboru folderu jest niedostępna w przeglądarce')
      return
    }
    
    try {
      window.electron.ipcRenderer.send('choose-destination-folder')
    } catch (error) {
      setMessage(`Błąd przy wyborze folderu: ${error.message}`)
    }
  }
  
  // Funkcja do wyszukiwania beatmap
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    if (e.target.value === '') {
      setFilteredBeatmaps(beatmaps)
    } else {
      const filtered = beatmaps.filter(beatmap => 
        beatmap.artist.toLowerCase().includes(e.target.value.toLowerCase()) ||
        beatmap.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
        beatmap.creator.toLowerCase().includes(e.target.value.toLowerCase())
      )
      setFilteredBeatmaps(filtered)
    }
    setCurrentPage(1)
  }
  
  // Funkcja do zaznaczenia/odznaczenia wszystkich widocznych beatmap
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageBeatmaps = getCurrentPageItems()
      const currentIds = currentPageBeatmaps.map(beatmap => beatmap.id)
      setSelectedBeatmaps([...new Set([...selectedBeatmaps, ...currentIds])])
    } else {
      const currentPageBeatmaps = getCurrentPageItems()
      const currentIds = new Set(currentPageBeatmaps.map(beatmap => beatmap.id))
      setSelectedBeatmaps(selectedBeatmaps.filter(id => !currentIds.has(id)))
    }
  }
  
  // Funkcja do zaznaczenia/odznaczenia pojedynczej beatmapy
  const handleSelectBeatmap = (beatmapId) => {
    if (selectedBeatmaps.includes(beatmapId)) {
      setSelectedBeatmaps(selectedBeatmaps.filter(id => id !== beatmapId))
    } else {
      setSelectedBeatmaps([...selectedBeatmaps, beatmapId])
    }
  }
  
  // Przeniesienie zaznaczonych beatmap do wybranego folderu
  const handleMoveBeatmaps = () => {
    if (!isElectronEnv) {
      setMessage('Funkcja przenoszenia beatmap jest niedostępna w przeglądarce')
      return
    }
    
    if (selectedBeatmaps.length === 0) {
      setMessage('Nie wybrano żadnych beatmap do przeniesienia')
      return
    }
    
    if (!destinationFolder) {
      setMessage('Nie wybrano folderu docelowego')
      return
    }
    
    setLoading(true)
    setMessage('Przenoszenie beatmap...')
    
    window.electron.ipcRenderer.send('move-beatmaps', {
      beatmapIds: selectedBeatmaps,
      destinationFolder
    })
  }
  
  // Pobranie beatmap dla aktualnej strony
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredBeatmaps.slice(startIndex, endIndex)
  }
  
  // Obliczenie całkowitej liczby stron
  const totalPages = Math.ceil(filteredBeatmaps.length / ITEMS_PER_PAGE)
  
  // Efekt nasłuchujący odpowiedzi IPC (tylko w środowisku Electron)
  useEffect(() => {
    if (!isElectronEnv) return
    
    // Obsługa odpowiedzi wyboru folderu źródłowego
    window.electron.ipcRenderer.on('source-folder-selected', (folder) => {
      setSourceFolder(folder)
      setMessage(`Wybrano folder źródłowy: ${folder}`)
    })
    
    // Obsługa odpowiedzi wyboru folderu docelowego
    window.electron.ipcRenderer.on('destination-folder-selected', (folder) => {
      setDestinationFolder(folder)
      setMessage(`Wybrano folder docelowy: ${folder}`)
    })
    
    // Obsługa odpowiedzi wyszukiwania beatmap
    window.electron.ipcRenderer.on('beatmaps-found', (result) => {
      // Dodajemy unikalny identyfikator do każdej beatmapy
      const beatmapsWithUniqueIds = result.beatmaps.map(beatmap => ({
        ...beatmap,
        uniqueId: generateUniqueId()
      }));
      
      setBeatmaps(beatmapsWithUniqueIds)
      setFilteredBeatmaps(beatmapsWithUniqueIds)
      setLoading(false)
      setMessage(`Znaleziono ${beatmapsWithUniqueIds.length} beatmap`)
    })
    
    // Obsługa odpowiedzi przeniesienia beatmap
    window.electron.ipcRenderer.on('beatmaps-moved', (result) => {
      setLoading(false)
      setMessage(`Przeniesiono ${result.moved} beatmap do ${result.destination}`)
      setSelectedBeatmaps([])
      
      // Odśwież listę beatmap po przeniesieniu
      window.electron.ipcRenderer.send('search-beatmaps', sourceFolder)
    })
    
    // Obsługa błędów
    window.electron.ipcRenderer.on('error', (error) => {
      setLoading(false)
      setMessage(`Błąd: ${error}`)
    })

    // Obsługa postępu ładowania beatmap
    window.electron.ipcRenderer.on('beatmaps-progress', (data) => {
      setProgress(data)
    })
  }, [sourceFolder, isElectronEnv])
  
  // Rozpoczęcie wyszukiwania beatmap po wybraniu folderu źródłowego (tylko w środowisku Electron)
  useEffect(() => {
    if (!isElectronEnv) return
    
    if (sourceFolder) {
      setLoading(true)
      setMessage('Wyszukiwanie beatmap...')
      window.electron.ipcRenderer.send('search-beatmaps', sourceFolder)
    }
  }, [sourceFolder, isElectronEnv])

  // Resetuj postęp po zakończeniu ładowania
  useEffect(() => {
    if (!loading) setProgress(null)
  }, [loading])

  // Profile actions
  const handleSelectProfile = (profile) => {
    setActiveProfile(profile)
    setShowProfileSelector(false)
  }
  const handleCreateProfile = (name) => {
    setProfiles(p => [...p, name])
    setActiveProfile(name)
    setShowProfileSelector(false)
  }
  const handleSwitchProfile = (profile) => {
    setActiveProfile(profile)
    setShowProfileManager(false)
  }
  const handleDeleteProfile = (profile) => {
    if (profiles.length === 1) return
    const idx = profiles.indexOf(profile)
    const newProfiles = profiles.filter(p => p !== profile)
    setProfiles(newProfiles)
    if (activeProfile === profile) {
      setActiveProfile(newProfiles[0])
    }
  }

  // Settings actions
  const handleExit = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.close()
    }
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
    <div className="app-container">
      {/* Settings Drawer & Profile Manager */}
      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onThemeToggle={toggleDarkMode}
        darkMode={darkMode}
        onManageProfiles={() => { setShowProfileManager(true); setShowSettings(false) }}
        onExit={handleExit}
      />
      {showProfileManager && (
        <ProfileManager
          profiles={profiles}
          activeProfile={activeProfile}
          onSwitch={handleSwitchProfile}
          onCreate={handleCreateProfile}
          onDelete={handleDeleteProfile}
          onClose={() => setShowProfileManager(false)}
        />
      )}
      <div className="app-header">
        <h1>Osu! Beatmap Manager</h1>
        <button 
          onClick={toggleDarkMode}
          className="theme-toggle"
          title={darkMode ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw"}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
      
      {!isElectronEnv && (
        <div className="web-notice">
          Wersja przeglądarkowa - ograniczona funkcjonalność.
          <br />
          Pełna funkcjonalność dostępna tylko w aplikacji desktopowej.
        </div>
      )}
      
      <div className="folder-section">
        <div className="folder-item beatmap-source-input">
          <button onClick={handleChooseSourceFolder} disabled={loading || !isElectronEnv}>
            Wybierz folder źródłowy
          </button>
          <span className="folder-path">{sourceFolder || 'Nie wybrano'}</span>
        </div>
      </div>
      
      {beatmaps.length > 0 && !showMoveMenu && (
        <div className="actions-bar">
          <button onClick={() => setShowActions(true)} className="actions-btn">Akcje</button>
        </div>
      )}
      
      {showActions && !showMoveMenu && (
        <div className="popup-menu">
          <button className="popup-close" onClick={() => setShowActions(false)}>✕</button>
          <div className="popup-content">
            <button onClick={() => { setShowMoveMenu(true); setShowActions(false); }}>Przenieś beatmapy w inne lokalizację</button>
          </div>
        </div>
      )}
      
      {showMoveMenu && (
        <div className="popup-menu">
          <button className="popup-close" onClick={() => { setShowMoveMenu(false); setDestinationFolder(''); }}>
            ✕
          </button>
          <div className="popup-content">
            <div style={{ marginBottom: 8 }}>
              <button onClick={handleChooseDestinationFolder} disabled={loading || !isElectronEnv}>
                Wybierz folder docelowy
              </button>
              {showMoveMenu && (
                <div className="folder-item beatmap-destination-input">
                  <button onClick={handleChooseDestinationFolder} disabled={loading || !isElectronEnv}>
                    Wybierz folder docelowy
                  </button>
                  <span className="folder-path">{destinationFolder || 'Nie wybrano'}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => { handleMoveBeatmaps(); setShowMoveMenu(false); }}
              disabled={loading || selectedBeatmaps.length === 0 || !destinationFolder || !isElectronEnv}
              className="move-button"
            >
              Wykonaj akcję
            </button>
            <button onClick={() => { setShowMoveMenu(false); setDestinationFolder(''); }} style={{ marginLeft: 8 }}>
              Anuluj
            </button>
          </div>
        </div>
      )}
      
      {beatmaps.length > 0 && (
        <div className="search-section">
          <input
            type="text"
            placeholder="Wyszukaj po artyście, tytule lub twórcy..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          
          <div className="beatmaps-actions">
            <label className="select-all">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={getCurrentPageItems().length > 0 && 
                  getCurrentPageItems().every(beatmap => selectedBeatmaps.includes(beatmap.id))}
              />
              Zaznacz wszystkie widoczne
            </label>
            
            <button 
              onClick={handleMoveBeatmaps} 
              disabled={loading || selectedBeatmaps.length === 0 || !destinationFolder || !isElectronEnv}
              className="move-button"
            >
              Przenieś zaznaczone ({selectedBeatmaps.length})
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading">
          {progress && progress.total > 0
            ? `Wczytano ${progress.loaded} / ${progress.total}...`
            : 'Ładowanie...'}
        </div>
      ) : beatmaps.length > 0 ? (
        <>
          <div className="beatmaps-list">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Artysta</th>
                  <th>Tytuł</th>
                  <th>Twórca</th>
                  <th>BPM</th>
                  <th>Długość</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageItems().map((beatmap) => (
                  <tr key={beatmap.uniqueId || beatmap.id} className={selectedBeatmaps.includes(beatmap.id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedBeatmaps.includes(beatmap.id)}
                        onChange={() => handleSelectBeatmap(beatmap.id)}
                      />
                    </td>
                    <td>{beatmap.artist}</td>
                    <td>{beatmap.title}</td>
                    <td>{beatmap.creator}</td>
                    <td>{beatmap.bpm}</td>
                    <td>{Math.floor(beatmap.totalTime / 60)}:{(beatmap.totalTime % 60).toString().padStart(2, '0')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Poprzednia
              </button>
              
              <span className="page-info">
                Strona {currentPage} z {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Następna
              </button>
            </div>
          )}
        </>
      ) : sourceFolder ? (
        <div className="no-beatmaps">Nie znaleziono beatmap w wybranym folderze</div>
      ) : null}
      
      {message && <div className="message">{message}</div>}
    </div>
  )
}

export default App
