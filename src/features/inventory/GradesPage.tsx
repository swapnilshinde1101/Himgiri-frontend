import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataService, GradeDto } from '../../services/masterDataService';
import DataTable from '../../components/shared/DataTable';
import { AddButton } from '../../components/shared/ActionButtons';
import ActionModal from '../../components/shared/ActionModal';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';
import GradeModal from './components/GradeModal';
import { BaseRequest } from '../../types';

export default function GradesPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<BaseRequest>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeDto | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [gradeToDelete, setGradeToDelete] = useState<GradeDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['grades', params],
    queryFn: () => masterDataService.getGrades(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => masterDataService.deleteGrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Grade deleted successfully');
      setIsDeleteModalOpen(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">School Grades</h2>
        <AddButton onClick={() => { setSelectedGrade(undefined); setIsModalOpen(true); }}>Add Grade</AddButton>
      </div>

      <DataTable<GradeDto>
        data={data?.data || []}
        isLoading={isLoading}
        totalRecords={data?.meta?.totalRecords}
        currentPage={params.pageNumber}
        onPageChange={(page) => setParams(p => ({ ...p, pageNumber: page }))}
        onSearch={(term) => setParams(p => ({ ...p, searchTerm: term, pageNumber: 1 }))}
        getSuggestions={(term) => masterDataService.getGradeSuggestions(term).then(res => res.data)}
        onEdit={(g) => { setSelectedGrade(g); setIsModalOpen(true); }}
        onDelete={(g) => { setGradeToDelete(g); setIsDeleteModalOpen(true); }}
        columns={[
          { header: 'Order', accessor: 'displayOrder', className: 'w-16' },
          { 
            header: 'Name', 
            accessor: (g) => (
              <div>
                <div className="font-medium text-gray-900">{g.name}</div>
                {g.description && (
                  <div className="text-[10px] text-gray-500 italic">{g.description}</div>
                )}
              </div>
            )
          },
          { header: 'Short Name', accessor: 'shortName' },
          {
            header: 'Status',
            accessor: (g) => (
              <Badge variant={g.isActive ? 'success' : 'danger'}>
                {g.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )
          }
        ]}
      />

      <GradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedGrade}
      />

      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => gradeToDelete && deleteMutation.mutate(gradeToDelete.id)}
        variant="delete"
        title="Delete Grade"
        message={`Are you sure you want to delete "${gradeToDelete?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
