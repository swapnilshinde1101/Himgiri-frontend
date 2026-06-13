import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { masterDataService, CategoryDto } from '../../../services/masterDataService';
import Input from '../../../components/shared/forms/Input';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(255).optional().default(''),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().min(0),
  hsnCode: z.string().min(1, 'HSN Code is required').max(20),
  gstPercent: z.coerce.number().min(0).max(100),
  isTaxable: z.boolean().default(true)
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data?: CategoryDto;
}

export default function CategoryModal({ isOpen, onClose, data }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!data;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      displayOrder: 0,
      gstPercent: 0,
      isActive: true,
      isTaxable: true,
      description: ''
    }
  });

  const isTaxable = watch('isTaxable');

  useEffect(() => {
    if (isOpen) {
      if (data) {
        reset({
          name: data.name,
          description: data.description || '',
          isActive: data.isActive,
          displayOrder: data.displayOrder,
          hsnCode: data.hsnCode,
          gstPercent: data.gstPercent,
          isTaxable: data.isTaxable
        });
      } else {
        reset({
          name: '',
          description: '',
          isActive: true,
          displayOrder: 0,
          hsnCode: '',
          gstPercent: 0,
          isTaxable: true
        });
      }
    }
  }, [data, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (formData: any) => {
      return isEdit 
        ? masterDataService.updateCategory(data!.id, formData) 
        : masterDataService.createCategory(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category saved');
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
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d as any))} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Name" error={errors.name?.message?.toString()} {...register('name')} />
            </div>

            <div className="md:col-span-2">
              <Input label="Description" error={errors.description?.message?.toString()} {...register('description')} />
            </div>
            
            <Input label="Display Order" type="number" error={errors.displayOrder?.message?.toString()} {...register('displayOrder')} />
            <Input label="HSN Code" error={errors.hsnCode?.message?.toString()} {...register('hsnCode')} />
            
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
                <Input label="GST Rate (%)" type="number" step="0.01" error={errors.gstPercent?.message?.toString()} {...register('gstPercent')} />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Save Category</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
