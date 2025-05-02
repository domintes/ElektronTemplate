import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { filteredBeatmapsAtom } from '../../store';
import './customTags.scss';

export default function CustomTags({ items, selectedTags = [], onTagToggle }) {
    const [uniqueTags, setUniqueTags] = useState([]);

    useEffect(() => {
        // Generate unique list of tags from provided items
        const allTags = Array.from(new Set(items.map(item => item.name)));
        setUniqueTags(allTags);
    }, [items]);

    const handleTagClick = (tag) => {
        if (onTagToggle) {
            onTagToggle(tag);
        }
    };

    return (
        <div className="customtags-container">
            <div className="tags-list">
                {uniqueTags.map((tag, index) => {
                    // Count items with this tag
                    const tagCount = items.filter(item => item.name === tag).length;

                    return (
                        <button
                            key={index}
                            className={`tag-button ${
                                selectedTags.includes(tag) ? 'tag-button-active' : ''
                            } ${tagCount === 0 ? 'tag-button-disabled' : ''}`}
                            onClick={() => handleTagClick(tag)}
                            disabled={tagCount === 0}
                        >
                            {tag} ({tagCount})
                        </button>
                    );
                })}
            </div>
        </div>
    );
}