import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../services/inventoryService';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/shared/Badge';
import { AddButton } from '../../components/shared/ActionButtons';
import ActionModal from '../../components/shared/ActionModal';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import type { Item, BaseRequest } from '../../types';
import ItemModal from './components/ItemModal';

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<BaseRequest>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
    sortColumn: 'CreatedAt',
    sortDirection: 'DESC'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // ── Data Fetching ──
  const { data, isLoading } = useQuery({
    queryKey: ['items', params],
    queryFn: () => inventoryService.getItems(params),
  });

  // ── Mutations ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item deleted successfully');
      setIsDeleteModalOpen(false);
    }
  });

  // ── Handlers ──
  const handleAdd = () => {
    setSelectedItem(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">Inventory Items</h1>
          <p className="text-sm text-himgiri-secondary-dark/60">Manage school kits, textbooks, and stationery items.</p>
        </div>
        <AddButton onClick={handleAdd}>Add New Item</AddButton>
      </div>

      {/* Main Table */}
      <DataTable<Item>
        data={data?.data || []}
        isLoading={isLoading}
        totalRecords={data?.meta?.totalRecords}
        currentPage={params.pageNumber}
        onPageChange={(page) => setParams(p => ({ ...p, pageNumber: page }))}
        onSearch={(term) => setParams(p => ({ ...p, searchTerm: term, pageNumber: 1 }))}
        getSuggestions={(term) => inventoryService.getSuggestions(term).then(res => res.data)}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        columns={[
          { 
            header: 'Item', 
            accessor: (item) => (
              <div className="flex items-center gap-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover bg-gray-50 border border-gray-100 shadow-sm" />
                )}
                <div>
                  <div className="font-bold text-gray-900 leading-none mb-1">{item.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-himgiri-secondary-dark/50 font-bold">{item.categoryName}</div>
                </div>
              </div>
            ) 
          },
          { header: 'Grade', accessor: 'gradeName' },
          { 
            header: 'Price', 
            accessor: (item) => (
              <span className="font-bold text-gray-900">₹{item.price.toLocaleString()}</span>
            ) 
          },
          {
            header: 'Status',
            accessor: (item) => (
              <Badge variant={item.isActive ? 'success' : 'gray'}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )
          }
        ]}
      />

      {/* Add/Edit Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
      />

      {/* Delete Confirmation */}
      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        variant="delete"
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
