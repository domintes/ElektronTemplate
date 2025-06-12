import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import './tagInput.scss';

export default function TagInput({ onTagsChange, initialTags = [], placeholder = "Wpisz tag i naciśnij Enter", suggestions = [] }) {
    const { register, handleSubmit, reset, watch } = useForm();
    const [tags, setTags] = useState(initialTags);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const tagInput = watch("tagName", "");

    useEffect(() => {
        setTags(initialTags);
    }, [initialTags]);

    const addTag = (data) => {
        if (!data.tagName.trim()) return;
        if (tags.includes(data.tagName.trim())) return;

        const newTags = [...tags, data.tagName.trim()];
        setTags(newTags);
        onTagsChange(newTags);
        reset();
        setShowSuggestions(false);
    };

    const removeTag = (tagToRemove) => {
        const updatedTags = tags.filter(tag => tag !== tagToRemove);
        setTags(updatedTags);
        onTagsChange(updatedTags);
    };

    const handleSuggestionClick = (suggestion) => {
        if (!tags.includes(suggestion.name)) {
            const newTags = [...tags, suggestion.name];
            setTags(newTags);
            onTagsChange(newTags);
        }
        reset();
        setShowSuggestions(false);
    };

    const filteredSuggestions = tagInput
        ? suggestions.filter(s => 
            s.name.toLowerCase().includes(tagInput.toLowerCase()) && 
            !tags.includes(s.name))
        : [];

    return (
        <div className="tag-input-container">
            <ul className="tag-list">
                {tags.map((tag, index) => {
                    const suggestionItem = suggestions.find(s => s.name === tag);
                    const count = suggestionItem ? ` (${suggestionItem.count})` : '';
                    return (
                        <li key={index} className="tag">
                            {tag}{count}
                            <button 
                                type="button" 
                                className="remove-tag" 
                                onClick={() => removeTag(tag)}
                            >
                                ✕
                            </button>
                        </li>
                    );
                })}
            </ul>

            <form onSubmit={handleSubmit(addTag)} className="tag-form">
                <div className="tag-input-wrapper">
                    <input
                        {...register("tagName")}
                        type="text"
                        className="tag-input"
                        placeholder={placeholder}
                        autoComplete="off"
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSubmit(addTag)();
                            }
                        }}
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {filteredSuggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="suggestion-item"
                                >
                                    {suggestion.name} ({suggestion.count})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button type="submit" className="add-tag-btn">+ Add tag</button>
            </form>
        </div>
    );
}
