import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import { inventoryService } from '../../../services/inventoryService';
import Input from '../../../components/shared/forms/Input';
import Select from '../../../components/shared/forms/Select';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';
import type { Item, CreateItemRequest } from '../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: Item;
}

export default function ItemModal({ isOpen, onClose, item }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!item;

  const itemSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional().nullable(),
    imageUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    purchasePrice: z.preprocess((val) => val === '' ? null : val, z.coerce.number().min(0, 'Purchase Price cannot be negative').nullable().optional()),
    mrp: z.coerce.number().min(0, 'MRP cannot be negative'),
    categoryId: z.string().min(1, 'Category is required'),
    gradeIds: z.array(z.string()).min(1, 'At least one Grade is required'),
    stockQty: z.coerce.number().int('Stock must be an integer').min(0, 'Stock cannot be negative'),
    targetQty: z.coerce.number().int('Target quantity must be an integer').min(1, 'Target quantity must be at least 1'),
    unit: z.string().min(1, 'Unit is required'),
    customUnit: z.string().max(50).optional().nullable(),
    storageStatus: z.coerce.number(),
    isActive: z.boolean().default(true),
    isStockInitialized: z.boolean().default(false),
  }).refine((data) => data.price <= data.mrp, {
    message: 'Selling Price (Base) cannot be greater than MRP',
    path: ['price'],
  }).refine((data) => {
    if (data.unit === '__custom__' && (!data.customUnit || data.customUnit.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: 'Custom unit name is required',
    path: ['customUnit'],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      storageStatus: 0,
      stockQty: 0,
      targetQty: 1,
      price: 0,
      purchasePrice: null,
      mrp: 0,
      unit: 'Pieces (Pcs)',
      customUnit: '',
      isActive: true,
      isStockInitialized: false
    }
  });

  const watchUnit = watch('unit');
  const watchIsActive = watch('isActive');

  useEffect(() => {
    if (watchIsActive === false) {
      setValue('isStockInitialized', false);
    }
  }, [watchIsActive, setValue]);

  // ── Master Data Queries ──
  // We fetch a large pageSize (100) to ensure dropdowns are complete
  const { data: grades, isLoading: loadingGrades } = useQuery({
    queryKey: ['grades', 'dropdown'],
    queryFn: () => masterDataService.getGrades({ pageNumber: 1, pageSize: 100 }).then(res => res.data),
    enabled: isOpen
  });

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['categories', 'dropdown'],
    queryFn: () => masterDataService.getCategories({ pageNumber: 1, pageSize: 100 }).then(res => res.data),
    enabled: isOpen
  });

  // ── Reset form when item changes ──
  useEffect(() => {
    if (isOpen) {
      if (item) {
        const standardUnits = ["Pieces (Pcs)", "Sets", "Boxes", "Packets", "Dozens"];
        const isCustomUnit = item.unit && !standardUnits.includes(item.unit);
        reset({
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl || '',
          price: item.price,
          purchasePrice: item.purchasePrice ?? null,
          mrp: item.mrp || 0,
          categoryId: item.categoryId,
          gradeIds: item.gradeIds || [],
          stockQty: item.stockQty,
          targetQty: item.targetQty || 0,
          unit: isCustomUnit ? '__custom__' : (item.unit || 'Pieces (Pcs)'),
          customUnit: isCustomUnit ? item.unit : '',
          storageStatus: item.storageStatus === 'PreOrder' ? 1 : 0,
          isActive: item.isActive ?? true,
          isStockInitialized: item.isStockInitialized ?? false
        });
      } else {
        reset({
          name: '',
          description: '',
          imageUrl: '',
          price: 0,
          purchasePrice: null,
          mrp: 0,
          stockQty: 0,
          targetQty: 1,
          unit: 'Pieces (Pcs)',
          customUnit: '',
          storageStatus: 0,
          gradeIds: [],
          isActive: true,
          isStockInitialized: false
        });
      }
    }
  }, [item, isOpen, reset]);

  // ── Mutations ──
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const finalUnit = data.unit === '__custom__' ? data.customUnit : data.unit;
      const finalStockQty = isEdit ? (item?.stockQty ?? 0) : 0;
 
      const payload: CreateItemRequest = {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price,
        purchasePrice: data.purchasePrice,
        mrp: data.mrp,
        categoryId: data.categoryId,
        gradeIds: data.gradeIds,
        stockQty: Number(finalStockQty),
        targetQty: Number(data.targetQty),
        unit: finalUnit,
        storageStatus: data.storageStatus === 1 ? 'PreOrder' : 'InStock',
        isActive: data.isActive,
        isStockInitialized: data.isActive ? (data.isStockInitialized || Number(finalStockQty) > 0) : false
      };

      if (isEdit) {
        return await inventoryService.updateItem(item!.id, payload);
      } else {
        return await inventoryService.createItem(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockCount'] });
      toast.success(isEdit ? 'Item updated' : 'Item created');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Something went wrong');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-himgiri-primary flex-shrink-0">
          <h3 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Inventory Item' : 'Add New Item'}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data as any))} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <Input
                label="Item Name"
                placeholder="e.g. Mathematics Grade 2 Textbook"
                error={errors.name?.message?.toString()}
                {...register('name')}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Input
                label="Description"
                placeholder="Brief details about the item..."
                error={errors.description?.message?.toString()}
                {...register('description')}
              />
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <Input
                label="Image URL (Optional)"
                placeholder="https://example.com/image.jpg"
                error={errors.imageUrl?.message?.toString()}
                {...register('imageUrl')}
              />
            </div>

            {/* Category Dropdown (Dynamic) */}
            <Select
              label="Category"
              isLoading={loadingCats}
              options={[
                { label: 'Select Category', value: '' },
                ...(categories?.map(c => ({ label: c.name, value: c.id })) || [])
              ]}
              error={errors.categoryId?.message?.toString()}
              {...register('categoryId')}
            />

            {/* Grade/Class selection (Multi-Select Checklist with Select All option) */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Grades / Classes <span className="text-red-550">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (grades) {
                        setValue('gradeIds', grades.map(g => g.id));
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => setValue('gradeIds', [])}
                    className="text-xs text-gray-500 hover:text-gray-700 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              {loadingGrades ? (
                <div className="h-20 animate-pulse bg-gray-150 rounded-xl" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                  {grades?.map(g => (
                    <label key={g.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                      <input
                        type="checkbox"
                        value={g.id}
                        {...register('gradeIds')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span>{g.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.gradeIds && (
                <p className="text-red-500 text-xs mt-1">{errors.gradeIds.message?.toString()}</p>
              )}
            </div>

            <Input
              label="Purchase Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.purchasePrice?.message?.toString()}
              {...register('purchasePrice')}
            />

            <Input
              label="Selling Price (Base)"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.price?.message?.toString()}
              {...register('price')}
            />

            <Input
              label="MRP"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.mrp?.message?.toString()}
              {...register('mrp')}
            />

            <Select
              label="Storage Status"
              options={[
                { label: 'In Stock', value: 0 },
                { label: 'Pre-Order', value: 1 }
              ]}
              error={errors.storageStatus?.message?.toString()}
              {...register('storageStatus')}
            />

            <Select
              label="Unit of Measurement"
              options={[
                { label: 'Pieces (Pcs)', value: 'Pieces (Pcs)' },
                { label: 'Sets', value: 'Sets' },
                { label: 'Boxes', value: 'Boxes' },
                { label: 'Packets', value: 'Packets' },
                { label: 'Dozens', value: 'Dozens' },
                { label: '+ Add Custom Unit...', value: '__custom__' }
              ]}
              error={errors.unit?.message?.toString()}
              {...register('unit')}
            />

            {watchUnit === '__custom__' && (
              <Input
                label="Custom Unit Name"
                placeholder="e.g. Rolls, Litres"
                error={errors.customUnit?.message?.toString()}
                {...register('customUnit')}
              />
            )}

            <Input
              label="Target / Ordered Quantity"
              type="number"
              placeholder="1"
              error={errors.targetQty?.message?.toString()}
              {...register('targetQty')}
            />

            {isEdit && (
              <div className="md:col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Current Stock Level
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {item?.stockQty ?? 0} <span className="text-sm font-medium text-gray-600">
                        {item?.unit || 'Units'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}


             <div className="flex flex-wrap gap-x-8 gap-y-4 pt-8">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  {...register('isActive')}
                  className="w-5 h-5 text-himgiri-primary border-gray-300 rounded focus:ring-himgiri-primary cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Is Active (Visible to Customers)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isStockInitialized" 
                  disabled={!watchIsActive}
                  {...register('isStockInitialized')}
                  className="w-5 h-5 text-himgiri-primary border-gray-300 rounded focus:ring-himgiri-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label 
                  htmlFor="isStockInitialized" 
                  className={`text-sm font-medium text-gray-700 cursor-pointer ${!watchIsActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Track in Stock Room (Show in Stock List)
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={mutation.isPending}
              className="px-8 shadow-lg shadow-blue-100"
            >
              {isEdit ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
