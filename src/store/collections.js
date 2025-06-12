import { atom } from 'jotai'
import { atomWithReducer } from 'jotai/utils'

// Typy
// Collection: { id, name, parentId, beatmapsetIds: [], tags: [{ name, type, priority }], createdAt }
// Beatmap: { id, artist, title, creator, ... }
// Tag: { name, type: 'user' | 'auto', priority: number }

// Atom na beatmapy (słownik id → beatmap)
export const beatmapsAtom = atom({})

// Atom na wybraną kolekcję
export const selectedCollectionAtom = atom(null)

// Atom na wszystkie tagi (user/auto)
export const collectionTagsAtom = atom([])

// Reducer i atom kolekcji
const initialCollections = []

function collectionsReducer(state, action) {
  switch (action.type) {
    case 'addCollection':
      return [
        ...state,
        {
          id: action.id,
          name: action.name,
          parentId: action.parentId || null,
          beatmapsetIds: [],
          tags: [],
          createdAt: Date.now(),
        },
      ]
    case 'removeCollection':
      return state.filter(col => col.id !== action.id)
    case 'updateCollection':
      return state.map(col =>
        col.id === action.id ? { ...col, ...action.updates } : col
      )
    case 'addBeatmapToCollection':
      return state.map(col =>
        col.id === action.collectionId
          ? { ...col, beatmapsetIds: [...new Set([...col.beatmapsetIds, action.beatmapsetId])] }
          : col
      )
    case 'removeBeatmapFromCollection':
      return state.map(col =>
        col.id === action.collectionId
          ? { ...col, beatmapsetIds: col.beatmapsetIds.filter(id => id !== action.beatmapsetId) }
          : col
      )
    case 'addTagToCollection':
      return state.map(col =>
        col.id === action.collectionId
          ? { ...col, tags: [...col.tags, action.tag] }
          : col
      )
    case 'removeTagFromCollection':
      return state.map(col =>
        col.id === action.collectionId
          ? { ...col, tags: col.tags.filter(tag => tag.name !== action.tagName) }
          : col
      )
    case 'setTagPriority':
      return state.map(col =>
        col.id === action.collectionId
          ? {
              ...col,
              tags: col.tags.map(tag =>
                tag.name === action.tagName ? { ...tag, priority: action.priority } : tag
              ),
            }
          : col
      )
    case 'nestCollection':
      return state.map(col =>
        col.id === action.id ? { ...col, parentId: action.parentId } : col
      )
    default:
      return state
  }
}

export const collectionsAtom = atomWithReducer(initialCollections, collectionsReducer)
