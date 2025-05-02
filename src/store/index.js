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