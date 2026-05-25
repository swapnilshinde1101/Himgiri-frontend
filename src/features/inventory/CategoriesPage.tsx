import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataService, CategoryDto } from '../../services/masterDataService';
import DataTable from '../../components/shared/DataTable';
import { AddButton } from '../../components/shared/ActionButtons';
import ActionModal from '../../components/shared/ActionModal';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';
import MasterDataModal from './components/MasterDataModal';
import { BaseRequest } from '../../types';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<BaseRequest>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryDto | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<CategoryDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories', params],
    queryFn: () => masterDataService.getCategories(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
      setIsDeleteModalOpen(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Item Categories</h2>
        <AddButton onClick={() => { setSelectedCat(undefined); setIsModalOpen(true); }}>Add Category</AddButton>
      </div>

      <DataTable<CategoryDto>
        data={data?.data || []}
        isLoading={isLoading}
        totalRecords={data?.meta?.totalRecords}
        currentPage={params.pageNumber}
        onPageChange={(page) => setParams(p => ({ ...p, pageNumber: page }))}
        onSearch={(term) => setParams(p => ({ ...p, searchTerm: term, pageNumber: 1 }))}
        getSuggestions={(term) => masterDataService.getCategorySuggestions(term).then(res => res.data)}
        onEdit={(c) => { setSelectedCat(c); setIsModalOpen(true); }}
        onDelete={(c) => { setCatToDelete(c); setIsDeleteModalOpen(true); }}
        columns={[
          { header: 'Order', accessor: 'displayOrder', className: 'w-16' },
          { 
            header: 'Name', 
            accessor: (c) => (
              <div>
                <div className="font-medium text-gray-900">{c.name}</div>
                {c.description && (
                  <div className="text-[10px] text-gray-500 italic">{c.description}</div>
                )}
              </div>
            )
          },
          { header: 'HSN', accessor: 'hsnCode' },
          { 
            header: 'GST Rates', 
            accessor: (c) => (
              <div className="flex flex-col gap-1">
                <Badge variant={c.isTaxable ? 'info' : 'secondary'}>
                  {c.isTaxable ? `GST ${c.gstPercent}%` : 'Exempt'}
                </Badge>
                {c.isTaxable && (
                  <span className="text-[10px] text-gray-400 font-bold uppercase">C:{c.cgstPercent}% S:{c.sgstPercent}%</span>
                )}
              </div>
            )
          },
          {
            header: 'Status',
            accessor: (c) => (
              <Badge variant={c.isActive ? 'success' : 'danger'}>
                {c.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )
          }
        ]}
      />

      <MasterDataModal
        type="category"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedCat}
      />

      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => catToDelete && deleteMutation.mutate(catToDelete.id)}
        variant="delete"
        title="Delete Category"
        message={`Are you sure you want to delete "${catToDelete?.name}"? This might affect existing items.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
