import { useEffect, useState } from 'react';
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
  const [uploading, setUploading] = useState(false);

  const itemSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200, 'Name cannot exceed 200 characters'),
    description: z.string().max(1000).optional().nullable(),
    imageUrl: z.string()
      .min(1, 'At least one product image is required')
      .refine((val) => {
        if (!val) return false;
        const urls = val.split(',').filter(u => u.trim() !== '');
        return urls.length >= 1 && urls.length <= 3;
      }, 'You must upload between 1 and 3 images')
      .refine((val) => {
        if (!val) return false;
        const urls = val.split(',').filter(u => u.trim() !== '');
        return urls.every(u => {
          try {
            new URL(u);
            return true;
          } catch {
            return false;
          }
        });
      }, 'One or more image URLs are invalid'),
    price: z.coerce.number().min(0.01, 'Selling Price must be greater than 0'),
    purchasePrice: z.preprocess((val) => val === '' ? null : val, z.coerce.number().min(0, 'Purchase Price cannot be negative').nullable().optional()),
    mrp: z.coerce.number().min(0.01, 'MRP must be greater than 0'),
    categoryId: z.string().min(1, 'Category is required'),
    gstRateId: z.string().optional().nullable(),
    gradeIds: z.array(z.string()).min(1, 'At least one Grade is required'),
    stockQty: z.coerce.number().int('Stock must be an integer').min(0, 'Stock cannot be negative'),
    targetQty: z.coerce.number().int('Target quantity must be an integer').min(1, 'Target quantity must be at least 1'),
    unit: z.string().min(1, 'Unit is required'),
    customUnit: z.string().max(50).optional().nullable(),
    storageStatus: z.coerce.number(),
    isActive: z.boolean().default(true),
    isStockInitialized: z.boolean().default(false),
  }).superRefine((data, ctx) => {
    // 1. Price <= MRP check
    if (data.price > data.mrp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selling Price (Base) cannot be greater than MRP',
        path: ['price'],
      });
    }

    // 2. Custom unit name check
    if (data.unit === '__custom__' && (!data.customUnit || data.customUnit.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom unit name is required',
        path: ['customUnit'],
      });
    }

    // 3. Price + GST <= MRP check
    let gstPercent = 0;
    if (data.gstRateId) {
      const selectedRate = gstRates.find(r => r.id === data.gstRateId);
      if (selectedRate) {
        gstPercent = selectedRate.rate;
      }
    } else {
      const category = categories?.find(c => c.id === data.categoryId);
      if (category) {
        gstPercent = category.isTaxable ? category.gstPercent : 0;
      }
    }
    const sellingPriceWithGst = data.price * (1 + gstPercent / 100);
    if (sellingPriceWithGst > data.mrp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Price inclusive of GST (₹${sellingPriceWithGst.toFixed(2)}) cannot exceed MRP (₹${data.mrp.toFixed(2)})`,
        path: ['price'],
      });
    }
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
      isStockInitialized: false,
      gstRateId: ''
    }
  });

  const watchUnit = watch('unit');
  const watchIsActive = watch('isActive');
  const watchImageUrl = watch('imageUrl');
  const images = watchImageUrl ? watchImageUrl.split(',').filter((u: string) => u.trim() !== '') : [];
  const watchedMrp = watch('mrp');
  const watchedCategoryId = watch('categoryId');
  const watchedGstRateId = watch('gstRateId');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    if (images.length >= 3) {
      toast.error('Maximum of 3 images can be uploaded.');
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await inventoryService.uploadImage(file);
      const newUrls = [...images, publicUrl];
      setValue('imageUrl', newUrls.join(','));
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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

  const { data: gstRatesRes } = useQuery({
    queryKey: ['gstRatesAll'],
    queryFn: () => masterDataService.getAllGstRates(),
    enabled: isOpen
  });
  const gstRates = gstRatesRes?.data || [];

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
          isStockInitialized: item.isStockInitialized ?? false,
          gstRateId: item.gstRateId || ''
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
          isStockInitialized: false,
          gstRateId: ''
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
        isStockInitialized: data.isActive ? (data.isStockInitialized || Number(finalStockQty) > 0) : false,
        gstRateId: data.gstRateId || null
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
          <button onClick={onClose} className="text-white/80 hover:text-white hover:rotate-90 transition-transform focus:outline-none">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data as any))} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <Input
                label="Item Name *"
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

            {/* Image Upload (Mandatory: 1-3 Images) */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                    Product Images <span className="text-red-500">*</span>
                    <span className="text-xs font-medium text-gray-500">(Min 1, Max 3 images)</span>
                  </label>
                  <p className="text-xs text-gray-400">Upload high-quality images of your textbook, bag, or items.</p>
                </div>

                {images.length < 3 && (
                  <label className="relative inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-100 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex-shrink-0">
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Uploaded Images List */}
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((url: string, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-2xl border border-gray-150 overflow-hidden bg-slate-50 group shadow-sm flex items-center justify-center p-1.5">
                      <img
                        src={url}
                        alt={`Product Image ${idx + 1}`}
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newUrls = images.filter((_: string, i: number) => i !== idx);
                          setValue('imageUrl', newUrls.join(','));
                        }}
                        className="absolute top-2.5 right-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-all focus:outline-none opacity-90 hover:opacity-100"
                        title="Remove Image"
                      >
                        <X className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                      <span className="absolute bottom-2.5 left-2.5 text-[9px] font-black bg-slate-900/60 text-white px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm">
                        {idx === 0 ? 'Primary' : `Image ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center bg-gray-50/50">
                  <p className="text-xs text-gray-500 font-bold">No product images uploaded yet.</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Please upload at least 1 image to create/update this item.</p>
                </div>
              )}

              {errors.imageUrl && (
                <p className="text-red-500 text-xs font-semibold">{errors.imageUrl.message?.toString()}</p>
              )}
            </div>

            {/* Category Dropdown (Dynamic) */}
            <Select
              label="Category *"
              isLoading={loadingCats}
              options={[
                { label: 'Select Category', value: '' },
                ...(categories?.map(c => ({ label: c.name, value: c.id })) || [])
              ]}
              error={errors.categoryId?.message?.toString()}
              {...register('categoryId')}
            />

            {/* GST Rate Override Dropdown (Optional Override) */}
            <Select
              label="Override GST Rate (Optional)"
              options={[
                { label: 'Use Category Default', value: '' },
                ...gstRates.map(r => ({ label: `${r.name} - HSN ${r.hsnCode} (${r.rate}%)`, value: r.id }))
              ]}
              error={errors.gstRateId?.message?.toString()}
              {...register('gstRateId')}
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
              label="Selling Price (Base) *"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.price?.message?.toString()}
              {...register('price')}
            />

            <Input
              label="MRP *"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.mrp?.message?.toString()}
              {...register('mrp')}
            />

            {/* Pricing help calculator */}
            {watchedCategoryId && watchedMrp > 0 && (() => {
              let gst = 0;
              if (watchedGstRateId) {
                const selectedRate = gstRates.find(r => r.id === watchedGstRateId);
                if (selectedRate) {
                  gst = selectedRate.rate;
                }
              } else {
                const cat = categories?.find(c => c.id === watchedCategoryId);
                if (cat) {
                  gst = cat.isTaxable ? cat.gstPercent : 0;
                }
              }
              const recommendedBase = (watchedMrp / (1 + gst / 100)).toFixed(2);
              return (
                <div className="md:col-span-2 text-[10px] text-blue-600 bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 flex items-center justify-between font-bold animate-in fade-in duration-200">
                  <span>
                    For MRP ₹{watchedMrp} with {gst}% GST, the standard Base Price is <strong className="font-mono text-xs text-blue-800">₹{recommendedBase}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setValue('price', parseFloat(recommendedBase), { shouldValidate: true })}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg active:scale-95 transition-all text-[9px] uppercase tracking-wider font-black shrink-0 ml-2 shadow-sm"
                  >
                    Apply
                  </button>
                </div>
              );
            })()}

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
              label="Unit of Measurement *"
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
                label="Custom Unit Name *"
                placeholder="e.g. Rolls, Litres"
                error={errors.customUnit?.message?.toString()}
                {...register('customUnit')}
              />
            )}

            <Input
              label="Target / Ordered Quantity *"
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
              disabled={uploading}
              className="px-8 shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : (isEdit ? 'Save Changes' : 'Create Item')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
