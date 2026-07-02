import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { masterDataService, GradeDto } from '../../../services/masterDataService';
import Input from '../../../components/shared/forms/Input';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';

const gradeSchema = z.object({
  name: z.string()
    .min(3, 'Name must be between 3 and 15 characters')
    .max(15, 'Name must be between 3 and 15 characters'),
  shortName: z.string().min(1, 'Short Name is required').max(10),
  description: z.string().max(255).optional().default(''),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().min(0)
});

type GradeFormData = z.infer<typeof gradeSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data?: GradeDto;
}

export default function GradeModal({ isOpen, onClose, data }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      displayOrder: 0,
      isActive: true,
      description: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (data) {
        reset({
          name: data.name,
          shortName: data.shortName,
          description: data.description || '',
          isActive: data.isActive,
          displayOrder: data.displayOrder
        });
      } else {
        reset({
          name: '',
          shortName: '',
          description: '',
          isActive: true,
          displayOrder: 0
        });
      }
    }
  }, [data, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (formData: GradeFormData) => {
      return isEdit 
        ? masterDataService.updateGrade(data!.id, formData) 
        : masterDataService.createGrade(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade saved');
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
            {isEdit ? 'Edit Grade' : 'Add New Grade'}
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
            
            <Input label="Short Name * (e.g. G1)" error={errors.shortName?.message?.toString()} {...register('shortName')} />
            <Input label="Display Order" type="number" error={errors.displayOrder?.message?.toString()} {...register('displayOrder')} />
            
            <div className="flex items-center gap-2 pt-2">
               <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4 text-himgiri-primary rounded" />
               <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Is Active?</label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Save Grade</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
