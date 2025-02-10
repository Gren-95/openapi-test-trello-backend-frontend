import { useState, useEffect, useRef } from 'react';

function EditableText({ 
  initialValue, 
  onSave, 
  className = '', 
  inputClassName = '',
  tag: Tag = 'div'
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (value.trim() !== initialValue) {
      await onSave(value.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className={className}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className={inputClassName}
        />
      </form>
    );
  }

  return (
    <div 
      className={`editable-container ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tag className="editable-text">
        {value}
      </Tag>
      {isHovered && (
        <button 
          className="edit-button"
          onClick={() => setIsEditing(true)}
          title="Edit"
        >
          ✎
        </button>
      )}
    </div>
  );
}

export default EditableText; 