import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchProducts, fetchTasks, fetchFormSchema, submitTicket } from '@/api/endpoints/products'
import type { TicketCreateRequest } from '@/types/product'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })
}

export function useTasks(productCode: string | null) {
  return useQuery({
    queryKey: ['tasks', productCode],
    queryFn: () => fetchTasks(productCode!),
    enabled: !!productCode,
  })
}

export function useFormSchema(productCode: string | null, taskType: string | null) {
  return useQuery({
    queryKey: ['form-schema', productCode, taskType],
    queryFn: () => fetchFormSchema(productCode!, taskType!),
    enabled: !!productCode && !!taskType,
  })
}

export function useSubmitTicket() {
  return useMutation({
    mutationFn: (request: TicketCreateRequest) => submitTicket(request),
  })
}
