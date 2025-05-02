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
  removeFavoriteMapper,
  filteredBeatmapsAtom
} from '../../store';
import CustomTags from '../CustomTags/CustomTags';
import TagInput from '../TagInput/TagInput';
import './favoriteSection.scss';

export default function FavoriteSection({ beatmaps }) {
  const [favoriteArtists, setFavoriteArtists] = useAtom(favoriteArtistsAtom);
  const [favoriteMappers, setFavoriteMappers] = useAtom(favoriteMappersAtom);
  const [activeProfile] = useAtom(activeProfileAtom);
  const [currentProfileArtists] = useAtom(currentProfileFavoriteArtistsAtom);
  const [currentProfileMappers] = useAtom(currentProfileFavoriteMappersAtom);
  const [, setFilteredBeatmaps] = useAtom(filteredBeatmapsAtom);

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
    filterBeatmaps(tags, currentProfileMappers);
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
    filterBeatmaps(currentProfileArtists, tags);
  };

  const filterBeatmaps = (artists, mappers) => {
    const filtered = beatmaps.filter(beatmap => {
      const artistMatch = artists.length === 0 || artists.includes(beatmap.artist);
      const mapperMatch = mappers.length === 0 || mappers.includes(beatmap.creator);
      return artistMatch && mapperMatch;
    });
    setFilteredBeatmaps(filtered);
  };

  const mapBeatmapsToTagItems = (type) => {
    return beatmaps.map(beatmap => ({
      name: type === 'artist' ? beatmap.artist : beatmap.creator,
      tags: [type === 'artist' ? beatmap.artist : beatmap.creator]
    }));
  };

  return (
    <div className="favorite-section">
      <div className="favorite-mappers">
        <h3>Favourite Mappers</h3>
        <CustomTags 
          items={mapBeatmapsToTagItems('mapper')}
          selectedTags={currentProfileMappers}
        />
        <TagInput 
          onTagsChange={handleMapperTagsChange}
          initialTags={currentProfileMappers}
          placeholder="Add mapper to favorites..."
        />
      </div>

      <div className="favorite-artists">
        <h3>Favourite Artists</h3>
        <CustomTags 
          items={mapBeatmapsToTagItems('artist')}
          selectedTags={currentProfileArtists}
        />
        <TagInput 
          onTagsChange={handleArtistTagsChange}
          initialTags={currentProfileArtists}
          placeholder="Add artist to favorites..."
        />
      </div>
    </div>
  );
}