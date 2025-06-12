import { useState, useEffect, useRef, useCallback } from 'react'
import { useAtom } from 'jotai'
import { useNavigate } from 'react-router-dom'
import { 
  collectionsAtom, 
  beatmapsAtom, 
  apiStateAtom,
  searchAtom
} from '../../store'
import { 
  FaSearch, 
  FaTimes, 
  FaMusic, 
  FaFolder, 
  FaUser, 
  FaTag,
  FaGlobe,
  FaDownload,
  FaHeart,
  FaPlay
} from 'react-icons/fa'
import './OsuverseSearchbar.scss'

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Global keyboard shortcut hook
const useGlobalShortcut = (shortcut, callback) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === shortcut) {
        e.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcut, callback])
}

const OsuverseSearchbar = ({ compact = false, autoFocus = false }) => {
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchResults, setSearchResults] = useState({
    collections: [],
    userBeatmaps: [],
    osuBeatmaps: [],
    mappers: [],
    tags: [],
    artists: []
  })

  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const navigate = useNavigate()

  const [collections] = useAtom(collectionsAtom)
  const [userBeatmaps] = useAtom(beatmapsAtom)
  const [apiState] = useAtom(apiStateAtom)
  const [, setGlobalSearch] = useAtom(searchAtom)

  const debouncedQuery = useDebounce(query, 600)

  // Global shortcut to focus search (Ctrl+K)
  useGlobalShortcut('k', () => {
    setIsExpanded(true)
    inputRef.current?.focus()
  })

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setIsExpanded(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])
  // Search logic
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults({
        collections: [],
        userBeatmaps: [],
        osuBeatmaps: [],
        mappers: [],
        tags: [],
        artists: []
      })
      setIsLoading(false)
      return
    }

    performSearch(debouncedQuery)
  }, [debouncedQuery, collections, userBeatmaps, performSearch])

  const performSearch = useCallback(async (searchQuery) => {
    setIsLoading(true)
    const query = searchQuery.toLowerCase()

    try {
      // Search in user collections
      const matchingCollections = collections.filter(collection =>
        collection.name.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query) ||
        collection.tags?.some(tag => tag.toLowerCase().includes(query))
      ).slice(0, 5)

      // Search in user beatmaps (local collection)
      const matchingUserBeatmaps = userBeatmaps.filter(beatmap =>
        beatmap.artist?.toLowerCase().includes(query) ||
        beatmap.title?.toLowerCase().includes(query) ||
        beatmap.creator?.toLowerCase().includes(query) ||
        beatmap.tags?.some(tag => tag.toLowerCase().includes(query))
      ).slice(0, 8)

      // Extract unique mappers and artists from user beatmaps
      const allMappers = [...new Set(userBeatmaps.map(b => b.creator).filter(Boolean))]
      const allArtists = [...new Set(userBeatmaps.map(b => b.artist).filter(Boolean))]
      const allTags = [...new Set(userBeatmaps.flatMap(b => b.tags || []))]

      const matchingMappers = allMappers.filter(mapper =>
        mapper.toLowerCase().includes(query)
      ).slice(0, 5)

      const matchingArtists = allArtists.filter(artist =>
        artist.toLowerCase().includes(query)
      ).slice(0, 5)

      const matchingTags = allTags.filter(tag =>
        tag.toLowerCase().includes(query)
      ).slice(0, 6)

      // Search osu!API if available and query is substantial
      let osuBeatmaps = []
      if (window.electron && searchQuery.length > 2) {
        try {
          window.electron.ipcRenderer.send('search-osu-beatmaps', { 
            query: searchQuery,
            limit: 10 
          })
          
          // Wait for results (this will be handled by IPC listener)
          // For now, we'll use mock data or existing API state
          osuBeatmaps = apiState.beatmaps?.slice(0, 10) || []
        } catch (error) {
          console.warn('osu!API search failed:', error)
        }
      }

      setSearchResults({
        collections: matchingCollections,
        userBeatmaps: matchingUserBeatmaps,
        osuBeatmaps,
        mappers: matchingMappers,
        tags: matchingTags,
        artists: matchingArtists
      })

    } catch (error) {
      console.error('Search error:', error)
    }

    setIsLoading(false)
  }, [collections, userBeatmaps, apiState.beatmaps])

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    
    if (value.trim()) {
      setIsExpanded(true)
    }
  }

  const handleInputFocus = () => {
    setIsExpanded(true)
    if (query.trim()) {
      performSearch(query)
    }
  }

  const handleClear = () => {
    setQuery('')
    setIsExpanded(false)
    setSearchResults({
      collections: [],
      userBeatmaps: [],
      osuBeatmaps: [],
      mappers: [],
      tags: [],
      artists: []
    })
    setSelectedIndex(-1)
  }

  const handleItemClick = (item, type) => {
    setIsExpanded(false)
    setSelectedIndex(-1)
    
    switch (type) {
      case 'collection':
        navigate('/collection', { state: { selectedCollection: item.id } })
        break
      case 'userBeatmap':
        navigate('/local', { state: { highlightBeatmap: item.id } })
        break
      case 'osuBeatmap':
        navigate('/collection', { state: { selectedBeatmap: item.id } })
        break
      case 'mapper':
        setGlobalSearch(`creator:"${item}"`)
        navigate('/collection')
        break
      case 'artist':
        setGlobalSearch(`artist:"${item}"`)
        navigate('/collection')
        break
      case 'tag':
        setGlobalSearch(`tag:"${item}"`)
        navigate('/collection')
        break
    }
    
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (!isExpanded) return

    const allResults = [
      ...searchResults.collections.map(item => ({ ...item, type: 'collection' })),
      ...searchResults.userBeatmaps.map(item => ({ ...item, type: 'userBeatmap' })),
      ...searchResults.osuBeatmaps.map(item => ({ ...item, type: 'osuBeatmap' })),
      ...searchResults.mappers.map(item => ({ name: item, type: 'mapper' })),
      ...searchResults.artists.map(item => ({ name: item, type: 'artist' })),
      ...searchResults.tags.map(item => ({ name: item, type: 'tag' }))
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => prev < allResults.length - 1 ? prev + 1 : prev)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          const item = allResults[selectedIndex]
          handleItemClick(item, item.type)
        }
        break
      case 'Escape':
        setIsExpanded(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const getTotalResults = () => {
    return Object.values(searchResults).reduce((total, arr) => total + arr.length, 0)
  }

  const renderResultSection = (title, items, type, icon, emptyMessage) => {
    if (items.length === 0) return null

    return (
      <div className="result-section">
        <div className="section-header">
          {icon}
          <span className="section-title">{title}</span>
          <span className="section-count">{items.length}</span>
        </div>
        <div className="section-items">
          {items.map((item, index) => {
            const globalIndex = getGlobalIndex(type, index)
            return (
              <button
                key={`${type}-${index}`}
                className={`result-item ${selectedIndex === globalIndex ? 'selected' : ''}`}
                onClick={() => handleItemClick(item, type)}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
              >
                {renderResultItem(item, type)}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const getGlobalIndex = (type, localIndex) => {
    let index = 0
    const types = ['collection', 'userBeatmap', 'osuBeatmap', 'mapper', 'artist', 'tag']
    const typeIndex = types.indexOf(type)
    
    for (let i = 0; i < typeIndex; i++) {
      const key = `${types[i]}s` === 'mappers' ? 'mappers' : 
                  `${types[i]}s` === 'artists' ? 'artists' :
                  `${types[i]}s` === 'tags' ? 'tags' :
                  `${types[i] === 'userBeatmap' ? 'userBeatmaps' : 
                    types[i] === 'osuBeatmap' ? 'osuBeatmaps' : 
                    `${types[i]}s`}`
      index += searchResults[key]?.length || 0
    }
    
    return index + localIndex
  }

  const renderResultItem = (item, type) => {
    switch (type) {
      case 'collection':
        return (
          <div className="result-content">
            <FaFolder className="result-icon" />
            <div className="result-text">
              <span className="result-title">{item.name}</span>
              <span className="result-subtitle">
                {item.beatmaps?.length || 0} beatmaps
                {item.description && ` • ${item.description}`}
              </span>
            </div>
          </div>
        )
      
      case 'userBeatmap':
      case 'osuBeatmap':
        return (
          <div className="result-content">
            <FaMusic className="result-icon" />
            <div className="result-text">
              <span className="result-title">{item.artist} - {item.title}</span>
              <span className="result-subtitle">
                by {item.creator}
                {item.bpm && ` • ${item.bpm} BPM`}
                {type === 'osuBeatmap' && ' • from osu!'}
              </span>
            </div>
            {type === 'osuBeatmap' && (
              <div className="result-actions">
                <button className="action-btn" title="Add to collection">
                  <FaHeart />
                </button>
                <button className="action-btn" title="Download">
                  <FaDownload />
                </button>
              </div>
            )}
          </div>
        )
      
      case 'mapper':
        return (
          <div className="result-content">
            <FaUser className="result-icon" />
            <div className="result-text">
              <span className="result-title">{item}</span>
              <span className="result-subtitle">Mapper</span>
            </div>
          </div>
        )
      
      case 'artist':
        return (
          <div className="result-content">
            <FaMusic className="result-icon" />
            <div className="result-text">
              <span className="result-title">{item}</span>
              <span className="result-subtitle">Artist</span>
            </div>
          </div>
        )
      
      case 'tag':
        return (
          <div className="result-content">
            <FaTag className="result-icon" />
            <div className="result-text">
              <span className="result-title">#{item}</span>
              <span className="result-subtitle">Tag</span>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={`osuverse-searchbar ${compact ? 'compact' : ''} ${isExpanded ? 'expanded' : ''}`} ref={resultsRef}>
      <div className="search-input-container">
        <div className="search-icon">
          <FaSearch />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search beatmaps, collections, mappers... (Ctrl+K)"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
        />
        
        {isLoading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {query && !isLoading && (
          <button 
            className="clear-button"
            onClick={handleClear}
            type="button"
          >
            <FaTimes />
          </button>
        )}

        {!query && !isExpanded && (
          <div className="search-hint">
            <span>Ctrl+K</span>
          </div>
        )}
      </div>

      {isExpanded && query.trim() && (
        <div className="search-results">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner large"></div>
              <span>Searching...</span>
            </div>
          ) : getTotalResults() > 0 ? (
            <div className="results-container">
              <div className="results-grid">
                <div className="results-left">
                  {renderResultSection(
                    'Your Collections', 
                    searchResults.collections, 
                    'collection',
                    <FaFolder />,
                    'No matching collections found'
                  )}
                  
                  {renderResultSection(
                    'Your Beatmaps', 
                    searchResults.userBeatmaps, 
                    'userBeatmap',
                    <FaMusic />,
                    'No matching beatmaps in your collection'
                  )}
                  
                  {renderResultSection(
                    'Mappers', 
                    searchResults.mappers, 
                    'mapper',
                    <FaUser />,
                    'No matching mappers found'
                  )}
                </div>
                
                <div className="results-right">
                  {renderResultSection(
                    'All osu! Beatmaps', 
                    searchResults.osuBeatmaps, 
                    'osuBeatmap',
                    <FaGlobe />,
                    'No osu! beatmaps found'
                  )}
                  
                  {renderResultSection(
                    'Artists', 
                    searchResults.artists, 
                    'artist',
                    <FaMusic />,
                    'No matching artists found'
                  )}
                  
                  {renderResultSection(
                    'Tags', 
                    searchResults.tags, 
                    'tag',
                    <FaTag />,
                    'No matching tags found'
                  )}
                </div>
              </div>
              
              <div className="search-footer">
                <div className="search-stats">
                  Found {getTotalResults()} results for "{query}"
                </div>
                <div className="search-tips">
                  <span>Use ↑↓ to navigate • Enter to select • Esc to close</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-content">
                <FaSearch className="no-results-icon" />
                <span className="no-results-text">No results found for "{query}"</span>
                <span className="no-results-hint">
                  Try different keywords or check spelling
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default OsuverseSearchbar
