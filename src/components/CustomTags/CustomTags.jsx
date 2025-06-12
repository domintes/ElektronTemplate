import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { filteredBeatmapsAtom } from '../../store';
import './customTags.scss';

export default function CustomTags({ items, selectedTags = [], onTagToggle }) {
    const [uniqueTags, setUniqueTags] = useState([]);
    const [tagCounts, setTagCounts] = useState({});

    useEffect(() => {
        // Generate unique list of tags and their counts
        const counts = {};
        const uniqueSet = new Set();

        items.forEach(item => {
            if (item.name) {
                uniqueSet.add(item.name);
                counts[item.name] = (counts[item.name] || 0) + 1;
            }
        });

        setUniqueTags(Array.from(uniqueSet));
        setTagCounts(counts);
    }, [items]);

    const handleTagClick = (tag) => {
        if (onTagToggle && tagCounts[tag] > 0) {
            onTagToggle(tag);
        }
    };

    return (
        <div className="customtags-container">
            <div className="tags-list">
                {uniqueTags.map((tag, index) => {
                    const count = tagCounts[tag] || 0;
                    const isActive = selectedTags.includes(tag);
                    const displayName = `${tag} (${count})`;

                    return (
                        <button
                            key={index}
                            className={`tag-button ${
                                isActive ? 'tag-button-active' : ''
                            } ${count === 0 ? 'tag-button-disabled' : ''}`}
                            onClick={() => handleTagClick(tag)}
                            disabled={count === 0}
                            title={displayName}
                        >
                            {displayName}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}