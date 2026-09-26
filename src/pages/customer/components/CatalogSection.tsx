import { useState, useEffect } from 'react';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { catalogService } from '../../../services/catalogService';
import type { SchoolKit, Item, CategoryDto, Meta } from '../../../types';
import type { StockAdjustableItem } from '../CustomerHome';

interface Props {
  selectedKit: SchoolKit | null;
  activeCategories: CategoryDto[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSuggestionSelect: (value: string) => void;
  catalogLoading: boolean;
  displayCatalogItems: Item[];
  addOnQuantities: Record<string, number>;
  updateAddOnQty: (itemId: string, delta: number, item: StockAdjustableItem) => void;
  onItemClick: (item: Item) => void;
  getInclusivePrice: (price: number, categoryName: string) => number;
  meta?: Meta;
  pageNumber: number;
  onPageChange: (page: number) => void;
}

export default function CatalogSection({
  selectedKit,
  activeCategories,
  selectedCategoryId,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onSuggestionSelect,
  catalogLoading,
  displayCatalogItems,
  addOnQuantities,
  updateAddOnQty,
  onItemClick,
  getInclusivePrice,
  meta,
  pageNumber,
  onPageChange
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);

  // Reset active suggestion index when suggestions list or dropdown status changes
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions, showSuggestions]);

  // Fetch autocomplete search suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await catalogService.getSuggestions(searchQuery);
        if (res.data) {
          setSuggestions(res.data);
        }
      } catch (err) {
        // Silently ignore suggestions errors
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Autocomplete matching text highlight
  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <strong key={i} className="text-blue-600 font-extrabold">{part}</strong>
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  const selectSuggestion = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
  };

  // Keyboard navigation for suggestions dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
          selectSuggestion(suggestions[activeSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-soft space-y-6">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          {selectedKit ? "Section B: Optional Add-ons" : "Available Catalog Items"}
        </span>
        <h3 className="text-lg font-black text-gray-900 tracking-tight mt-2.5">
          {selectedKit ? "Add Additional Items" : "Browse & Add Items"}
        </h3>
        <p className="text-xs text-gray-400 font-semibold mt-1">
          {selectedKit
            ? "Customize your bundle by adding extra drawing tools, bags, notebooks, or replacement items:"
            : "Choose the items you wish to purchase below:"}
        </p>
      </div>

      {/* Amazon-style unified Search & Category Selector Bar */}
      <div className="relative">
        <div className="flex bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:ring-4 focus-within:ring-himgiri-primary/10 focus-within:border-himgiri-primary overflow-hidden transition-all h-14">
          {/* Left: Category Selector Dropdown */}
          <div className="bg-slate-50 border-r border-gray-200 flex items-center px-4 hover:bg-slate-100 transition-colors shrink-0 max-w-[150px] sm:max-w-[180px]">
            <select
              className="bg-transparent text-[11px] font-black uppercase tracking-wider text-gray-600 focus:outline-none cursor-pointer border-none py-1 w-full"
              value={selectedCategoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="All">All Categories</option>
              {activeCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Middle: Input field */}
          <input
            type="text"
            placeholder="Search for textbooks, bags, stationery, journals..."
            className="flex-1 px-4 py-3 bg-transparent text-xs font-semibold focus:outline-none border-none text-gray-800 placeholder:text-gray-400"
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          {/* Right: Search icon button */}
          <button
            type="button"
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 flex items-center justify-center transition-colors shrink-0"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {suggestions.map((suggestion, idx) => {
              const isActive = idx === activeSuggestionIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className={clsx(
                    "w-full text-left px-4 py-2.5 text-xs font-semibold hover:text-gray-950 transition-colors flex items-center gap-2 border-b border-slate-50 last:border-0",
                    isActive ? "bg-slate-100 text-slate-900" : "text-gray-700 hover:bg-slate-50"
                  )}
                >
                  <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{highlightMatch(suggestion, searchQuery)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Items catalog grid */}
      {catalogLoading ? (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="h-5 w-5 text-himgiri-primary animate-spin" />
          <span className="text-xs font-bold text-gray-500 font-mono">Loading catalog items...</span>
        </div>
      ) : displayCatalogItems.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-gray-250 rounded-2xl">
          <p className="text-gray-400 font-bold text-xs">No active shop items match your search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayCatalogItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-150 p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-300 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3 cursor-pointer group" onClick={() => onItemClick(item)}>
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-gray-100 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl.split(',')[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-10 w-10 text-slate-400" />
                  )}

                  <span className="absolute bottom-2 right-2 text-[8px] font-black bg-slate-900/75 text-white px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm">
                    {item.categoryName}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1 leading-tight" title={item.name}>
                    {item.name}
                  </h4>
                  {item.description ? (
                    <p className="text-[11px] text-gray-400 font-semibold line-clamp-2 leading-snug">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-300 font-semibold italic">No description available</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    {(() => {
                      const sellingPriceWithGst = getInclusivePrice(item.price, item.categoryName);
                      return (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono font-black text-sm text-himgiri-primary">
                              ₹{sellingPriceWithGst.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                              Incl. GST
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {item.storageStatus === 'InStock' && item.stockQty <= 0 && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider block text-red-500 font-black">
                        Out of Stock
                      </span>
                    )}
                    {item.storageStatus === 'PreOrder' && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-500 block">
                        Pre-order Available
                      </span>
                    )}
                  </div>

                  <div>
                    {(addOnQuantities[item.id] || 0) > 0 ? (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner scale-95">
                        <button
                          type="button"
                          onClick={() => updateAddOnQty(item.id, -1, item)}
                          className="h-7 w-7 rounded-lg bg-white shadow-sm hover:bg-gray-100 text-gray-700 active:scale-90 transition-all flex items-center justify-center font-black text-sm border border-gray-200"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-black text-xs text-gray-805">
                          {addOnQuantities[item.id]}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateAddOnQty(item.id, 1, item)}
                          disabled={item.storageStatus === 'InStock' && (addOnQuantities[item.id] || 0) >= item.stockQty}
                          className="h-7 w-7 rounded-lg bg-white shadow-sm hover:bg-gray-150 text-gray-800 active:scale-90 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100 transition-all flex items-center justify-center font-black text-sm border border-gray-200"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={item.storageStatus === 'InStock' && item.stockQty <= 0}
                        onClick={() => updateAddOnQty(item.id, 1, item)}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border shadow-sm",
                          item.storageStatus === 'InStock' && item.stockQty <= 0
                            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                        )}
                      >
                        {item.storageStatus === 'InStock' && item.stockQty <= 0 ? "Sold Out" : "Add to Cart"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Numbered Pagination Controls */}
      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100 mt-6">
          <span className="text-[11px] font-bold text-gray-500">
            Showing page <strong className="text-gray-800">{meta.currentPage}</strong> of <strong className="text-gray-800">{meta.totalPages}</strong> (Total <strong className="text-gray-800">{meta.totalRecords}</strong> items)
          </span>

          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              type="button"
              disabled={meta.currentPage === 1 || catalogLoading}
              onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100 transition-all shadow-sm flex items-center gap-1"
            >
              &lt; Prev
            </button>

            {/* Page Numbers */}
            {Array.from({ length: meta.totalPages }, (_, index) => {
              const pageIdx = index + 1;
              const isCurrent = pageIdx === meta.currentPage;
              return (
                <button
                  key={pageIdx}
                  type="button"
                  disabled={catalogLoading}
                  onClick={() => onPageChange(pageIdx)}
                  className={clsx(
                    "h-8 w-8 flex items-center justify-center rounded-xl text-[10px] font-black transition-all active:scale-95",
                    isCurrent
                      ? "bg-slate-900 border border-slate-900 text-white shadow-md shadow-slate-900/10"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {pageIdx}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              disabled={meta.currentPage === meta.totalPages || catalogLoading}
              onClick={() => onPageChange(Math.min(meta.totalPages, pageNumber + 1))}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:active:scale-100 transition-all shadow-sm flex items-center gap-1"
            >
              Next &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
