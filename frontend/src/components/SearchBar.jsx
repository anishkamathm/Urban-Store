import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, SlidersHorizontal, Zap, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';

export default function SearchBar({
  query,
  setQuery,
  onSearch,
  suggestion,
  categories = [],
  selectedCategory,
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  city,
  setCity,
  instantOnly,
  setInstantOnly,
}) {
  const { t, i18n } = useTranslation();
  const [inputValue, setInputValue] = useState(query || '');
  const [autocompleteItems, setAutocompleteItems] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Fetch autocomplete on typing
  useEffect(() => {
    if (inputValue.trim().length >= 2) {
      const handler = setTimeout(() => {
        api.getAutocomplete(inputValue)
          .then(data => {
            if (data.suggestions) {
              setAutocompleteItems(data.suggestions);
              setShowAutocomplete(true);
            }
          })
          .catch(() => {});
      }, 250);

      return () => clearTimeout(handler);
    } else {
      setAutocompleteItems([]);
      setShowAutocomplete(false);
    }
  }, [inputValue, i18n.language]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setShowAutocomplete(false);
    setQuery(inputValue.trim());
    onSearch(inputValue.trim());
  };

  const handleSelectAutocomplete = (title) => {
    setInputValue(title);
    setQuery(title);
    setShowAutocomplete(false);
    onSearch(title);
  };

  const handleAcceptSuggestion = (suggestedWord) => {
    setInputValue(suggestedWord);
    setQuery(suggestedWord);
    onSearch(suggestedWord);
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setCity('');
    setInstantOnly(false);
    onSearch(inputValue.trim(), { category: '', minPrice: '', maxPrice: '', city: '', instantOnly: false });
  };

  const isKn = i18n.language === 'kn';

  return (
    <div className="w-full space-y-3" ref={dropdownRef}>
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
            <Search className="w-5 h-5 text-stone-700" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => { if (autocompleteItems.length > 0) setShowAutocomplete(true); }}
            placeholder={t('search.placeholder')}
            className="w-full pl-11 pr-11 py-3.5 bg-white rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-100 text-sm shadow-xs transition-all placeholder:text-stone-400 font-medium"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => { setInputValue(''); setQuery(''); onSearch(''); }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteItems.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden divide-y divide-stone-100 animate-fadeIn">
              {autocompleteItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAutocomplete(item.title)}
                  className="w-full text-left px-5 py-3 text-xs sm:text-sm hover:bg-stone-50 text-stone-800 flex items-center justify-between group transition cursor-pointer"
                >
                  <span className="font-medium">{item.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Submit Button */}
        <button
          type="submit"
          className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm active:scale-95 transition cursor-pointer"
        >
          {t('search.applyFilters')}
        </button>

        {/* Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
            filtersOpen || selectedCategory || minPrice || maxPrice || instantOnly || city
              ? 'bg-stone-900 border-stone-900 text-white'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
          title={t('search.filters')}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </form>

      {/* "Did you mean...?" Suggestion Banner */}
      {suggestion && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-950 animate-fadeIn">
          <span>{t('search.didYouMean')}:</span>
          <button
            type="button"
            onClick={() => handleAcceptSuggestion(suggestion)}
            className="font-black text-amber-800 underline hover:text-amber-950 italic cursor-pointer"
          >
            "{suggestion}"
          </button>
          <span>?</span>
        </div>
      )}

      {/* Instant 30-min Quick Filter Pill */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <button
          type="button"
          onClick={() => {
            const next = !instantOnly;
            setInstantOnly(next);
            onSearch(inputValue.trim(), { instantOnly: next });
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
            instantOnly
              ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-300'
              : 'bg-white border border-stone-200 text-stone-700 hover:border-amber-400 hover:bg-amber-50/50'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${instantOnly ? 'fill-current' : 'text-amber-500'}`} />
          <span>{t('search.instantFilter')}</span>
        </button>

        {categories.slice(0, 5).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              const nextCat = selectedCategory === cat.id ? '' : cat.id;
              setSelectedCategory(nextCat);
              onSearch(inputValue.trim(), { category: nextCat });
            }}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {isKn ? (cat.name_kn || cat.name_en) : cat.name_en}
          </button>
        ))}
      </div>

      {/* Expanded Filter Panel */}
      {filtersOpen && (
        <div className="p-5 bg-white rounded-3xl border border-stone-200 shadow-xl space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Category Dropdown */}
            <div>
              <label className="font-bold text-stone-700 block mb-1.5 uppercase tracking-wider">{t('search.category')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 text-xs font-medium text-stone-900"
              >
                <option value="">{t('search.allCategories')}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {isKn ? (c.name_kn || c.name_en) : c.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="font-bold text-stone-700 block mb-1.5 uppercase tracking-wider">{t('search.priceRange')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={t('search.minPrice')}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
                />
                <span className="text-stone-400">-</span>
                <input
                  type="number"
                  placeholder={t('search.maxPrice')}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900"
                />
              </div>
            </div>

            {/* City Filter */}
            <div>
              <label className="font-bold text-stone-700 block mb-1.5 uppercase tracking-wider">{t('search.city')}</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 text-xs font-medium text-stone-900"
              >
                <option value="">{t('search.allCities')}</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mysuru">Mysuru</option>
                <option value="Hubballi">Hubballi</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-stone-500 hover:text-red-600 font-semibold cursor-pointer"
            >
              {t('search.resetFilters')}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              {t('search.applyFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
