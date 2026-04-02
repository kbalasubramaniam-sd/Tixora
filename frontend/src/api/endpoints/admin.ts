import { apiClient } from '@/api/client'

// --- Types ---

// SLA Config
export interface SlaStageConfig {
  stageId: string
  stageName: string
  slaBusinessHours: number
  taskTypeCode: string
  productCode: string
}

export interface SlaConfigResponse {
  stages: SlaStageConfig[]
}

export interface UpdateSlaConfigRequest {
  stages: { stageId: string; slaBusinessHours: number }[]
}

// Business Hours
export interface BusinessHourDay {
  id: string
  dayOfWeek: number
  dayName: string
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
}

export interface BusinessHoursResponse {
  days: BusinessHourDay[]
}

export interface UpdateBusinessHoursRequest {
  days: { id: string; isWorkingDay: boolean; startTime: string; endTime: string }[]
}

// Holidays
export interface Holiday {
  id: string
  date: string
  name: string
}

export interface CreateHolidayRequest {
  date: string
  name: string
}

// Delegates
export interface Delegate {
  id: string
  primaryUserId: string
  primaryUserName: string
  delegateUserId: string
  delegateUserName: string
  validFrom: string | null
  validTo: string | null
}

export interface CreateDelegateRequest {
  primaryUserId: string
  delegateUserId: string
  validFrom: string | null
  validTo: string | null
}

// Workflow Config
export interface WorkflowStageConfig {
  stageId: string
  stageName: string
  stageOrder: number
  assignedRole: string
  slaBusinessHours: number
  isConditional: boolean
  requiredDocuments: string[]
}

export interface WorkflowConfig {
  productCode: string
  productName: string
  taskTypeCode: string
  taskTypeName: string
  stages: WorkflowStageConfig[]
}

// --- API Functions ---

// SLA Config
export async function fetchSlaConfig(): Promise<SlaConfigResponse> {
  const res = await apiClient.get<SlaConfigResponse>('/admin/sla-config')
  return res.data
}

export async function updateSlaConfig(data: UpdateSlaConfigRequest): Promise<void> {
  await apiClient.put('/admin/sla-config', data)
}

// Business Hours
export async function fetchBusinessHours(): Promise<BusinessHoursResponse> {
  const res = await apiClient.get<BusinessHoursResponse>('/admin/business-hours')
  return res.data
}

export async function updateBusinessHours(data: UpdateBusinessHoursRequest): Promise<void> {
  await apiClient.put('/admin/business-hours', data)
}

// Holidays
export async function fetchHolidays(): Promise<Holiday[]> {
  const res = await apiClient.get<Holiday[]>('/admin/holidays')
  return res.data
}

export async function createHoliday(data: CreateHolidayRequest): Promise<Holiday> {
  const res = await apiClient.post<Holiday>('/admin/holidays', data)
  return res.data
}

export async function deleteHoliday(id: string): Promise<void> {
  await apiClient.delete(`/admin/holidays/${id}`)
}

// Delegates
export async function fetchDelegates(): Promise<Delegate[]> {
  const res = await apiClient.get<Delegate[]>('/admin/delegates')
  return res.data
}

export async function createDelegate(data: CreateDelegateRequest): Promise<Delegate> {
  const res = await apiClient.post<Delegate>('/admin/delegates', data)
  return res.data
}

export async function deleteDelegate(id: string): Promise<void> {
  await apiClient.delete(`/admin/delegates/${id}`)
}

// Workflow Config (read-only)
export async function fetchWorkflowConfig(): Promise<WorkflowConfig[]> {
  const res = await apiClient.get<WorkflowConfig[]>('/admin/workflow-config')
  return res.data
}
