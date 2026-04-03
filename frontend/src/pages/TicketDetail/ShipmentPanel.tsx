import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useShipmentByTicket, useValidateAddress, useBookShipment } from '@/api/hooks/useShipments'
import { getShipmentLabelUrl } from '@/api/endpoints/shipments'
import type { ShipmentResponse } from '@/api/endpoints/shipments'
import type { TicketDetail } from '@/types/ticket'
import { TaskType, TicketStatus, UserRole } from '@/types/enums'

interface ShipmentPanelProps {
  ticket: TicketDetail
}

const EMIRATES = [
  { label: 'Abu Dhabi', code: 'AD' },
  { label: 'Dubai', code: 'DU' },
  { label: 'Sharjah', code: 'SH' },
  { label: 'Ajman', code: 'AJ' },
  { label: 'Umm Al Quwain', code: 'UQ' },
  { label: 'Ras Al Khaimah', code: 'RK' },
  { label: 'Fujairah', code: 'FU' },
] as const

const SERVICE_TYPES = [
  { label: 'Standard Overnight', value: 'STANDARD_OVERNIGHT' },
  { label: 'Priority Overnight', value: 'PRIORITY_OVERNIGHT' },
  { label: 'FedEx Ground', value: 'FEDEX_GROUND' },
  { label: 'Express Saver', value: 'FEDEX_EXPRESS_SAVER' },
] as const

type PanelState = 'form' | 'validated' | 'booked'

interface FormData {
  recipientName: string
  recipientCompany: string
  recipientPhone: string
  addressLine1: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  serviceType: string
}

const inputClasses =
  'w-full bg-surface-container-lowest border-none rounded-lg h-12 px-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 shadow-sm text-sm'

export function ShipmentPanel({ ticket }: ShipmentPanelProps) {
  const { user } = useAuth()

  if (ticket.taskType !== TaskType.T01) return null
  if (ticket.status !== TicketStatus.Completed) return null
  if (user?.role !== UserRole.ExecutiveAuthority) return null

  return <ShipmentPanelInner ticket={ticket} />
}

