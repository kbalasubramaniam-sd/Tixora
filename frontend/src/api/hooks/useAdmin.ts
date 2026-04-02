import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSlaConfig,
  updateSlaConfig,
  fetchBusinessHours,
  updateBusinessHours,
  fetchHolidays,
  createHoliday,
  deleteHoliday,
  fetchDelegates,
  createDelegate,
  deleteDelegate,
  fetchWorkflowConfig,
} from '@/api/endpoints/admin'
import type {
  UpdateSlaConfigRequest,
  UpdateBusinessHoursRequest,
  CreateHolidayRequest,
  CreateDelegateRequest,
} from '@/api/endpoints/admin'

// --- SLA Config ---

export function useSlaConfig() {
  return useQuery({
    queryKey: ['admin', 'sla-config'],
    queryFn: fetchSlaConfig,
  })
}

export function useUpdateSlaConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateSlaConfigRequest) => updateSlaConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sla-config'] })
    },
  })
}

// --- Business Hours ---

export function useBusinessHours() {
  return useQuery({
    queryKey: ['admin', 'business-hours'],
    queryFn: fetchBusinessHours,
  })
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateBusinessHoursRequest) => updateBusinessHours(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'business-hours'] })
    },
  })
}

// --- Holidays ---

export function useHolidays() {
  return useQuery({
    queryKey: ['admin', 'holidays'],
    queryFn: fetchHolidays,
  })
}

export function useCreateHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateHolidayRequest) => createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'holidays'] })
    },
  })
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'holidays'] })
    },
  })
}

// --- Delegates ---

export function useDelegates() {
  return useQuery({
    queryKey: ['admin', 'delegates'],
    queryFn: fetchDelegates,
  })
}

export function useCreateDelegate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDelegateRequest) => createDelegate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'delegates'] })
    },
  })
}

export function useDeleteDelegate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDelegate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'delegates'] })
    },
  })
}

// --- Workflow Config (read-only) ---

export function useWorkflowConfig() {
  return useQuery({
    queryKey: ['admin', 'workflow-config'],
    queryFn: fetchWorkflowConfig,
  })
}
