import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { 
  collectionsAtom, 
  searchAtom, 
  selectedBeatmapsAtom,
  apiStateAtom 
} from '../../store'
import SearchBar from '../../components/molecules/SearchBar/SearchBar'
import FilterPanel from '../../components/molecules/FilterPanel/FilterPanel'
import BeatmapList from '../../components/organisms/BeatmapList/BeatmapList'
import CollectionManager from '../../components/organisms/CollectionManager/CollectionManager'
import TagInput from '../../components/TagInput/TagInput'
import './Collection.css'

const Collection = () => {
  const [isElectronEnv, setIsElectronEnv] = useState(false)
  const [showCollectionManager, setShowCollectionManager] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  
  const [collections] = useAtom(collectionsAtom)
  const [searchQuery, setSearchQuery] = useAtom(searchAtom)
  const [selectedBeatmaps, setSelectedBeatmaps] = useAtom(selectedBeatmapsAtom)
  const [apiState, setApiState] = useAtom(apiStateAtom)

  // Check if running in Electron
  useEffect(() => {
    setIsElectronEnv(window.electron !== undefined)
  }, [])

  // Initialize osu!API connection
  useEffect(() => {
    if (isElectronEnv) {
      // Request authentication with osu!API
      window.electron.ipcRenderer.send('osu-auth')
      
      // Listen for auth response
      window.electron.ipcRenderer.on('osu-auth-success', () => {
        setApiState(prev => ({ ...prev, authenticated: true, loading: false }))
      })
      
      window.electron.ipcRenderer.on('osu-auth-error', (error) => {
        setApiState(prev => ({ 
          ...prev, 
          authenticated: false, 
          loading: false, 
          error: error 
        }))
      })
    }
  }, [isElectronEnv])

  const handleSearch = (query) => {
    setSearchQuery(query)
    
    if (isElectronEnv && query.trim()) {
      setApiState(prev => ({ ...prev, loading: true, error: null }))
      window.electron.ipcRenderer.send('search-beatmaps', { query })
    }
  }

  const handleAddToCollection = (beatmaps, collectionId) => {
    // Add beatmaps to specified collection
    // This will be implemented with collection management
    console.log('Adding beatmaps to collection:', beatmaps, collectionId)
  }

  const handleCreateCollection = (name, parentId = null) => {
    // Create new collection
    console.log('Creating collection:', name, parentId)
  }

  return (
    <div className="collection-page">
      <div className="collection-header">
        <div className="header-content">
          <h1>osu! Collection</h1>
          <p>Discover and manage beatmaps from the osu! community</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowCollectionManager(true)}
          >
            Manage Collections
          </button>
        </div>
      </div>

      {!isElectronEnv && (
        <div className="web-notice">
          <h3>Limited Functionality</h3>
          <p>
            osu! API features require the desktop application. 
            In browser mode, you can explore the interface but cannot 
            fetch real beatmap data or manage collections.
          </p>
        </div>
      )}

      {apiState.error && (
        <div className="error-notice">
          <h3>API Connection Error</h3>
          <p>{apiState.error}</p>
          <button 
            className="btn-secondary"
            onClick={() => window.electron?.ipcRenderer.send('osu-auth')}
          >
            Retry Connection
          </button>
        </div>
      )}

      <div className="collection-content">
        {/* Left Panel - Collections */}
        <aside className="collections-panel">
          <div className="panel-header">
            <h3>Collections</h3>
            <button 
              className="btn-sm"
              onClick={() => setShowCollectionManager(true)}
            >
              Manage
            </button>
          </div>
          
          <div className="collections-tree">
            {collections.length === 0 ? (
              <div className="empty-state">
                <p>No collections yet</p>
                <button 
                  className="btn-secondary"
                  onClick={() => handleCreateCollection('My First Collection')}
                >
                  Create Collection
                </button>
              </div>
            ) : (
              <div className="collection-list">
                {collections.map(collection => (
                  <div key={collection.id} className="collection-item">
                    <span className="collection-name">{collection.name}</span>
                    <span className="collection-count">{collection.beatmaps?.length || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-label">Collections:</span>
              <span className="stat-value">{collections.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Beatmaps:</span>
              <span className="stat-value">
                {collections.reduce((total, col) => total + (col.beatmaps?.length || 0), 0)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Selected:</span>
              <span className="stat-value">{selectedBeatmaps.length}</span>
            </div>
          </div>
        </aside>

        {/* Center Panel - Search and Results */}
        <main className="main-panel">
          <div className="search-section">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search beatmaps by artist, title, mapper..."
              loading={apiState.loading}
            />
            
            {showFilters && (
              <FilterPanel 
                onFiltersChange={(filters) => console.log('Filters:', filters)}
              />
            )}
          </div>

          <div className="results-section">
            <BeatmapList 
              beatmaps={apiState.beatmaps || []}
              loading={apiState.loading}
              selectedBeatmaps={selectedBeatmaps}
              onSelectionChange={setSelectedBeatmaps}
              onAddToCollection={handleAddToCollection}
            />
          </div>

          {selectedBeatmaps.length > 0 && (
            <div className="selection-actions">
              <div className="selection-info">
                {selectedBeatmaps.length} beatmap{selectedBeatmaps.length !== 1 ? 's' : ''} selected
              </div>
              <div className="action-buttons">
                <button 
                  className="btn-secondary"
                  onClick={() => setSelectedBeatmaps([])}
                >
                  Clear Selection
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => setShowCollectionManager(true)}
                >
                  Add to Collection
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Panel - Filters and Tags */}
        {showFilters && (
          <aside className="filters-panel">
            <div className="panel-header">
              <h3>Filters & Tags</h3>
            </div>
            
            <div className="filter-sections">
              <div className="filter-section">
                <h4>Difficulty</h4>
                <div className="difficulty-filters">
                  {/* Difficulty range slider will go here */}
                  <input type="range" min="0" max="10" step="0.1" />
                  <div className="range-labels">
                    <span>Easy</span>
                    <span>Expert+</span>
                  </div>
                </div>
              </div>

              <div className="filter-section">
                <h4>BPM Range</h4>
                <div className="bpm-filters">
                  <input type="number" placeholder="Min BPM" />
                  <input type="number" placeholder="Max BPM" />
                </div>
              </div>

              <div className="filter-section">
                <h4>Tags</h4>
                <TagInput 
                  placeholder="Add filter tags..."
                  onTagsChange={(tags) => console.log('Filter tags:', tags)}
                />
              </div>

              <div className="filter-section">
                <h4>Status</h4>
                <div className="status-filters">
                  <label>
                    <input type="checkbox" />
                    Ranked
                  </label>
                  <label>
                    <input type="checkbox" />
                    Loved
                  </label>
                  <label>
                    <input type="checkbox" />
                    Qualified
                  </label>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Collection Manager Modal */}
      {showCollectionManager && (
        <CollectionManager 
          onClose={() => setShowCollectionManager(false)}
          selectedBeatmaps={selectedBeatmaps}
          onAddToCollection={handleAddToCollection}
          onCreateCollection={handleCreateCollection}
        />
      )}
    </div>
  )
}

export default Collection
