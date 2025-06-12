import { useState } from 'react'
import { useAtom } from 'jotai'
import { 
  FaFilter, 
  FaTimes, 
  FaChevronDown, 
  FaChevronUp,
  FaCalendar,
  FaClock,
  FaMusic,
  FaSort
} from 'react-icons/fa'
import './FilterPanel.scss'

const FilterPanel = ({ onFiltersChange, isVisible = true, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    difficulty: { min: 0, max: 10 },
    bpm: { min: 60, max: 300 },
    length: { min: 30, max: 600 }, // in seconds
    dateRange: { start: '', end: '' },
    gameMode: 'all', // osu, taiko, catch, mania, all
    status: 'all', // ranked, loved, qualified, pending, all
    genre: 'all',
    language: 'all',
    tags: [],
    hasVideo: false,
    hasStoryboard: false
  })

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const handleRangeChange = (category, type, value) => {
    const newRange = { ...filters[category], [type]: parseFloat(value) }
    handleFilterChange(category, newRange)
  }

  const clearFilters = () => {
    const defaultFilters = {
      difficulty: { min: 0, max: 10 },
      bpm: { min: 60, max: 300 },
      length: { min: 30, max: 600 },
      dateRange: { start: '', end: '' },
      gameMode: 'all',
      status: 'all',
      genre: 'all',
      language: 'all',
      tags: [],
      hasVideo: false,
      hasStoryboard: false
    }
    setFilters(defaultFilters)
    onFiltersChange?.(defaultFilters)
  }

  const hasActiveFilters = () => {
    return filters.gameMode !== 'all' ||
           filters.status !== 'all' ||
           filters.genre !== 'all' ||
           filters.language !== 'all' ||
           filters.tags.length > 0 ||
           filters.hasVideo ||
           filters.hasStoryboard ||
           filters.dateRange.start ||
           filters.dateRange.end ||
           filters.difficulty.min > 0 ||
           filters.difficulty.max < 10 ||
           filters.bpm.min > 60 ||
           filters.bpm.max < 300 ||
           filters.length.min > 30 ||
           filters.length.max < 600
  }

  if (!isVisible) return null

  return (
    <div className={`filter-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="filter-header">
        <div className="filter-title">
          <FaFilter className="filter-icon" />
          <span>Filters</span>
          {hasActiveFilters() && (
            <span className="active-indicator">{Object.keys(filters).filter(key => {
              const filter = filters[key]
              if (typeof filter === 'object' && !Array.isArray(filter)) {
                return JSON.stringify(filter) !== JSON.stringify({min: 0, max: 10}) &&
                       JSON.stringify(filter) !== JSON.stringify({min: 60, max: 300}) &&
                       JSON.stringify(filter) !== JSON.stringify({min: 30, max: 600}) &&
                       JSON.stringify(filter) !== JSON.stringify({start: '', end: ''})
              }
              return filter !== 'all' && filter !== false && filter.length > 0
            }).length}</span>
          )}
        </div>
        
        <div className="filter-actions">
          {hasActiveFilters() && (
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
              title="Clear all filters"
            >
              <FaTimes />
            </button>
          )}
          
          <button 
            className="toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {onToggle && (
            <button 
              className="close-btn"
              onClick={onToggle}
              title="Hide filters"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="filter-content">
          {/* Game Mode Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <FaMusic className="label-icon" />
              Game Mode
            </label>
            <select 
              className="filter-select"
              value={filters.gameMode}
              onChange={(e) => handleFilterChange('gameMode', e.target.value)}
            >
              <option value="all">All Modes</option>
              <option value="osu">osu! Standard</option>
              <option value="taiko">osu!taiko</option>
              <option value="catch">osu!catch</option>
              <option value="mania">osu!mania</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <FaSort className="label-icon" />
              Status
            </label>
            <select 
              className="filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="ranked">Ranked</option>
              <option value="loved">Loved</option>
              <option value="qualified">Qualified</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Difficulty Range */}
          <div className="filter-group">
            <label className="filter-label">Difficulty (Stars)</label>
            <div className="range-inputs">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={filters.difficulty.min}
                onChange={(e) => handleRangeChange('difficulty', 'min', e.target.value)}
                className="range-input"
                placeholder="Min"
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={filters.difficulty.max}
                onChange={(e) => handleRangeChange('difficulty', 'max', e.target.value)}
                className="range-input"
                placeholder="Max"
              />
            </div>
          </div>

          {/* BPM Range */}
          <div className="filter-group">
            <label className="filter-label">
              <FaClock className="label-icon" />
              BPM
            </label>
            <div className="range-inputs">
              <input
                type="number"
                min="60"
                max="300"
                value={filters.bpm.min}
                onChange={(e) => handleRangeChange('bpm', 'min', e.target.value)}
                className="range-input"
                placeholder="Min"
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                min="60"
                max="300"
                value={filters.bpm.max}
                onChange={(e) => handleRangeChange('bpm', 'max', e.target.value)}
                className="range-input"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Length Range */}
          <div className="filter-group">
            <label className="filter-label">Length (seconds)</label>
            <div className="range-inputs">
              <input
                type="number"
                min="30"
                max="600"
                value={filters.length.min}
                onChange={(e) => handleRangeChange('length', 'min', e.target.value)}
                className="range-input"
                placeholder="Min"
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                min="30"
                max="600"
                value={filters.length.max}
                onChange={(e) => handleRangeChange('length', 'max', e.target.value)}
                className="range-input"
                placeholder="Max"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="filter-group">
            <label className="filter-label">
              <FaCalendar className="label-icon" />
              Date Range
            </label>
            <div className="range-inputs">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="range-input"
              />
              <span className="range-separator">to</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="range-input"
              />
            </div>
          </div>

          {/* Genre and Language */}
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Genre</label>
              <select 
                className="filter-select"
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
              >
                <option value="all">All Genres</option>
                <option value="unspecified">Unspecified</option>
                <option value="video-game">Video Game</option>
                <option value="anime">Anime</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="other">Other</option>
                <option value="novelty">Novelty</option>
                <option value="hip-hop">Hip Hop</option>
                <option value="electronic">Electronic</option>
                <option value="metal">Metal</option>
                <option value="classical">Classical</option>
                <option value="folk">Folk</option>
                <option value="jazz">Jazz</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Language</label>
              <select 
                className="filter-select"
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
              >
                <option value="all">All Languages</option>
                <option value="unspecified">Unspecified</option>
                <option value="english">English</option>
                <option value="japanese">Japanese</option>
                <option value="chinese">Chinese</option>
                <option value="instrumental">Instrumental</option>
                <option value="korean">Korean</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="swedish">Swedish</option>
                <option value="spanish">Spanish</option>
                <option value="italian">Italian</option>
                <option value="russian">Russian</option>
                <option value="polish">Polish</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Special Features */}
          <div className="filter-group">
            <label className="filter-label">Special Features</label>
            <div className="checkbox-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filters.hasVideo}
                  onChange={(e) => handleFilterChange('hasVideo', e.target.checked)}
                />
                <span className="checkbox-label">Has Video</span>
              </label>
              
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filters.hasStoryboard}
                  onChange={(e) => handleFilterChange('hasStoryboard', e.target.checked)}
                />
                <span className="checkbox-label">Has Storyboard</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterPanel
