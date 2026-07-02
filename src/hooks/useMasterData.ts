import { useQuery } from '@tanstack/react-query';
import { masterDataService } from '../services/masterDataService';

/**
 * Hook to retrieve Grades dropdown data.
 * Caches grades list for 10 minutes to prevent redundant requests across pages/modals.
 */
export function useGradesDropdown() {
  return useQuery({
    queryKey: ['grades', 'dropdown'],
    queryFn: () => masterDataService.getGrades({ pageNumber: 1, pageSize: 100, isActive: true }).then((res) => res.data),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to retrieve Categories dropdown data.
 * Caches categories list for 10 minutes.
 */
export function useCategoriesDropdown() {
  return useQuery({
    queryKey: ['categories', 'dropdown'],
    queryFn: () => masterDataService.getCategories({ pageNumber: 1, pageSize: 100, isActive: true }).then((res) => res.data),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to retrieve all GST Rates for dropdown selection.
 * Caches GST rates list for 10 minutes.
 */
export function useGstRatesDropdown() {
  return useQuery({
    queryKey: ['gstRatesAll'],
    queryFn: () => masterDataService.getAllGstRates().then((res) => res.data),
    staleTime: 10 * 60 * 1000,
  });
}
