import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search,
  ArrowUpDown,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import Button from './Button';
import { EditButton, DeleteButton } from './ActionButtons';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  totalRecords?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (term: string) => void;
  getSuggestions?: (term: string) => Promise<string[]>;
  title?: string;
  actions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  onEdit,
  onDelete,
  totalRecords = 0,
  currentPage = 1,
  onPageChange,
  onSearch,
  getSuggestions,
  title,
  actions
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle live suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (getSuggestions && searchTerm.length >= 2) {
        setIsSuggesting(true);
        try {
          const list = await getSuggestions(searchTerm);
          setSuggestions(list);
          setShowSuggestions(list.length > 0);
        } catch (e) {
          console.error("Failed to fetch suggestions", e);
        } finally {
          setIsSuggesting(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, getSuggestions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
    setShowSuggestions(false);
  };

  const selectSuggestion = (val: string) => {
    setSearchTerm(val);
    onSearch?.(val);
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden transition-all duration-300">
      {/* Table Header / Toolbar */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50">
        {title && <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>}
        
        <div className="flex-1 max-w-md relative" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-himgiri-primary transition-colors" />
            <input
              type="text"
              placeholder="Search records..."
              className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            {isSuggesting && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 text-himgiri-primary animate-spin" />
                </div>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-himgiri-primary-light hover:text-himgiri-primary transition-colors flex items-center gap-3"
                >
                  <Search className="h-3 w-3 opacity-30" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={clsx(
                    "px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest",
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700 group">
                    {col.header}
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || actions) && (
                <th className="px-6 py-4 text-[10px] font-black text-himgiri-secondary-dark/40 uppercase tracking-widest text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="px-6 py-5">
                      <div className="h-4 bg-gray-100 rounded-full w-2/3"></div>
                    </td>
                  ))}
                  <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-12 ml-auto"></div></td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-bold">No records found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-himgiri-primary/[0.02] transition-colors group">
                  {columns.map((col, idx) => (
                    <td key={idx} className={clsx("px-6 py-5 text-sm font-bold text-gray-700", col.className)}>
                      {typeof col.accessor === 'function' 
                        ? col.accessor(item) 
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  {(onEdit || onDelete || actions) && (
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all text-nowrap transform translate-x-2 group-hover:translate-x-0">
                        {actions?.(item)}
                        {onEdit && (
                          <EditButton onClick={() => onEdit(item)} />
                        )}
                        {onDelete && (
                          <DeleteButton onClick={() => onDelete(item)} />
                        )}
                      </div>
                      <div className="group-hover:hidden flex justify-end">
                         <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                         </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalRecords > 0 && (
        <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-gray-50/30 gap-4">
          <div className="text-xs font-bold text-himgiri-secondary-dark/50 uppercase tracking-widest">
            Showing <span className="text-gray-900 font-black">{(currentPage - 1) * 10 + 1}</span> to{' '}
            <span className="text-gray-900 font-black">
              {Math.min(currentPage * 10, totalRecords)}
            </span> of{' '}
            <span className="text-gray-900 font-black">{totalRecords}</span> results
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl px-4 border-gray-200"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              icon={ChevronLeft}
            >
                Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl px-4 border-gray-200"
              disabled={currentPage * 10 >= totalRecords}
              onClick={() => onPageChange?.(currentPage + 1)}
              icon={ChevronRight}
              iconPosition="right"
            >
                Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
