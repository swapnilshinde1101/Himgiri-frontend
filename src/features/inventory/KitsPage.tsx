import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitService } from '../../services/kitService';
import { inventoryService } from '../../services/inventoryService';
import { masterDataService } from '../../services/masterDataService';
import { 
  Plus, 
  Search, 
  SlidersHorizontal,
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Trash2, 
  Loader2, 
  Briefcase, 
  Info, 
  FolderPlus,
  BookOpen,
  CheckCircle2,
  Trash,
  X
} from 'lucide-react';
import Button from '../../components/shared/Button';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import type { SchoolKit, BaseRequest, Item } from '../../types';

export default function KitsPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<BaseRequest>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
    sortColumn: 'CreatedAt',
    sortDirection: 'DESC'
  });

  const [searchVal, setSearchVal] = useState('');
  const [expandedKitId, setExpandedKitId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState<SchoolKit | null>(null);
  
  // Form Fields
  const [kitName, setKitName] = useState('');
  const [kitDescription, setKitDescription] = useState('');
  const [gradeId, setGradeId] = useState('');
  
  // constituent items in the kit being created/edited
  const [kitItems, setKitItems] = useState<{ itemId: string; quantity: number }[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // ── Master Queries ──
  const { data: kitsData, isLoading: isKitsLoading } = useQuery({
    queryKey: ['school-kits', params],
    queryFn: () => kitService.getKits(params),
  });

  const { data: grades } = useQuery({
    queryKey: ['grades', 'dropdown'],
    queryFn: () => masterDataService.getGrades({ pageNumber: 1, pageSize: 100, isActive: true }).then(res => res.data),
  });

  const { data: catalogItems } = useQuery({
    queryKey: ['items', 'dropdown'],
    queryFn: () => inventoryService.getItems({ pageNumber: 1, pageSize: 200, isActive: true }).then(res => res.data),
  });

  // ── Mutations ──
  const createKitMutation = useMutation({
    mutationFn: kitService.createKit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-kits'] });
      toast.success('School Kit created successfully');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to create kit');
    }
  });

  const updateKitMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: any }) => kitService.updateKit(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-kits'] });
      toast.success('School Kit updated successfully');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to update kit');
    }
  });

  const deleteKitMutation = useMutation({
    mutationFn: kitService.deleteKit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-kits'] });
      toast.success('School Kit deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete kit');
    }
  });

  // ── Handlers ──
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(p => ({ ...p, searchTerm: searchVal, pageNumber: 1 }));
  };

  const openCreateModal = () => {
    setSelectedKit(null);
    setKitName('');
    setKitDescription('');
    setGradeId('');
    setKitItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (kit: SchoolKit, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedKit(kit);
    setKitName(kit.name);
    setKitDescription(kit.description || '');
    setGradeId(kit.gradeId);
    setKitItems(kit.items.map(i => ({ itemId: i.itemId, quantity: i.quantity })));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedKit(null);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the school kit "${name}"?`)) {
      deleteKitMutation.mutate(id);
    }
  };

  const handleAddKitItem = () => {
    setKitItems(prev => [...prev, { itemId: '', quantity: 1 }]);
  };

  const handleRemoveKitItem = (index: number) => {
    setKitItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleKitItemFieldChange = (index: number, field: 'itemId' | 'quantity', value: any) => {
    setKitItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          [field]: field === 'quantity' ? (parseInt(value) || 1) : value
        };
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!kitName.trim()) {
      toast.error('Kit Name is required');
      return;
    }
    if (!gradeId) {
      toast.error('Grade is required');
      return;
    }
    if (kitItems.length === 0) {
      toast.error('At least one item must be added to the kit');
      return;
    }

    const hasEmptyItems = kitItems.some(i => !i.itemId);
    if (hasEmptyItems) {
      toast.error('Please select an item for all lines or remove empty lines');
      return;
    }

    const payload = {
      name: kitName.trim(),
      description: kitDescription.trim(),
      gradeId,
      isActive: selectedKit ? selectedKit.isActive : true,
      items: kitItems
    };

    if (selectedKit) {
      updateKitMutation.mutate({ id: selectedKit.id, request: payload });
    } else {
      createKitMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search school kits..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:bg-white focus:border-himgiri-primary transition-all"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={openCreateModal}
            icon={Plus}
            className="rounded-2xl px-6 py-3 h-auto bg-himgiri-primary text-white hover:bg-himgiri-primary-dark shadow-lg shadow-blue-100"
          >
            Create Kit
          </Button>
        </div>
      </div>

      {/* Kits List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
        {isKitsLoading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 className="h-6 w-6 text-himgiri-primary animate-spin" />
            <span className="text-sm font-bold text-gray-500">Loading school kits catalog...</span>
          </div>
        ) : !kitsData?.data || kitsData.data.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700">No School Kits Found</h3>
            <p className="text-sm text-gray-400 mt-1">Configure your first grade-level book bundle by clicking "Create Kit".</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {kitsData.data.map((kit) => {
              const isExpanded = expandedKitId === kit.id;
              
              // Calculate default total price from constituent items
              const calculatedTotal = kit.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const calculatedMrp = kit.items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);

              return (
                <div key={kit.id} className="transition-all hover:bg-slate-50/20">
                  <div 
                    onClick={() => setExpandedKitId(isExpanded ? null : kit.id)}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4 cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900 tracking-tight">{kit.name}</span>
                        <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {kit.gradeName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium max-w-xl truncate">
                        {kit.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Bundle Price (Base)</span>
                        <span className="text-lg font-black text-gray-800 font-mono">
                          ₹{calculatedTotal.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-bold">
                          MRP: ₹{calculatedMrp.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => openEditModal(kit, e)}
                          title="Edit Kit"
                          className="p-2.5 text-gray-500 hover:text-himgiri-primary hover:bg-himgiri-primary-light rounded-xl transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(kit.id, kit.name, e)}
                          title="Delete Kit"
                          className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <span className="p-1.5 text-gray-400">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accordion content: List items in kit */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-50">
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest">Constituent Item</th>
                              <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest">Category</th>
                              <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                              <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-right">Selling Price (Excl. GST)</th>
                              <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-right">MRP (Incl. GST)</th>
                              <th className="px-4 py-3 font-black text-gray-400 uppercase tracking-widest text-right">Total Base</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                            {kit.items.map((item) => (
                              <tr key={item.itemId} className="hover:bg-slate-50/20 transition-colors">
                                <td className="px-4 py-3 text-gray-900 font-bold flex items-center gap-2">
                                  <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                                  {item.itemName}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                                    {item.categoryName}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-bold font-mono">{item.quantity} {item.unit}</td>
                                <td className="px-4 py-3 text-right font-mono">₹{item.price.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-mono">₹{item.mrp.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-mono text-gray-800 font-bold">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                            {/* Summary Rows */}
                            <tr className="bg-slate-50/40 font-bold text-gray-700">
                              <td colSpan={3} className="px-4 py-3">Total Bundle MRP Valuation</td>
                              <td className="px-4 py-3 text-right"></td>
                              <td className="px-4 py-3 text-right font-mono text-gray-900 font-black">₹{calculatedMrp.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right font-mono text-gray-900 font-black">₹{calculatedTotal.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Kit Modal */}
      {isModalOpen && (
        <div 
          onClick={closeModal}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-himgiri-secondary-dark/40 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-8 transform scale-100 transition-all duration-300 animate-in zoom-in-95 custom-scrollbar cursor-default"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-himgiri-primary" />
                  {selectedKit ? 'Modify School Kit' : 'Assemble New School Kit'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Configure bundle details, targets, and items.</p>
              </div>
              <button 
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all focus:outline-none"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-himgiri-secondary-dark/70 mb-2">
                    Kit Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 1 Starter Kit"
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:border-himgiri-primary transition-all"
                    value={kitName}
                    onChange={(e) => setKitName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-himgiri-secondary-dark/70 mb-2">
                    Target Grade *
                  </label>
                  <select
                    required
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:border-himgiri-primary transition-all"
                    value={gradeId}
                    onChange={(e) => setGradeId(e.target.value)}
                  >
                    <option value="">Select Target Class...</option>
                    {grades?.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-himgiri-secondary-dark/70 mb-2">
                  Kit Description
                </label>
                <textarea
                  placeholder="Provide general information about the books and stationery included in this kit."
                  className="w-full px-5 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:border-himgiri-primary transition-all h-20 resize-none"
                  value={kitDescription}
                  onChange={(e) => setKitDescription(e.target.value)}
                />
              </div>



              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-700">Constituent Kit Items</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddKitItem}
                    icon={Plus}
                    className="text-xs font-bold py-1 px-3 h-auto rounded-lg border-gray-200"
                  >
                    Add Line Item
                  </Button>
                </div>

                {kitItems.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                    <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <span className="text-xs text-gray-400 font-bold block">No items added to the kit. Click "Add Line Item".</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kitItems.map((kItem, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="flex-1">
                          <select
                            required
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:border-himgiri-primary transition-all"
                            value={kItem.itemId}
                            onChange={(e) => handleKitItemFieldChange(idx, 'itemId', e.target.value)}
                          >
                            <option value="">Select Item from Catalog...</option>
                            {catalogItems?.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} (₹{item.price.toFixed(2)} - {item.categoryName})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-24">
                          <input
                            type="number"
                            required
                            min="1"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-4 focus:ring-himgiri-primary/10 focus:border-himgiri-primary transition-all"
                            value={kItem.quantity}
                            onChange={(e) => handleKitItemFieldChange(idx, 'quantity', e.target.value)}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveKitItem(idx)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="rounded-xl px-5" 
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl px-6 bg-himgiri-primary text-white hover:bg-himgiri-primary-dark transition-all"
                  isLoading={createKitMutation.isPending || updateKitMutation.isPending}
                >
                  {selectedKit ? 'Update Kit' : 'Create Kit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
