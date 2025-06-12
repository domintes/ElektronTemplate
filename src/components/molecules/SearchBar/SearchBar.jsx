import { useState, useEffect, useCallback } from 'react'
import { FaSearch, FaTimes } from 'react-icons/fa'
import './SearchBar.scss'

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

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search...", 
  loading = false,
  suggestions = [],
  showSuggestions = false 
}) => {
  const [query, setQuery] = useState('')
  const [showSuggestionsList, setShowSuggestionsList] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setSelectedSuggestion(-1)
    
    if (showSuggestions && value.trim()) {
      setShowSuggestionsList(true)
    } else {
      setShowSuggestionsList(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setShowSuggestionsList(false)
    if (onSearch) {
      onSearch('')
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    setShowSuggestionsList(false)
    if (onSearch) {
      onSearch(suggestion)
    }
  }

  const handleKeyDown = (e) => {
    if (!showSuggestionsList || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestion >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestion])
        }
        break
      case 'Escape':
        setShowSuggestionsList(false)
        setSelectedSuggestion(-1)
        break
    }
  }

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <div className="search-icon">
          <FaSearch />
        </div>
        
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (showSuggestions && query.trim()) {
              setShowSuggestionsList(true)
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow clicks
            setTimeout(() => setShowSuggestionsList(false), 200)
          }}
        />
        
        {loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {query && !loading && (
          <button 
            className="clear-button"
            onClick={handleClear}
            type="button"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {showSuggestionsList && filteredSuggestions.length > 0 && (
        <div className="suggestions-list">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              className={`suggestion-item ${index === selectedSuggestion ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              type="button"
            >
              <FaSearch className="suggestion-icon" />
              <span className="suggestion-text">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
