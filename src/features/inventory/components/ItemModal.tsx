import React, { useEffect } from 'react';
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

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  categoryId: z.string().min(1, 'Category is required'),
  gradeId: z.string().min(1, 'Grade is required'),
  stockQty: z.coerce.number().min(0, 'Stock cannot be negative'),
  storageStatus: z.enum(['InStock', 'PreOrder']),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: Item;
}

export default function ItemModal({ isOpen, onClose, item }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      storageStatus: 'InStock',
      stockQty: 0,
      price: 0
    }
  });

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
        reset({
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl || '',
          price: item.price,
          categoryId: item.categoryId,
          gradeId: item.gradeId,
          stockQty: item.stockQty,
          storageStatus: item.storageStatus,
        });
      } else {
        reset({
          name: '',
          description: '',
          imageUrl: '',
          price: 0,
          stockQty: 0,
          storageStatus: 'InStock',
        });
      }
    }
  }, [item, isOpen, reset]);

  // ── Mutations ──
  const mutation = useMutation({
    mutationFn: (data: CreateItemRequest) => 
      isEdit ? inventoryService.updateItem(item!.id, data) : inventoryService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success(isEdit ? 'Item updated' : 'Item created');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Something went wrong');
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

        <form onSubmit={handleSubmit((data) => mutation.mutate(data as CreateItemRequest))} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <Input
                label="Item Name"
                placeholder="e.g. Mathematics Grade 2 Textbook"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Input
                label="Description"
                placeholder="Brief details about the item..."
                error={errors.description?.message}
                {...register('description')}
              />
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <Input
                label="Image URL (Optional)"
                placeholder="https://example.com/image.jpg"
                error={errors.imageUrl?.message}
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
              error={errors.categoryId?.message}
              {...register('categoryId')}
            />

            {/* Grade Dropdown (Dynamic) */}
            <Select
              label="Grade / Class"
              isLoading={loadingGrades}
              options={[
                { label: 'Select Grade', value: '' },
                ...(grades?.map(g => ({ label: g.name, value: g.id })) || [])
              ]}
              error={errors.gradeId?.message}
              {...register('gradeId')}
            />

            <Input
              label="Price (Base)"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.price?.message}
              {...register('price')}
            />
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
