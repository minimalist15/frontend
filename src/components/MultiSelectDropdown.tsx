import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface Option {
  label: string;
  value: string;
  description?: string;
  count?: number;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selected: Option[];
  onChange: (selected: Option[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  label,
  disabled = false,
  searchable = true,
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    if (selected.some(sel => sel.value === option.value)) {
      onChange(selected.filter(sel => sel.value !== option.value));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleRemove = (option: Option) => {
    onChange(selected.filter(sel => sel.value !== option.value));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="block text-sm text-gray-300 mb-1">{label}</label>}
      <button
        type="button"
        className={`w-full flex items-center justify-between px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-400 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        <span className="truncate text-left">
          {selected.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selected.map(sel => sel.label).join(', ')
          )}
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-gray-800 border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
          {searchable && (
            <div className="flex items-center px-3 py-2 border-b border-gray-700 bg-gray-800 sticky top-0">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-white text-sm focus:outline-none"
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="text-gray-400 text-sm px-3 py-2">No options</div>
          ) : (
            filteredOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between text-sm transition-colors ${
                  selected.some(sel => sel.value === option.value)
                    ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <span>
                  {option.label}
                  {option.description && (
                    <span className="block text-xs text-gray-400">{option.description}</span>
                  )}
                </span>
                {option.count !== undefined && (
                  <span className="ml-2 text-xs text-gray-400">{option.count}</span>
                )}
                {selected.some(sel => sel.value === option.value) && (
                  <X size={14} className="ml-2 text-blue-400" />
                )}
              </button>
            ))
          )}
        </div>
      )}
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map(option => (
            <span key={option.value} className="flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
              <span>{option.label}</span>
              <button onClick={() => handleRemove(option)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export type { Option };
export default MultiSelectDropdown; 