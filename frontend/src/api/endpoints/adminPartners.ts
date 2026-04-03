import { apiClient } from '../client'

export interface PartnerAdmin {
  id: string
  name: string
  alias: string | null
  createdAt: string
  products: PartnerProductAdmin[]
}

export interface PartnerProductAdmin {
  id: string
  productCode: string
  productName: string
  lifecycleState: string
  companyCode: string
  createdAt: string
}

export interface CreatePartnerRequest {
  name: string
  alias?: string
}

export interface UpdatePartnerRequest {
  name: string
  alias?: string
}

export interface LinkProductRequest {
  productCode: string
  companyCode: string
}

export async function fetchAdminPartners(): Promise<PartnerAdmin[]> {
  const res = await apiClient.get<PartnerAdmin[]>('/admin/partners')
  return res.data
}

export async function createPartner(data: CreatePartnerRequest): Promise<PartnerAdmin> {
  const res = await apiClient.post<PartnerAdmin>('/admin/partners', data)
  return res.data
}

export async function updatePartner(id: string, data: UpdatePartnerRequest): Promise<void> {
  await apiClient.put(`/admin/partners/${id}`, data)
}

export async function deletePartner(id: string): Promise<void> {
  await apiClient.delete(`/admin/partners/${id}`)
}

export async function linkProduct(partnerId: string, data: LinkProductRequest): Promise<PartnerProductAdmin> {
  const res = await apiClient.post<PartnerProductAdmin>(`/admin/partners/${partnerId}/products`, data)
  return res.data
}

export async function unlinkProduct(partnerId: string, productId: string): Promise<void> {
  await apiClient.delete(`/admin/partners/${partnerId}/products/${productId}`)
}
