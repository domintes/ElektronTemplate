import { useAtom } from 'jotai';
import { 
  favoriteArtistsAtom, 
  favoriteMappersAtom, 
  activeProfileAtom,
  currentProfileFavoriteArtistsAtom,
  currentProfileFavoriteMappersAtom,
  addFavoriteArtist,
  removeFavoriteArtist,
  addFavoriteMapper,
  removeFavoriteMapper
} from '../../store';
import CustomTags from '../CustomTags/CustomTags';
import TagInput from '../TagInput/TagInput';
import './favoriteSection.scss';

export default function FavoriteSection({ beatmaps, onFilter }) {
  const [favoriteArtists, setFavoriteArtists] = useAtom(favoriteArtistsAtom);
  const [favoriteMappers, setFavoriteMappers] = useAtom(favoriteMappersAtom);
  const [activeProfile] = useAtom(activeProfileAtom);
  const [currentProfileArtists] = useAtom(currentProfileFavoriteArtistsAtom);
  const [currentProfileMappers] = useAtom(currentProfileFavoriteMappersAtom);

  const handleArtistTagsChange = (tags) => {
    // Add new artists
    tags.forEach(tag => {
      if (!currentProfileArtists.includes(tag)) {
        addFavoriteArtist(activeProfile, tag, setFavoriteArtists);
      }
    });
    // Remove removed artists
    currentProfileArtists.forEach(artist => {
      if (!tags.includes(artist)) {
        removeFavoriteArtist(activeProfile, artist, setFavoriteArtists);
      }
    });
    updateFilters(tags, currentProfileMappers);
  };

  const handleMapperTagsChange = (tags) => {
    // Add new mappers
    tags.forEach(tag => {
      if (!currentProfileMappers.includes(tag)) {
        addFavoriteMapper(activeProfile, tag, setFavoriteMappers);
      }
    });
    // Remove removed mappers
    currentProfileMappers.forEach(mapper => {
      if (!tags.includes(mapper)) {
        removeFavoriteMapper(activeProfile, mapper, setFavoriteMappers);
      }
    });
    updateFilters(currentProfileArtists, tags);
  };

  const handleArtistTagToggle = (tag) => {
    const newTags = currentProfileArtists.includes(tag)
      ? currentProfileArtists.filter(t => t !== tag)
      : [...currentProfileArtists, tag];
    handleArtistTagsChange(newTags);
  };

  const handleMapperTagToggle = (tag) => {
    const newTags = currentProfileMappers.includes(tag)
      ? currentProfileMappers.filter(t => t !== tag)
      : [...currentProfileMappers, tag];
    handleMapperTagsChange(newTags);
  };

  const updateFilters = (artists, mappers) => {
    const filtered = beatmaps.filter(beatmap => {
      const artistMatch = artists.length === 0 || artists.includes(beatmap.artist);
      const mapperMatch = mappers.length === 0 || mappers.includes(beatmap.creator);
      return artistMatch && mapperMatch;
    });
    onFilter(filtered);
  };

  const countItems = (type) => {
    const counts = {};
    beatmaps.forEach(beatmap => {
      const key = type === 'artist' ? beatmap.artist : beatmap.creator;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  const mapBeatmapsToTagItems = (type) => {
    const counts = countItems(type);
    // Only include items that appear more than once
    const itemsWithMultipleMaps = Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([name, count]) => ({
        name,
        count,
        tags: [name]
      }));
    return itemsWithMultipleMaps;
  };

  return (
    <div className="favorite-section">
      <div className="favorite-mappers">
        <h3>Favourite Mappers</h3>
        <CustomTags 
          items={mapBeatmapsToTagItems('mapper')}
          selectedTags={currentProfileMappers}
          onTagToggle={handleMapperTagToggle}
        />
        <TagInput 
          onTagsChange={handleMapperTagsChange}
          initialTags={currentProfileMappers}
          placeholder="Add mapper to favorites..."
          suggestions={mapBeatmapsToTagItems('mapper')}
        />
      </div>

      <div className="favorite-artists">
        <h3>Favourite Artists</h3>
        <CustomTags 
          items={mapBeatmapsToTagItems('artist')}
          selectedTags={currentProfileArtists}
          onTagToggle={handleArtistTagToggle}
        />
        <TagInput 
          onTagsChange={handleArtistTagsChange}
          initialTags={currentProfileArtists}
          placeholder="Add artist to favorites..."
          suggestions={mapBeatmapsToTagItems('artist')}
        />
      </div>
    </div>
  );
}