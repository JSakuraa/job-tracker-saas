'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './CompanyAutocomplete.module.css';

interface CompanySuggestion {
  id: string;
  name: string;
  rank: number | null;
}

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (company: CompanySuggestion) => void;
  onCreateNew: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export function CompanyAutocomplete({
  value,
  onChange,
  onSelect,
  onCreateNew,
  placeholder = 'Search or enter company name',
  disabled = false,
  label = 'Company',
  required = false,
}: CompanyAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useRef(`company-autocomplete-${Math.random().toString(36).slice(2)}`);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.data ?? []);
        setIsOpen(true);
      }
    } catch {
      // silently fail — user can still type a new company name
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function handleSelect(company: CompanySuggestion) {
    onSelect(company);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && e.key !== 'Enter') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      } else if (value.trim()) {
        onCreateNew(value.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  function handleBlur() {
    // Slight delay so click on suggestion fires before blur closes dropdown
    setTimeout(() => setIsOpen(false), 150);
  }

  const displayName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div ref={containerRef} className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId.current} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={styles.inputWrapper} role="combobox" aria-expanded={isOpen} aria-haspopup="listbox" aria-controls={`${inputId.current}-listbox`} aria-owns={`${inputId.current}-listbox`}>
        <input
          id={inputId.current}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => value.trim() && setIsOpen(suggestions.length > 0)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={`${inputId.current}-listbox`}
          aria-activedescendant={highlightedIndex >= 0 ? `${inputId.current}-option-${highlightedIndex}` : undefined}
          className={styles.input}
        />
        {isLoading && <span className={styles.loader} aria-hidden="true">…</span>}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={`${inputId.current}-listbox`}
          role="listbox"
          className={styles.dropdown}
          aria-label="Company suggestions"
        >
          {suggestions.map((company, index) => (
            <li
              key={company.id}
              id={`${inputId.current}-option-${index}`}
              role="option"
              aria-selected={highlightedIndex === index}
              className={`${styles.option} ${highlightedIndex === index ? styles.highlighted : ''}`}
              onMouseDown={() => handleSelect(company)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className={styles.optionName}>{displayName(company.name)}</span>
              {company.rank !== null && (
                <span className={styles.rankBadge}>#{company.rank}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
