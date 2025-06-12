import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { activeProfileAtom, filteredBeatmapsAtom } from '../../store';
import FavoriteSection from '../../components/FavoriteSection/FavoriteSection';
import './LocalCollection.css';

// Sprawdzanie, czy aplikacja działa w środowisku Electron
const isElectron = () => {
  return window.electron !== undefined;
};

// Funkcja generująca unikalny identyfikator
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

function LocalCollection() {
  const [sourceFolder, setSourceFolder] = useState('');
  const [destinationFolder, setDestinationFolder] = useState('');
  const [beatmaps, setBeatmaps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBeatmaps, setSelectedBeatmaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isElectronEnv, setIsElectronEnv] = useState(false);
  const [progress, setProgress] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  
  const ITEMS_PER_PAGE = 100;
  
  const [filteredBeatmaps, setFilteredBeatmaps] = useAtom(filteredBeatmapsAtom);

  // Sprawdzenie środowiska przy montowaniu komponentu
  useEffect(() => {
    setIsElectronEnv(isElectron());
    
    if (!isElectron()) {
      setMessage('Local collection management requires desktop application. Functions like folder selection and beatmap scanning are unavailable in browser.');
      
      // Dodajemy przykładowe dane w trybie webowym dla demonstracji interfejsu
      const exampleBeatmaps = generateExampleBeatmaps(50);
      setBeatmaps(exampleBeatmaps);
      setFilteredBeatmaps(exampleBeatmaps);
    }
  }, []);

  // Generowanie przykładowych danych dla wersji webowej
  const generateExampleBeatmaps = (count) => {
    const examples = [];
    const artists = ['DECO*27', 'Camellia', 'REOL', 'Yoasobi', 'Eve', 'Kenshi Yonezu', 'Yorushika'];
    const creators = ['Sotarks', 'Monstrata', 'Lasse', 'Akitoshi', 'Doormat', 'pishifat'];
    
    for (let i = 0; i < count; i++) {
      const artist = artists[Math.floor(Math.random() * artists.length)];
      const title = `Example Local Map ${i + 1}`;
      const creator = creators[Math.floor(Math.random() * creators.length)];
      const bpm = Math.floor(Math.random() * 100) + 140;
      const totalTime = Math.floor(Math.random() * 180) + 60;
      
      examples.push({
        id: `local-${i}-${generateUniqueId()}`,
        artist,
        title,
        creator,
        version: `${Math.floor(Math.random() * 5) + 1}★ Difficulty`,
        bpm,
        totalTime
      });
    }
    
    return examples;
  };

  // Obsługa wyboru folderu źródłowego
  const handleChooseSourceFolder = async () => {
    if (!isElectronEnv) {
      setMessage('Folder selection function is unavailable in browser');
      return;
    }
    
    try {
      window.electron.ipcRenderer.send('choose-source-folder');
    } catch (error) {
      setMessage(`Error selecting folder: ${error.message}`);
    }
  };

  // Obsługa wyboru folderu docelowego
  const handleChooseDestinationFolder = async () => {
    if (!isElectronEnv) {
      setMessage('Folder selection function is unavailable in browser');
      return;
    }
    
    try {
      window.electron.ipcRenderer.send('choose-destination-folder');
    } catch (error) {
      setMessage(`Error selecting folder: ${error.message}`);
    }
  };

  // Funkcja do wyszukiwania beatmap
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      setFilteredBeatmaps(beatmaps);
    } else {
      const filtered = beatmaps.filter(beatmap => 
        beatmap.artist.toLowerCase().includes(e.target.value.toLowerCase()) ||
        beatmap.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
        beatmap.creator.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setFilteredBeatmaps(filtered);
    }
    setCurrentPage(1);
  };

  // Funkcja do zaznaczenia/odznaczenia wszystkich widocznych beatmap
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageBeatmaps = getCurrentPageItems();
      const currentIds = currentPageBeatmaps.map(beatmap => beatmap.id);
      setSelectedBeatmaps([...new Set([...selectedBeatmaps, ...currentIds])]);
    } else {
      const currentPageBeatmaps = getCurrentPageItems();
      const currentIds = new Set(currentPageBeatmaps.map(beatmap => beatmap.id));
      setSelectedBeatmaps(selectedBeatmaps.filter(id => !currentIds.has(id)));
    }
  };

  // Funkcja do zaznaczenia/odznaczenia pojedynczej beatmapy
  const handleSelectBeatmap = (beatmapId) => {
    if (selectedBeatmaps.includes(beatmapId)) {
      setSelectedBeatmaps(selectedBeatmaps.filter(id => id !== beatmapId));
    } else {
      setSelectedBeatmaps([...selectedBeatmaps, beatmapId]);
    }
  };

  // Przeniesienie zaznaczonych beatmap do wybranego folderu
  const handleMoveBeatmaps = () => {
    if (!isElectronEnv) {
      setMessage('Beatmap moving function is unavailable in browser');
      return;
    }
    
    if (selectedBeatmaps.length === 0) {
      setMessage('No beatmaps selected for moving');
      return;
    }
    
    if (!destinationFolder) {
      setMessage('No destination folder selected');
      return;
    }
    
    setLoading(true);
    setMessage('Moving beatmaps...');
    
    window.electron.ipcRenderer.send('move-beatmaps', {
      beatmapIds: selectedBeatmaps,
      destinationFolder
    });
  };

  // Pobranie beatmap dla aktualnej strony
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredBeatmaps.slice(startIndex, endIndex);
  };

  // Obliczenie całkowitej liczby stron
  const totalPages = Math.ceil(filteredBeatmaps.length / ITEMS_PER_PAGE);

  // Efekt nasłuchujący odpowiedzi IPC (tylko w środowisku Electron)
  useEffect(() => {
    if (!isElectronEnv) return;
    
    // Obsługa odpowiedzi wyboru folderu źródłowego
    window.electron.ipcRenderer.on('source-folder-selected', (folder) => {
      setSourceFolder(folder);
      setMessage(`Source folder selected: ${folder}`);
    });
    
    // Obsługa odpowiedzi wyboru folderu docelowego
    window.electron.ipcRenderer.on('destination-folder-selected', (folder) => {
      setDestinationFolder(folder);
      setMessage(`Destination folder selected: ${folder}`);
    });
    
    // Obsługa odpowiedzi wyszukiwania beatmap
    window.electron.ipcRenderer.on('beatmaps-found', (result) => {
      const beatmapsWithUniqueIds = result.beatmaps.map(beatmap => ({
        ...beatmap,
        uniqueId: generateUniqueId()
      }));
      
      setBeatmaps(beatmapsWithUniqueIds);
      setFilteredBeatmaps(beatmapsWithUniqueIds);
      setLoading(false);
      setMessage(`Found ${beatmapsWithUniqueIds.length} beatmaps`);
    });
    
    // Obsługa odpowiedzi przeniesienia beatmap
    window.electron.ipcRenderer.on('beatmaps-moved', (result) => {
      setLoading(false);
      setMessage(`Moved ${result.moved} beatmaps to ${result.destination}`);
      setSelectedBeatmaps([]);
      
      // Odśwież listę beatmap po przeniesieniu
      window.electron.ipcRenderer.send('search-beatmaps', sourceFolder);
    });
    
    // Obsługa błędów
    window.electron.ipcRenderer.on('error', (error) => {
      setLoading(false);
      setMessage(`Error: ${error}`);
    });

    // Obsługa postępu ładowania beatmap
    window.electron.ipcRenderer.on('beatmaps-progress', (data) => {
      setProgress(data);
    });
  }, [sourceFolder, isElectronEnv]);

  // Rozpoczęcie wyszukiwania beatmap po wybraniu folderu źródłowego
  useEffect(() => {
    if (!isElectronEnv) return;
    
    if (sourceFolder) {
      setLoading(true);
      setMessage('Searching for beatmaps...');
      window.electron.ipcRenderer.send('search-beatmaps', sourceFolder);
    }
  }, [sourceFolder, isElectronEnv]);

  // Resetuj postęp po zakończeniu ładowania
  useEffect(() => {
    if (!loading) setProgress(null);
  }, [loading]);

  const handleBeatmapsFilter = (filtered) => {
    setFilteredBeatmaps(filtered);
  };

  return (
    <div className="local-collection-container">
      <div className="local-collection-header">
        <h1>Local Collection Manager</h1>
        <p>Manage beatmaps from local folders and organize your collection</p>
      </div>

      <FavoriteSection beatmaps={beatmaps} onFilter={handleBeatmapsFilter} />
      
      {!isElectronEnv && (
        <div className="web-notice">
          Browser version - limited functionality.
          <br />
          Full functionality available only in desktop application.
        </div>
      )}
      
      <div className="folder-section">
        <div className="folder-item">
          <button onClick={handleChooseSourceFolder} disabled={loading || !isElectronEnv}>
            Choose Source Folder
          </button>
          <span className="folder-path">{sourceFolder || 'No folder selected'}</span>
        </div>
      </div>
      
      {beatmaps.length > 0 && !showMoveMenu && (
        <div className="actions-bar">
          <button onClick={() => setShowActions(true)} className="actions-btn">Actions</button>
        </div>
      )}
      
      {showActions && !showMoveMenu && (
        <div className="popup-menu">
          <button className="popup-close" onClick={() => setShowActions(false)}>✕</button>
          <div className="popup-content">
            <button onClick={() => { setShowMoveMenu(true); setShowActions(false); }}>
              Move beatmaps to different location
            </button>
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
                Choose Destination Folder
              </button>
              {showMoveMenu && (
                <div className="folder-item">
                  <span className="folder-path">{destinationFolder || 'No destination selected'}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => { handleMoveBeatmaps(); setShowMoveMenu(false); }}
              disabled={loading || selectedBeatmaps.length === 0 || !destinationFolder || !isElectronEnv}
              className="move-button"
            >
              Execute Action
            </button>
            <button onClick={() => { setShowMoveMenu(false); setDestinationFolder(''); }} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {beatmaps.length > 0 && (
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by artist, title, or creator..."
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
              Select all visible
            </label>
            
            <button 
              onClick={handleMoveBeatmaps} 
              disabled={loading || selectedBeatmaps.length === 0 || !destinationFolder || !isElectronEnv}
              className="move-button"
            >
              Move selected ({selectedBeatmaps.length})
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading">
          {progress ? (
            <div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(progress.loaded / progress.total) * 100}%`,
                    backgroundColor: progress.errors ? '#e74c3c' : '#4361ee'
                  }}
                />
              </div>
              <div className="progress-text">
                Loaded {progress.loaded} of {progress.total} files
                {progress.errors && progress.errors.length > 0 && (
                  <div className="progress-errors">
                    Found {progress.errors.length} errors
                    <button 
                      onClick={() => setMessage(progress.errors.join('\n'))}
                      className="show-errors-btn"
                    >
                      Show details
                    </button>
                  </div>
                )}
              </div>
              {progress.loaded === progress.total && (
                <div className="progress-estimate">
                  Processing complete. Loading results...
                </div>
              )}
            </div>
          ) : (
            <>
              Initializing...
              <div className="loading-warning">
                This may take up to 5 minutes for large folders (~100GB)
              </div>
            </>
          )}
        </div>
      ) : beatmaps.length > 0 ? (
        <>
          <div className="beatmaps-list">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Artist</th>
                  <th>Title</th>
                  <th>Creator</th>
                  <th>BPM</th>
                  <th>Duration</th>
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
                Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : sourceFolder ? (
        <div className="no-beatmaps">No beatmaps found in selected folder</div>
      ) : null}
      
      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default LocalCollection;