function ShipmentPanelInner({ ticket }: ShipmentPanelProps) {
  const [state, setState] = useState<PanelState>('form')
  const [formData, setFormData] = useState<FormData>({
    recipientName: '',
    recipientCompany: ticket.partnerName,
    recipientPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    serviceType: 'STANDARD_OVERNIGHT',
  })
  const [bookingResult, setBookingResult] = useState<ShipmentResponse | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const { data: existing } = useShipmentByTicket(ticket.id)
  useEffect(() => {
    if (existing) {
      setBookingResult(existing)
      setState('booked')
    }
  }, [existing])

  const validateMutation = useValidateAddress()
  const bookMutation = useBookShipment()

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleValidate = async () => {
    setErrors([])
    const required: (keyof FormData)[] = ['recipientName', 'recipientCompany', 'recipientPhone', 'addressLine1', 'city', 'stateProvince']
    const missing = required.filter((f) => !formData[f]?.trim())
    if (missing.length > 0) {
      setErrors(missing.map((f) => `${formatFieldName(f)} is required`))
      return
    }

    try {
      const result = await validateMutation.mutateAsync({
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || null,
        city: formData.city,
        stateProvince: formData.stateProvince,
        postalCode: formData.postalCode || '00000',
        countryCode: 'AE',
      })
      if (result.valid) {
        if (result.correctedAddress) {
          setFormData((prev) => ({
            ...prev,
            addressLine1: result.correctedAddress!.addressLine1,
            addressLine2: result.correctedAddress!.addressLine2 ?? '',
            city: result.correctedAddress!.city,
            stateProvince: result.correctedAddress!.stateProvince,
            postalCode: result.correctedAddress!.postalCode,
          }))
        }
        setState('validated')
      } else {
        setErrors(result.errors ?? ['Address validation failed'])
      }
    } catch {
      setErrors(['FedEx service unavailable. Please try again in a few minutes.'])
    }
  }

  const handleBook = async () => {
    setErrors([])
    try {
      const result = await bookMutation.mutateAsync({
        ticketId: ticket.id,
        recipientName: formData.recipientName,
        recipientCompany: formData.recipientCompany,
        recipientPhone: formData.recipientPhone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || null,
        city: formData.city,
        stateProvince: formData.stateProvince,
        postalCode: formData.postalCode || '00000',
        countryCode: 'AE',
        weightKg: 0.5,
        serviceType: formData.serviceType,
      })
      setBookingResult(result)
      setState('booked')
    } catch {
      setErrors(['Booking failed. Please try again.'])
    }
  }

  const emirateLabel = EMIRATES.find((e) => e.code === formData.stateProvince)?.label ?? formData.stateProvince

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl custom-shadow space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
        <h4 className="text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">Ship Contract</h4>
      </div>

      {state === 'form' && (
        <div className="space-y-3">
          <input type="text" placeholder="Recipient name" value={formData.recipientName} onChange={(e) => updateField('recipientName', e.target.value)} className={inputClasses} />
          <input type="text" placeholder="Company name" value={formData.recipientCompany} onChange={(e) => updateField('recipientCompany', e.target.value)} className={inputClasses} />
          <input type="tel" placeholder="+971 XX XXX XXXX" value={formData.recipientPhone} onChange={(e) => updateField('recipientPhone', e.target.value.replace(/[^\d+\s-]/g, ''))} className={inputClasses} />
          <input type="text" placeholder="Address line 1" value={formData.addressLine1} onChange={(e) => updateField('addressLine1', e.target.value)} className={inputClasses} />
          <input type="text" placeholder="Address line 2 (optional)" value={formData.addressLine2} onChange={(e) => updateField('addressLine2', e.target.value)} className={inputClasses} />
          <input type="text" placeholder="City" value={formData.city} onChange={(e) => updateField('city', e.target.value)} className={inputClasses} />
          <select value={formData.stateProvince} onChange={(e) => updateField('stateProvince', e.target.value)} className={inputClasses}>
            <option value="">Select Emirate</option>
            {EMIRATES.map((e) => <option key={e.code} value={e.code}>{e.label}</option>)}
          </select>
          <input type="text" placeholder="Postal code (optional)" value={formData.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} className={inputClasses} />
          <select value={formData.serviceType} onChange={(e) => updateField('serviceType', e.target.value)} className={inputClasses}>
            {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>{err}
                </p>
              ))}
            </div>
          )}

          <button onClick={handleValidate} disabled={validateMutation.isPending} className="w-full primary-gradient text-on-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
            {validateMutation.isPending
              ? <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Validating...</>
              : <><span className="material-symbols-outlined text-sm">verified</span>Validate Address</>}
          </button>
        </div>
      )}

      {state === 'validated' && (
        <div className="space-y-4">
          <div className="bg-surface-container-low p-4 rounded-lg space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-xs font-bold text-green-600">Address Verified</span>
            </div>
            <p className="text-sm text-on-surface font-medium">{formData.recipientName}</p>
            <p className="text-xs text-on-surface-variant">{formData.recipientCompany}</p>
            <p className="text-xs text-on-surface-variant">{formData.addressLine1}</p>
            {formData.addressLine2 && <p className="text-xs text-on-surface-variant">{formData.addressLine2}</p>}
            <p className="text-xs text-on-surface-variant">{formData.city}, {emirateLabel} {formData.postalCode}</p>
            <p className="text-xs text-on-surface-variant">{formData.recipientPhone}</p>
            <p className="text-xs text-on-surface-variant mt-1 font-medium">{SERVICE_TYPES.find((s) => s.value === formData.serviceType)?.label}</p>
          </div>

          <button onClick={() => { setState('form'); setErrors([]) }} className="text-xs font-bold text-primary hover:underline">Edit</button>

          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>{err}
                </p>
              ))}
            </div>
          )}

          <button onClick={handleBook} disabled={bookMutation.isPending} className="w-full primary-gradient text-on-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
            {bookMutation.isPending
              ? <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Booking...</>
              : <><span className="material-symbols-outlined text-sm">local_shipping</span>Book Shipment</>}
          </button>
        </div>
      )}

      {state === 'booked' && bookingResult && (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-xs font-bold text-green-600">Shipment Booked</span>
            </div>
            <p className="text-2xl font-mono font-bold text-primary">{bookingResult.trackingNumber}</p>
            {bookingResult.shippedAt && (
              <p className="text-[10px] text-on-surface-variant">
                Booked on {new Date(bookingResult.shippedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {bookingResult.hasLabel && (
            <button onClick={() => window.open(getShipmentLabelUrl(bookingResult.id), '_blank')} className="w-full primary-gradient text-on-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-sm">print</span>Print Label
            </button>
          )}

          <a href={`https://www.fedex.com/fedextrack/?trknbr=${bookingResult.trackingNumber}`} target="_blank" rel="noopener noreferrer" className="block text-center text-xs font-bold text-primary hover:underline">
            Track on FedEx
          </a>
        </div>
      )}
    </div>
  )
}

function formatFieldName(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
}
