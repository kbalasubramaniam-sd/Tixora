import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAdminPartners, createPartner, updatePartner, deletePartner, linkProduct, unlinkProduct } from '../endpoints/adminPartners'
import type { CreatePartnerRequest, UpdatePartnerRequest, LinkProductRequest } from '../endpoints/adminPartners'

const KEY = ['admin', 'partners']

export function useAdminPartners() {
  return useQuery({ queryKey: KEY, queryFn: fetchAdminPartners })
}

export function useCreatePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePartnerRequest) => createPartner(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdatePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerRequest }) => updatePartner(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeletePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePartner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useLinkProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: string; data: LinkProductRequest }) => linkProduct(partnerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUnlinkProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ partnerId, productId }: { partnerId: string; productId: string }) => unlinkProduct(partnerId, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
