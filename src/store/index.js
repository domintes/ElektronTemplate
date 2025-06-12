import { atom } from 'jotai';

// Atoms for favorite artists and mappers per profile
export const favoriteArtistsAtom = atom({});
export const favoriteMappersAtom = atom({});

// Atom for current profile
export const activeProfileAtom = atom('');

// Derived atoms that get favorites for current profile
export const currentProfileFavoriteArtistsAtom = atom(
  (get) => {
    const profile = get(activeProfileAtom);
    const allFavorites = get(favoriteArtistsAtom);
    return allFavorites[profile] || [];
  }
);

export const currentProfileFavoriteMappersAtom = atom(
  (get) => {
    const profile = get(activeProfileAtom);
    const allFavorites = get(favoriteMappersAtom);
    return allFavorites[profile] || [];
  }
);

// Filtered beatmaps atom
export const filteredBeatmapsAtom = atom([]);

// Helper functions to update favorites
export const addFavoriteArtist = (profile, artist, setFavoriteArtists) => {
  setFavoriteArtists((prev) => ({
    ...prev,
    [profile]: [...(prev[profile] || []), artist]
  }));
};

export const removeFavoriteArtist = (profile, artist, setFavoriteArtists) => {
  setFavoriteArtists((prev) => ({
    ...prev,
    [profile]: (prev[profile] || []).filter(a => a !== artist)
  }));
};

export const addFavoriteMapper = (profile, mapper, setFavoriteMappers) => {
  setFavoriteMappers((prev) => ({
    ...prev,
    [profile]: [...(prev[profile] || []), mapper]
  }));
};

export const removeFavoriteMapper = (profile, mapper, setFavoriteMappers) => {
  setFavoriteMappers((prev) => ({
    ...prev,
    [profile]: (prev[profile] || []).filter(m => m !== mapper)
  }));
};

// ===== New osudeit Atoms =====

// Collections management
export const collectionsAtom = atom([]);
export const currentCollectionAtom = atom(null);

// Search and filtering
export const searchAtom = atom('');
export const filtersAtom = atom({
  difficulty: { min: 0, max: 10 },
  bpm: { min: 0, max: 300 },
  tags: [],
  status: [],
  duration: { min: 0, max: 600 }
});

// Beatmap selection and management
export const selectedBeatmapsAtom = atom([]);
export const beatmapsAtom = atom([]);

// API state management
export const apiStateAtom = atom({
  authenticated: false,
  loading: false,
  error: null,
  beatmaps: [],
  totalResults: 0,
  currentPage: 1
});

// User preferences
export const userPreferencesAtom = atom({
  theme: 'system',
  language: 'en',
  autoSave: true,
  startMinimized: false,
  osuConnected: false,
  osuUsername: '',
  downloadPath: '',
  autoDownload: false,
  syncCollections: false,
  defaultCollectionBehavior: 'ask',
  autoGenerateTags: true,
  duplicateDetection: true,
  tableDensity: 'normal',
  itemsPerPage: 50,
  showBeatmapPreviews: true,
  enableAnimations: true,
  compactSidebar: false,
  cacheSize: 1000,
  apiTimeout: 30,
  enableDebugMode: false
});

// Tag filters and search
export const tagFiltersAtom = atom([]);
export const activeTagsAtom = atom([]);

// Derived atoms for computed values
export const filteredCollectionsAtom = atom((get) => {
  const collections = get(collectionsAtom);
  const searchQuery = get(searchAtom);
  
  if (!searchQuery.trim()) return collections;
  
  return collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
});

export const totalBeatmapsAtom = atom((get) => {
  const collections = get(collectionsAtom);
  return collections.reduce((total, collection) => 
    total + (collection.beatmaps?.length || 0), 0
  );
});

export const currentCollectionBeatmapsAtom = atom((get) => {
  const currentCollection = get(currentCollectionAtom);
  if (!currentCollection) return [];
  return currentCollection.beatmaps || [];
});

// Collection management helper functions
export const addBeatmapToCollection = (beatmap, collectionId, setCollections) => {
  setCollections((prev) => 
    prev.map(collection => 
      collection.id === collectionId
        ? {
            ...collection,
            beatmaps: [...(collection.beatmaps || []), beatmap],
            updatedAt: new Date().toISOString()
          }
        : collection
    )
  );
};

export const removeBeatmapFromCollection = (beatmapId, collectionId, setCollections) => {
  setCollections((prev) => 
    prev.map(collection => 
      collection.id === collectionId
        ? {
            ...collection,
            beatmaps: (collection.beatmaps || []).filter(b => b.id !== beatmapId),
            updatedAt: new Date().toISOString()
          }
        : collection
    )
  );
};

export const createCollection = (name, parentId = null, setCollections) => {
  const newCollection = {
    id: Date.now().toString(),
    name,
    parentId,
    beatmaps: [],
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  setCollections((prev) => [...prev, newCollection]);
  return newCollection;
};

export const deleteCollection = (collectionId, setCollections) => {
  setCollections((prev) => 
    prev.filter(collection => 
      collection.id !== collectionId && collection.parentId !== collectionId
    )
  );
};