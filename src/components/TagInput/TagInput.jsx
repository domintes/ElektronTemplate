import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import './tagInput.scss';

export default function TagInput({ onTagsChange, initialTags = [], placeholder = "Wpisz tag i naciśnij Enter" }) {
    const { register, handleSubmit, reset } = useForm();
    const [tags, setTags] = useState(initialTags);

    useEffect(() => {
        setTags(initialTags);
    }, [initialTags]);

    const addTag = (data) => {
        if (!data.tagName.trim()) return; // Nie dodawaj pustych tagów
        if (tags.includes(data.tagName.trim())) return; // Nie dodawaj duplikatów

        const newTags = [...tags, data.tagName.trim()];
        setTags(newTags);
        onTagsChange(newTags); // Przekazanie tagów do komponentu nadrzędnego
        reset(); // Reset inputa
    };

    const removeTag = (tagToRemove) => {
        const updatedTags = tags.filter(tag => tag !== tagToRemove);
        setTags(updatedTags);
        onTagsChange(updatedTags);
    };

    return (
        <div className="tag-input-container">
            <ul className="tag-list">
                {tags.map((tag, index) => (
                    <li key={index} className="tag">
                        {tag} <button type="button" className="remove-tag" onClick={() => removeTag(tag)}>✕</button>
                    </li>
                ))}
            </ul>

            <form onSubmit={handleSubmit(addTag)} className="tag-form">
                <input
                    {...register("tagName")}
                    type="text"
                    className="tag-input"
                    placeholder={placeholder}
                    autoComplete="off"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault(); // Zapobiega wysłaniu formularza domyślnie
                            handleSubmit(addTag)();
                        }
                    }}
                />
                <button type="submit" className="add-tag-btn">+ Add tag</button>
            </form>
        </div>
    );
}
