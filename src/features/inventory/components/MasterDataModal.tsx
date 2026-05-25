import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { masterDataService } from '../../../services/masterDataService';
import Input from '../../../components/shared/forms/Input';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';

const gradeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  shortName: z.string().min(1, 'Short Name is required').max(10),
  description: z.string().max(255).optional().default(''),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().min(0)
});

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(255).optional().default(''),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().min(0),
  hsnCode: z.string().min(1, 'HSN Code is required').max(20),
  gstPercent: z.coerce.number().min(0).max(100),
  isTaxable: z.boolean().default(true)
});

interface Props {
  type: 'grade' | 'category';
  isOpen: boolean;
  onClose: () => void;
  data?: any;
}

export default function MasterDataModal({ type, isOpen, onClose, data }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!data;
  const schema = type === 'grade' ? gradeSchema : categorySchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema)
  });

  const isTaxable = watch('isTaxable');

  useEffect(() => {
    if (isOpen) {
      reset(data || { 
        displayOrder: 0, 
        gstPercent: 0, 
        isActive: true, 
        isTaxable: true,
        description: '' 
      });
    }
  }, [data, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (formData: any) => {
        if (type === 'grade') {
            return isEdit ? masterDataService.updateGrade(data.id, formData) : masterDataService.createGrade(formData);
        } else {
            return isEdit ? masterDataService.updateCategory(data.id, formData) : masterDataService.createCategory(formData);
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type === 'grade' ? 'grades' : 'categories'] });
      toast.success(`${type === 'grade' ? 'Grade' : 'Category'} saved`);
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-himgiri-primary text-white">
          <h3 className="text-xl font-bold capitalize">
            {isEdit ? `Edit ${type}` : `Add New ${type}`}
          </h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Name" error={errors.name?.message as string} {...register('name')} />
            </div>

            {type === 'category' && (
              <div className="md:col-span-2">
                <Input label="Description" error={errors.description?.message as string} {...register('description')} />
              </div>
            )}
            
            {type === 'grade' ? (
              <>
                <div className="md:col-span-2">
                  <Input label="Description" error={errors.description?.message as string} {...register('description')} />
                </div>
                <Input label="Short Name (e.g. G1)" error={errors.shortName?.message as string} {...register('shortName')} />
                <Input label="Display Order" type="number" error={errors.displayOrder?.message as string} {...register('displayOrder')} />
                <div className="flex items-center gap-2 pt-2">
                   <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4 text-himgiri-primary rounded" />
                   <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Is Active?</label>
                </div>
              </>
            ) : (
              <>
                <Input label="Display Order" type="number" error={errors.displayOrder?.message as string} {...register('displayOrder')} />
                <Input label="HSN Code" error={errors.hsnCode?.message as string} {...register('hsnCode')} />
                
                <div className="flex items-center gap-2 pt-2">
                   <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4 text-himgiri-primary rounded" />
                   <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Is Active?</label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                   <input type="checkbox" id="isTaxable" {...register('isTaxable')} className="w-4 h-4 text-himgiri-primary rounded" />
                   <label htmlFor="isTaxable" className="text-sm font-medium text-gray-700">Is Taxable?</label>
                </div>

                {isTaxable && (
                  <div className="md:col-span-2">
                    <Input label="GST Rate (%)" type="number" step="0.01" error={errors.gstPercent?.message as string} {...register('gstPercent')} />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Save {type}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
