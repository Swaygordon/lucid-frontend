import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { buildSuggestions } from '../utils/search.js';

// Headless-ish autocomplete: renders the input via a render-prop and owns
// the dropdown panel below it. Parent controls input styling and layout
// (location picker, search button, etc.).
//
// Usage:
//   <SearchAutocomplete
//     value={query}
//     onChange={setQuery}
//     onSelect={(item) => navigate(item.to)}
//     onSubmit={() => navigate(`/lucid/services/all?q=${...}`)}
//     panelTheme="light"   // or "dark" for over-image hero
//   >
//     {(inputProps) => (
//       <input {...inputProps} placeholder="..." className="..." />
//     )}
//   </SearchAutocomplete>

export default function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  onSubmit,
  panelTheme = 'light',
  panelOffsetClassName = 'top-full mt-2',
  children,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  const { categories, services } = useMemo(
    () => buildSuggestions(value),
    [value]
  );

  // Flatten for keyboard navigation; track which group each index belongs to.
  const flat = useMemo(
    () => [
      ...categories.map(c => ({ ...c, _group: 'category' })),
      ...services.map(s => ({ ...s, _group: 'service' })),
    ],
    [categories, services]
  );

  const hasResults = flat.length > 0;
  const showPanel = open && value.trim().length > 0 && hasResults;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Reset active index when results change.
  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && flat[activeIndex]) {
        e.preventDefault();
        selectItem(flat[activeIndex]);
        return;
      }
      // No active suggestion — fall through to parent's submit handler.
      if (onSubmit) {
        e.preventDefault();
        onSubmit(value);
        setOpen(false);
      }
      return;
    }
    if (!showPanel) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flat.length - 1 : i - 1));
    }
  };

  const selectItem = (item) => {
    onSelect?.(item);
    setOpen(false);
    setActiveIndex(-1);
  };

  const inputProps = {
    ref: inputRef,
    value,
    onChange: (e) => {
      onChange(e.target.value);
      setOpen(true);
    },
    onFocus: () => setOpen(true),
    onKeyDown: handleKeyDown,
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': showPanel,
    'aria-controls': showPanel ? listboxId : undefined,
    'aria-activedescendant':
      showPanel && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined,
  };

  // Theme tokens for the panel — light works on white/light backgrounds,
  // dark suits glassy hero overlays.
  const panelStyles = panelTheme === 'dark'
    ? 'bg-[#1a1f2e]/95 backdrop-blur-md border-white/20 text-slate-100'
    : 'bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#1e293b] text-gray-900 dark:text-slate-100';

  const groupLabelStyles = panelTheme === 'dark'
    ? 'text-slate-300'
    : 'text-gray-600 dark:text-slate-400';

  const optionHoverStyles = panelTheme === 'dark'
    ? 'hover:bg-white/10'
    : 'hover:bg-gray-50 dark:hover:bg-[#252b3b]';

  const optionActiveStyles = panelTheme === 'dark'
    ? 'bg-white/15'
    : 'bg-blue-50 dark:bg-blue-900/20';

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {children(inputProps)}
      {showPanel && (
        <ul
          id={listboxId}
          role="listbox"
          className={`absolute left-0 right-0 z-40 ${panelOffsetClassName} max-h-96 overflow-y-auto rounded-xl border shadow-xl ${panelStyles}`}
        >
          {categories.length > 0 && (
            <>
              <li
                className={`px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide ${groupLabelStyles}`}
                aria-hidden="true"
              >
                Categories
              </li>
              {categories.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeIndex === idx;
                return (
                  <li key={item.id}>
                    <button
                      id={`${listboxId}-opt-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectItem(item)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${optionHoverStyles} ${isActive ? optionActiveStyles : ''}`}
                    >
                      {Icon && (
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg ${item.color || 'bg-gray-100'} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${item.iconColor || 'text-gray-700'}`} />
                        </span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">{item.name}</span>
                        {item.description && (
                          <span className={`block text-xs truncate ${groupLabelStyles}`}>{item.description}</span>
                        )}
                      </span>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${groupLabelStyles}`} />
                    </button>
                  </li>
                );
              })}
            </>
          )}
          {services.length > 0 && (
            <>
              <li
                className={`px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide ${groupLabelStyles}`}
                aria-hidden="true"
              >
                Services
              </li>
              {services.map((item, idx) => {
                const flatIdx = categories.length + idx;
                const Icon = item.icon;
                const isActive = activeIndex === flatIdx;
                return (
                  <li key={item.id}>
                    <button
                      id={`${listboxId}-opt-${flatIdx}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      onClick={() => selectItem(item)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${optionHoverStyles} ${isActive ? optionActiveStyles : ''}`}
                    >
                      {Icon && (
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg ${item.color || 'bg-gray-100'} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${item.iconColor || 'text-gray-700'}`} />
                        </span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">
                          {item.name}
                          {item.synonym && item.synonym !== item.name.toLowerCase() && (
                            <span className={`ml-2 text-xs font-normal ${groupLabelStyles}`}>(matches "{item.synonym}")</span>
                          )}
                        </span>
                        <span className={`block text-xs truncate ${groupLabelStyles}`}>in {item.categoryName}</span>
                      </span>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${groupLabelStyles}`} />
                    </button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
