import { useQuery, useMutation } from '@tanstack/react-query'
import { validateAddress, bookShipment, getShipmentByTicket } from '@/api/endpoints/shipments'
import type { ValidateAddressRequest, BookShipmentRequest } from '@/api/endpoints/shipments'

export function useShipmentByTicket(ticketId: string) {
  return useQuery({
    queryKey: ['shipment', ticketId],
    queryFn: () => getShipmentByTicket(ticketId),
    enabled: !!ticketId,
  })
}

export function useValidateAddress() {
  return useMutation({
    mutationFn: (data: ValidateAddressRequest) => validateAddress(data),
  })
}

export function useBookShipment() {
  return useMutation({
    mutationFn: (data: BookShipmentRequest) => bookShipment(data),
  })
}
