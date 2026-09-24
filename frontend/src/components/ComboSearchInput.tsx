import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface ComboSearchInputProps {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

export const ComboSearchInput: React.FC<ComboSearchInputProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Type or select…'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on typed query
  const filteredOptions = useMemo(() => {
    if (!value || value.trim() === '') {
      return options;
    }
    const q = value.trim().toLowerCase();
    const matches = options.filter(opt => opt.toLowerCase().includes(q));
    // If no exact substring matches, still show the options so user can switch
    return matches.length > 0 ? matches : options;
  }, [options, value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      setIsOpen(true);
    }
  };

  const handleSelectOption = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
    inputRef.current?.focus();
  };

  return (
    <div className="form-field" ref={containerRef}>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>

      <div className="combo-input-wrapper">
        <input
          ref={inputRef}
          id={id}
          list={`${id}-datalist`}
          type="text"
          className="form-input"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />

        {/* Native datalist for standard browser suggestions */}
        <datalist id={`${id}-datalist`}>
          {options.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>

        <div className="combo-input-actions">
          {value && (
            <button
              type="button"
              className="combo-btn-clear"
              onClick={handleClear}
              aria-label="Clear input"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="button"
            className="combo-btn-toggle"
            onClick={handleToggle}
            aria-label="Toggle options list"
            title="Show available options"
          >
            <ChevronDown
              size={16}
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s'
              }}
            />
          </button>
        </div>

        {/* Custom styled dropdown menu for fast, beautiful selection */}
        {isOpen && (
          <ul className="combo-dropdown-menu" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value.trim().toLowerCase() === opt.toLowerCase();
                return (
                  <li
                    key={opt}
                    role="option"
                    aria-selected={isSelected}
                    className={`combo-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(opt)}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check size={14} style={{ color: '#22c55e' }} />}
                  </li>
                );
              })
            ) : (
              <li className="combo-dropdown-empty">No predefined matches. Custom search active.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ComboSearchInput;
