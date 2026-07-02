import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataService } from '../../services/masterDataService';
import DataTable from '../../components/shared/DataTable';
import { AddButton } from '../../components/shared/ActionButtons';
import ActionModal from '../../components/shared/ActionModal';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';
import GstRateModal from './components/GstRateModal';
import { BaseRequest, GstRateDto } from '../../types';

export default function GstRatesPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<BaseRequest>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<GstRateDto | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<GstRateDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['gstrates', params],
    queryFn: () => masterDataService.getGstRates(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataService.deleteGstRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gstrates'] });
      queryClient.invalidateQueries({ queryKey: ['gstRatesAll'] });
      toast.success('GST Rate deleted successfully');
      setIsDeleteModalOpen(false);
      setRateToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete GST Rate. It might be assigned to a category or item.');
      setIsDeleteModalOpen(false);
    }
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">GST Rates (Tax Master)</h2>
        <AddButton onClick={() => { setSelectedRate(undefined); setIsModalOpen(true); }}>Add GST Rate</AddButton>
      </div>

      <DataTable<GstRateDto>
        data={data?.data || []}
        isLoading={isLoading}
        totalRecords={data?.meta?.totalRecords}
        currentPage={params.pageNumber}
        onPageChange={(page) => setParams(p => ({ ...p, pageNumber: page }))}
        onSearch={(term) => setParams(p => ({ ...p, searchTerm: term, pageNumber: 1 }))}
        onEdit={(r) => { setSelectedRate(r); setIsModalOpen(true); }}
        onDelete={(r) => { setRateToDelete(r); setIsDeleteModalOpen(true); }}
        columns={[
          { 
            header: 'Name', 
            accessor: (r) => (
              <div>
                <div className="font-bold text-gray-900">{r.name}</div>
                {r.description && (
                  <div className="text-[10px] text-gray-500 italic max-w-xs truncate">{r.description}</div>
                )}
              </div>
            )
          },
          { header: 'HSN Code', accessor: 'hsnCode', className: 'font-mono' },
          { 
            header: 'Tax Rate (%)', 
            accessor: (r) => (
              <span className="font-semibold text-gray-900">{r.rate}%</span>
            )
          },
          { 
            header: 'CGST/SGST/IGST Splits', 
            accessor: (r) => (
              <div className="text-xs text-gray-500 font-medium">
                C: <span className="font-semibold">{r.cgst}%</span> | S: <span className="font-semibold">{r.sgst}%</span> | I: <span className="font-semibold">{r.igst}%</span>
                {r.cess > 0 && <span> | Cess: <span className="font-semibold text-red-500">{r.cess}%</span></span>}
              </div>
            )
          },
          { 
            header: 'Effective Range', 
            accessor: (r) => (
              <div className="text-xs text-gray-500">
                <span>{formatDate(r.effectiveFrom)}</span>
                {r.effectiveTo && <span> to {formatDate(r.effectiveTo)}</span>}
              </div>
            )
          },
          {
            header: 'Status',
            accessor: (r) => (
              <Badge variant={r.isActive ? 'success' : 'danger'}>
                {r.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )
          }
        ]}
      />

      <GstRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedRate}
      />

      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete GST Rate"
        message={`Are you sure you want to delete the tax rate "${rateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (rateToDelete) {
            deleteMutation.mutate(rateToDelete.id);
          }
        }}
      />
    </div>
  );
}
