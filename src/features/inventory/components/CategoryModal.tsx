import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { masterDataService, CategoryDto } from '../../../services/masterDataService';
import Input from '../../../components/shared/forms/Input';
import Select from '../../../components/shared/forms/Select';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';

const categorySchema = z.object({
  name: z.string()
    .min(3, 'Name must be between 3 and 15 characters')
    .max(15, 'Name must be between 3 and 15 characters'),
  description: z.string().max(255).optional().default(''),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().min(0),
  defaultGstRateId: z.string().min(1, 'Default GST Rate is required')
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

  // Fetch all GstRates from master database
  const { data: gstRatesRes } = useQuery({
    queryKey: ['gstRatesAll'],
    queryFn: () => masterDataService.getAllGstRates(),
    enabled: isOpen
  });

  const gstRates = gstRatesRes?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      displayOrder: 0,
      isActive: true,
      description: '',
      defaultGstRateId: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (data) {
        reset({
          name: data.name,
          description: data.description || '',
          isActive: data.isActive,
          displayOrder: data.displayOrder,
          defaultGstRateId: data.defaultGstRateId || ''
        });
      } else {
        reset({
          name: '',
          description: '',
          isActive: true,
          displayOrder: 0,
          defaultGstRateId: ''
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
              <Input label="Name *" error={errors.name?.message?.toString()} {...register('name')} />
            </div>

            <div className="md:col-span-2">
              <Input label="Description" error={errors.description?.message?.toString()} {...register('description')} />
            </div>
            
            <Input label="Display Order" type="number" error={errors.displayOrder?.message?.toString()} {...register('displayOrder')} />
            
            <div className="md:col-span-2">
              <Select
                label="Default GST Rate *"
                error={errors.defaultGstRateId?.message?.toString()}
                {...register('defaultGstRateId')}
                options={[
                  { value: '', label: 'Select GST Rate...' },
                  ...gstRates.map(r => ({
                    value: r.id,
                    label: `${r.name} - HSN ${r.hsnCode} (${r.rate}%)`
                  }))
                ]}
              />
            </div>
            
            <div className="flex items-center gap-2 pt-2 col-span-2">
               <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4 text-himgiri-primary rounded" />
               <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Is Active?</label>
            </div>
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
