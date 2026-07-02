import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { masterDataService, GstRateDto } from '../../../services/masterDataService';
import Input from '../../../components/shared/forms/Input';
import Button from '../../../components/shared/Button';
import toast from 'react-hot-toast';

const gstRateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100, 'Name is too long'),
  hsnCode: z.string().min(2, 'HSN Code is required').max(20, 'HSN code is too long'),
  description: z.string().max(255).optional().default(''),
  rate: z.coerce.number().min(0, 'Rate cannot be negative').max(100, 'Rate cannot exceed 100%'),
  cgst: z.coerce.number().min(0, 'CGST cannot be negative'),
  sgst: z.coerce.number().min(0, 'SGST cannot be negative'),
  igst: z.coerce.number().min(0, 'IGST cannot be negative'),
  cess: z.coerce.number().min(0, 'Cess cannot be negative'),
  effectiveFrom: z.string().min(1, 'Effective From date is required'),
  effectiveTo: z.string().optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.cgst + data.sgst !== data.rate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CGST + SGST must equal the total GST Rate percentage',
      path: ['cgst'],
    });
  }
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data?: GstRateDto;
}

export default function GstRateModal({ isOpen, onClose, data }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!data;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(gstRateSchema),
    defaultValues: {
      rate: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      isActive: true,
      description: ''
    }
  });

  const watchedRate = watch('rate');

  // Auto-calculate splits when total rate changes
  useEffect(() => {
    if (watchedRate !== undefined) {
      const val = parseFloat(watchedRate) || 0;
      setValue('cgst', val / 2);
      setValue('sgst', val / 2);
      setValue('igst', val);
    }
  }, [watchedRate, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (data) {
        reset({
          name: data.name,
          hsnCode: data.hsnCode,
          description: data.description || '',
          rate: data.rate,
          cgst: data.cgst,
          sgst: data.sgst,
          igst: data.igst,
          cess: data.cess,
          effectiveFrom: data.effectiveFrom ? data.effectiveFrom.split('T')[0] : '',
          effectiveTo: data.effectiveTo ? data.effectiveTo.split('T')[0] : '',
          isActive: data.isActive
        });
      } else {
        reset({
          name: '',
          hsnCode: '',
          description: '',
          rate: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          cess: 0,
          effectiveFrom: new Date().toISOString().split('T')[0],
          effectiveTo: '',
          isActive: true
        });
      }
    }
  }, [data, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (formData: any) => {
      const payload = {
        ...formData,
        effectiveTo: formData.effectiveTo || null
      };
      return isEdit 
        ? masterDataService.updateGstRate(data!.id, payload) 
        : masterDataService.createGstRate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gstrates'] });
      queryClient.invalidateQueries({ queryKey: ['gstRatesAll'] });
      toast.success(isEdit ? 'GST Rate updated successfully' : 'GST Rate created successfully');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Operation failed');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-himgiri-primary text-white flex-shrink-0">
          <h3 className="text-xl font-bold capitalize">
            {isEdit ? 'Edit GST Rate' : 'Add New GST Rate'}
          </h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Name *" placeholder="e.g. GST 18%, Exempt" error={errors.name?.message?.toString()} {...register('name')} />
            </div>

            <Input label="HSN Code *" placeholder="e.g. 4820" error={errors.hsnCode?.message?.toString()} {...register('hsnCode')} />
            <Input label="Total GST Rate (%) *" type="number" step="0.01" placeholder="0.00" error={errors.rate?.message?.toString()} {...register('rate')} />

            <Input label="CGST (%) *" type="number" step="0.01" placeholder="0.00" error={errors.cgst?.message?.toString()} {...register('cgst')} />
            <Input label="SGST (%) *" type="number" step="0.01" placeholder="0.00" error={errors.sgst?.message?.toString()} {...register('sgst')} />
            
            <Input label="IGST (%) *" type="number" step="0.01" placeholder="0.00" error={errors.igst?.message?.toString()} {...register('igst')} />
            <Input label="Compensation Cess (%)" type="number" step="0.01" placeholder="0.00" error={errors.cess?.message?.toString()} {...register('cess')} />

            <Input label="Effective From *" type="date" error={errors.effectiveFrom?.message?.toString()} {...register('effectiveFrom')} />
            <Input label="Effective To (Optional)" type="date" error={errors.effectiveTo?.message?.toString()} {...register('effectiveTo')} />

            <div className="md:col-span-2">
              <Input label="Description" placeholder="Provide extra tax notes here" error={errors.description?.message?.toString()} {...register('description')} />
            </div>

            <div className="flex items-center gap-2 pt-2 md:col-span-2">
              <input type="checkbox" id="isActiveRate" {...register('isActive')} className="w-4 h-4 text-himgiri-primary rounded" />
              <label htmlFor="isActiveRate" className="text-sm font-medium text-gray-700">Is Active?</label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t flex-shrink-0">
            <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>Save Rate</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
