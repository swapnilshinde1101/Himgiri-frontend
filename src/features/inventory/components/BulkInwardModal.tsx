import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';
import { inventoryService } from '../../../services/inventoryService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Item, BulkInwardRequest } from '../../../types';

const REASONS = [
  'Purchase Received',
  'Manual Update'
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Item[];
  onSuccess: () => void;
}

export default function BulkInwardModal({ isOpen, onClose, selectedItems, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('Purchase Received');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset quantities
      const initial: Record<string, number> = {};
      selectedItems.forEach(item => {
        initial[item.id] = 0;
      });
      setQuantities(initial);
      setReason('Purchase Received');
    }
  }, [isOpen, selectedItems]);

  const mutation = useMutation({
    mutationFn: async (req: BulkInwardRequest) => {
      return await inventoryService.bulkInwardStock(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockCount'] });
      toast.success('Selected items updated successfully');
      onSuccess();
    }
  });

  const handleQtyChange = (itemId: string, val: string) => {
    const num = parseInt(val) || 0;
    const item = selectedItems.find(i => i.id === itemId);
    const maxAllowed = item ? (item.targetQty - item.stockQty) : 0;
    const boundedNum = Math.min(Math.max(0, num), maxAllowed);
    setQuantities(prev => ({
      ...prev,
      [itemId]: boundedNum
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsToSubmit = [];
    for (const [itemId, qty] of Object.entries(quantities)) {
      if (qty <= 0) continue;
      const item = selectedItems.find(i => i.id === itemId);
      if (!item) continue;
      const maxAllowed = item.targetQty - item.stockQty;
      if (qty > maxAllowed) {
        toast.error(`Update quantity for "${item.name}" cannot exceed the pending amount of ${maxAllowed}`);
        return;
      }
      itemsToSubmit.push({
        itemId,
        quantityToAdd: qty
      });
    }

    if (itemsToSubmit.length === 0) {
      toast.error('Please enter at least one quantity greater than 0');
      return;
    }

    mutation.mutate({
      items: itemsToSubmit,
      reason
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-himgiri-primary flex-shrink-0">
          <h3 className="text-xl font-bold text-white">
            Update Stock
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:rotate-90 transition-transform focus:outline-none">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-6">
          
          {/* Reason */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Update Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold text-gray-800"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="border border-gray-100 rounded-xl overflow-auto max-h-[380px] shadow-sm custom-scrollbar">
            <table className="w-full min-w-[650px] text-left border-collapse text-sm">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 bg-gray-50">Item details</th>
                  <th className="px-4 py-3 text-center bg-gray-50">Target</th>
                  <th className="px-4 py-3 text-center bg-gray-50">In-Stock</th>
                  <th className="px-4 py-3 text-center bg-gray-50">Pending</th>
                  <th className="px-4 py-3 text-center w-28 bg-gray-50">Update Qty</th>
                  <th className="px-4 py-3 text-center bg-gray-50">New Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {selectedItems.map(item => {
                  const addQty = quantities[item.id] || 0;
                  const newQty = item.stockQty + addQty;
                  const pending = item.targetQty - item.stockQty;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 leading-tight">{item.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 flex gap-2">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.categoryName}</span>
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">{item.gradeNames}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-gray-700">
                        {item.targetQty}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-gray-500">
                        {item.stockQty}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-amber-600">
                        {pending}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max={pending}
                          value={addQty || ''}
                          onChange={(e) => handleQtyChange(item.id, e.target.value)}
                          placeholder="0"
                          className="w-full text-center rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none transition-all font-mono font-bold text-gray-800"
                        />
                      </td>
                      <td className={`px-4 py-3 text-center font-mono font-bold ${addQty > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {newQty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="mt-auto pt-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={mutation.isPending}
              className="px-8 shadow-lg bg-himgiri-primary hover:bg-himgiri-primary-dark text-white"
            >
              Update Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
