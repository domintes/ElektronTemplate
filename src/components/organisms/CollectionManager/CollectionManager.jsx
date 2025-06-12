import { useState, useRef } from 'react'
import { useAtom } from 'jotai'
import { 
  FaFolder, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaTimes,
  FaSave,
  FaDownload,
  FaUpload,
  FaSearch,
  FaTag,
  FaMusic,
  FaSort,
  FaEye,
  FaCopy
} from 'react-icons/fa'
import { collectionsAtom } from '../../../store'
import TagInput from '../../TagInput/TagInput'
import './CollectionManager.scss'

const CollectionManager = ({ 
  isOpen = false, 
  onClose, 
  selectedBeatmaps = [],
  onCollectionSelect 
}) => {
  const [collections, setCollections] = useAtom(collectionsAtom)
  const [activeTab, setActiveTab] = useState('manage') // 'manage', 'create', 'import'
  const [editingCollection, setEditingCollection] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name', 'date', 'size'
  const [sortOrder, setSortOrder] = useState('asc')
  
  // New collection form
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    tags: [],
    isPrivate: false,
    color: '#8a2be2'
  })

  const fileInputRef = useRef(null)

  const handleCreateCollection = () => {
    if (!newCollection.name.trim()) return

    const collection = {
      id: Date.now().toString(),
      name: newCollection.name.trim(),
      description: newCollection.description.trim(),
      tags: newCollection.tags,
      beatmaps: selectedBeatmaps || [],
      isPrivate: newCollection.isPrivate,
      color: newCollection.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setCollections(prev => [...prev, collection])
    
    // Reset form
    setNewCollection({
      name: '',
      description: '',
      tags: [],
      isPrivate: false,
      color: '#8a2be2'
    })
    
    setActiveTab('manage')
  }

  const handleEditCollection = (collection) => {
    setEditingCollection({ ...collection })
  }

  const handleSaveEdit = () => {
    if (!editingCollection || !editingCollection.name.trim()) return

    setCollections(prev => 
      prev.map(col => 
        col.id === editingCollection.id 
          ? { 
              ...editingCollection, 
              updatedAt: new Date().toISOString() 
            }
          : col
      )
    )
    
    setEditingCollection(null)
  }

  const handleDeleteCollection = (collectionId) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      setCollections(prev => prev.filter(col => col.id !== collectionId))
    }
  }

  const handleDuplicateCollection = (collection) => {
    const duplicate = {
      ...collection,
      id: Date.now().toString(),
      name: `${collection.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setCollections(prev => [...prev, duplicate])
  }

  const handleExportCollection = (collection) => {
    const dataStr = JSON.stringify(collection, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${collection.name}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const handleImportCollection = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result)
        const collection = {
          ...imported,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        setCollections(prev => [...prev, collection])
        setActiveTab('manage')
      } catch (error) {
        alert('Error importing collection: Invalid file format')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    event.target.value = ''
  }

  const filteredCollections = collections
    .filter(collection => 
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.createdAt)
          bVal = new Date(b.createdAt)
          break
        case 'size':
          aVal = a.beatmaps?.length || 0
          bVal = b.beatmaps?.length || 0
          break
        default:
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
      }
      
      if (sortOrder === 'desc') {
        return aVal < bVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })

  if (!isOpen) return null

  return (
    <div className="collection-manager-overlay">
      <div className="collection-manager">
        <div className="manager-header">
          <h2>Collection Manager</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="manager-tabs">
          <button 
            className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <FaFolder />
            Manage Collections
          </button>
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <FaPlus />
            Create New
          </button>
          <button 
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <FaUpload />
            Import/Export
          </button>
        </div>

        <div className="manager-content">
          {activeTab === 'manage' && (
            <div className="manage-tab">
              <div className="manage-controls">
                <div className="search-section">
                  <div className="search-input-container">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search collections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>

                <div className="sort-section">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="date">Sort by Date</option>
                    <option value="size">Sort by Size</option>
                  </select>
                  <button 
                    className="sort-order-btn"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  >
                    <FaSort />
                    {sortOrder === 'asc' ? 'ASC' : 'DESC'}
                  </button>
                </div>
              </div>

              <div className="collections-grid">
                {filteredCollections.map(collection => (
                  <div key={collection.id} className="collection-card">
                    <div className="card-header">
                      <div 
                        className="collection-color" 
                        style={{ backgroundColor: collection.color }}
                      />
                      <h3 className="collection-name">
                        {editingCollection?.id === collection.id ? (
                          <input
                            type="text"
                            value={editingCollection.name}
                            onChange={(e) => setEditingCollection(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            className="edit-input"
                            autoFocus
                          />
                        ) : (
                          collection.name
                        )}
                      </h3>
                      <div className="card-actions">
                        {editingCollection?.id === collection.id ? (
                          <>
                            <button 
                              className="action-btn save-btn"
                              onClick={handleSaveEdit}
                            >
                              <FaSave />
                            </button>
                            <button 
                              className="action-btn cancel-btn"
                              onClick={() => setEditingCollection(null)}
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="action-btn view-btn"
                              onClick={() => onCollectionSelect?.(collection)}
                              title="View collection"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => handleEditCollection(collection)}
                              title="Edit collection"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="action-btn copy-btn"
                              onClick={() => handleDuplicateCollection(collection)}
                              title="Duplicate collection"
                            >
                              <FaCopy />
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteCollection(collection.id)}
                              title="Delete collection"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="card-content">
                      {editingCollection?.id === collection.id ? (
                        <textarea
                          value={editingCollection.description}
                          onChange={(e) => setEditingCollection(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          className="edit-textarea"
                          placeholder="Collection description..."
                        />
                      ) : (
                        <p className="collection-description">
                          {collection.description || 'No description'}
                        </p>
                      )}

                      <div className="collection-stats">
                        <span className="stat">
                          <FaMusic />
                          {collection.beatmaps?.length || 0} beatmaps
                        </span>
                        <span className="stat">
                          <FaTag />
                          {collection.tags?.length || 0} tags
                        </span>
                      </div>

                      {collection.tags && collection.tags.length > 0 && (
                        <div className="collection-tags">
                          {collection.tags.map((tag, index) => (
                            <span key={index} className="tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card-footer">
                      <span className="creation-date">
                        Created {new Date(collection.createdAt).toLocaleDateString()}
                      </span>
                      <button 
                        className="export-btn"
                        onClick={() => handleExportCollection(collection)}
                        title="Export collection"
                      >
                        <FaDownload />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCollections.length === 0 && (
                <div className="empty-state">
                  <FaFolder className="empty-icon" />
                  <h3>No collections found</h3>
                  <p>
                    {searchQuery 
                      ? 'Try adjusting your search criteria'
                      : 'Create your first collection to get started'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="create-tab">
              <div className="create-form">
                <div className="form-group">
                  <label>Collection Name *</label>
                  <input
                    type="text"
                    value={newCollection.name}
                    onChange={(e) => setNewCollection(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    placeholder="Enter collection name..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newCollection.description}
                    onChange={(e) => setNewCollection(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Describe your collection..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <TagInput
                    tags={newCollection.tags}
                    onTagsChange={(tags) => setNewCollection(prev => ({
                      ...prev,
                      tags
                    }))}
                    placeholder="Add tags..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="color"
                      value={newCollection.color}
                      onChange={(e) => setNewCollection(prev => ({
                        ...prev,
                        color: e.target.value
                      }))}
                      className="color-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newCollection.isPrivate}
                        onChange={(e) => setNewCollection(prev => ({
                          ...prev,
                          isPrivate: e.target.checked
                        }))}
                      />
                      Private collection
                    </label>
                  </div>
                </div>

                {selectedBeatmaps && selectedBeatmaps.length > 0 && (
                  <div className="selected-beatmaps-info">
                    <FaMusic />
                    {selectedBeatmaps.length} beatmaps will be added to this collection
                  </div>
                )}

                <div className="form-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={handleCreateCollection}
                    disabled={!newCollection.name.trim()}
                  >
                    <FaPlus />
                    Create Collection
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('manage')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-tab">
              <div className="import-section">
                <h3>Import Collection</h3>
                <p>Import a collection from a JSON file</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportCollection}
                  style={{ display: 'none' }}
                />
                
                <button 
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaUpload />
                  Choose File
                </button>
              </div>

              <div className="export-section">
                <h3>Export All Collections</h3>
                <p>Export all your collections as a single JSON file</p>
                
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const dataStr = JSON.stringify(collections, null, 2)
                    const dataBlob = new Blob([dataStr], { type: 'application/json' })
                    const url = URL.createObjectURL(dataBlob)
                    
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'osudeit-collections.json'
                    link.click()
                    
                    URL.revokeObjectURL(url)
                  }}
                  disabled={collections.length === 0}
                >
                  <FaDownload />
                  Export All Collections
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollectionManager
