import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchReportOverview, exportReportCsv, type ReportExportParams } from '@/api/endpoints/reports'

export function useReportOverview(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['report-overview', dateFrom, dateTo],
    queryFn: () => fetchReportOverview(dateFrom, dateTo),
  })
}

export function useExportCsv() {
  return useMutation({
    mutationFn: (params?: ReportExportParams) => exportReportCsv(params),
  })
}
