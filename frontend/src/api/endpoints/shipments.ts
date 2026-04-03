import { apiClient } from '@/api/client'

// --- Types matching BE exactly ---

export interface ValidateAddressRequest {
  addressLine1: string
  addressLine2?: string | null
  city: string
  stateProvince: string
  postalCode: string
  countryCode: string // always "AE"
}

export interface ValidateAddressResponse {
  isValid: boolean
  correctedAddressLine1?: string
  correctedCity?: string
  correctedStateProvince?: string
  correctedPostalCode?: string
  message?: string
  errors?: string[]
}

export interface BookShipmentRequest {
  ticketId: string
  recipientName: string
  recipientCompany: string
  recipientPhone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  stateProvince: string
  postalCode: string
  countryCode: string
  weightKg: number
  serviceType: string
}

export interface ShipmentResponse {
  id: string
  ticketId: string
  ticketDisplayId: string
  status: string
  trackingNumber: string
  recipientName: string
  recipientCompany: string
  addressLine1: string
  addressLine2: string | null
  city: string
  stateProvince: string
  postalCode: string
  countryCode: string
  weightKg: number
  serviceType: string
  hasLabel: boolean
  createdAt: string
  shippedAt: string | null
}

// --- API functions ---

export async function validateAddress(data: ValidateAddressRequest): Promise<ValidateAddressResponse> {
  const res = await apiClient.post<ValidateAddressResponse>('/shipments/validate-address', data)
  return res.data
}

export async function bookShipment(data: BookShipmentRequest): Promise<ShipmentResponse> {
  const res = await apiClient.post<ShipmentResponse>('/shipments/book', data)
  return res.data
}

export async function getShipmentByTicket(ticketId: string): Promise<ShipmentResponse | null> {
  try {
    const res = await apiClient.get<ShipmentResponse>(`/shipments/by-ticket/${ticketId}`)
    return res.data
  } catch {
    return null // 404 = no shipment yet
  }
}

export function getShipmentLabelUrl(shipmentId: string): string {
  return `${apiClient.defaults.baseURL}/shipments/${shipmentId}/label`
}
