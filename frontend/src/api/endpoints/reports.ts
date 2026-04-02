import { apiClient } from '@/api/client'

export interface ReportOverview {
  totalTickets: number
  openTickets: number
  completedTickets: number
  rejectedTickets: number
  cancelledTickets: number
  slaCompliancePercent: number
  slaBreachCount: number
  avgResolutionHours: number
  byProduct: { productCode: string; count: number }[]
  byTaskType: { taskType: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

export interface ReportExportParams {
  dateFrom?: string
  dateTo?: string
  productCode?: string
  taskType?: string
  status?: string
}

export async function fetchReportOverview(dateFrom?: string, dateTo?: string): Promise<ReportOverview> {
  const res = await apiClient.get<ReportOverview>('/reports/overview', {
    params: { dateFrom, dateTo },
  })
  return res.data
}

export async function exportReportCsv(params?: ReportExportParams): Promise<void> {
  const res = await apiClient.get('/reports/export', {
    params,
    responseType: 'blob',
  })
  const blob = new Blob([res.data as BlobPart], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tixora-report-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
