import { apiClient } from '@/api/client'
import { ProductCode, LifecycleState } from '@/types/enums'

export interface PartnerProductDetail {
  productCode: ProductCode
  productName: string
  lifecycleState: LifecycleState
  companyCode: string | null
}

export interface PartnerSummary {
  id: string
  name: string
  refId: string
  products: ProductCode[]
  productDetails: PartnerProductDetail[]
  lifecycleState: LifecycleState
}

const mockPartners: PartnerSummary[] = [
  {
    id: 'p-1',
    name: 'Gulf Trading LLC',
    refId: 'REF-10001',
    products: [ProductCode.RBT, ProductCode.RHN],
    productDetails: [
      { productCode: ProductCode.RBT, productName: 'Rabet', lifecycleState: LifecycleState.Live, companyCode: 'GTL-RBT' },
      { productCode: ProductCode.RHN, productName: 'Rhoon', lifecycleState: LifecycleState.Live, companyCode: 'GTL-RHN' },
    ],
    lifecycleState: LifecycleState.Live,
  },
  {
    id: 'p-2',
    name: 'Emirates Logistics Corp',
    refId: 'REF-10002',
    products: [ProductCode.RHN, ProductCode.WTQ],
    productDetails: [
      { productCode: ProductCode.RHN, productName: 'Rhoon', lifecycleState: LifecycleState.UatActive, companyCode: null },
      { productCode: ProductCode.WTQ, productName: 'Wtheeq', lifecycleState: LifecycleState.UatActive, companyCode: null },
    ],
    lifecycleState: LifecycleState.UatActive,
  },
  {
    id: 'p-3',
    name: 'Digital Solutions FZE',
    refId: 'REF-10003',
    products: [ProductCode.WTQ, ProductCode.MLM],
    productDetails: [
      { productCode: ProductCode.WTQ, productName: 'Wtheeq', lifecycleState: LifecycleState.Onboarded, companyCode: null },
      { productCode: ProductCode.MLM, productName: 'Mulem', lifecycleState: LifecycleState.Onboarded, companyCode: null },
    ],
    lifecycleState: LifecycleState.Onboarded,
  },
  {
    id: 'p-4',
    name: 'National Bank of Fujairah',
    refId: 'REF-10004',
    products: [ProductCode.MLM],
    productDetails: [
      { productCode: ProductCode.MLM, productName: 'Mulem', lifecycleState: LifecycleState.UatCompleted, companyCode: null },
    ],
    lifecycleState: LifecycleState.UatCompleted,
  },
  {
    id: 'p-5',
    name: 'Mashreq Global',
    refId: 'REF-10005',
    products: [ProductCode.RBT, ProductCode.RHN, ProductCode.WTQ],
    productDetails: [
      { productCode: ProductCode.RBT, productName: 'Rabet', lifecycleState: LifecycleState.Live, companyCode: 'MG-RBT' },
      { productCode: ProductCode.RHN, productName: 'Rhoon', lifecycleState: LifecycleState.Live, companyCode: 'MG-RHN' },
      { productCode: ProductCode.WTQ, productName: 'Wtheeq', lifecycleState: LifecycleState.Live, companyCode: 'MG-WTQ' },
    ],
    lifecycleState: LifecycleState.Live,
  },
  {
    id: 'p-6',
    name: 'Al Masah Capital',
    refId: 'REF-10006',
    products: [ProductCode.RBT],
    productDetails: [
      { productCode: ProductCode.RBT, productName: 'Rabet', lifecycleState: LifecycleState.UatActive, companyCode: null },
    ],
    lifecycleState: LifecycleState.UatActive,
  },
]

// Backend response shape
interface BackendPartner {
  id: string
  name: string
  alias: string
  products: {
    productCode: string
    productName: string
    lifecycleState: string
    companyCode: string | null
  }[]
}

// Lifecycle priority: highest state across all products
const LIFECYCLE_ORDER: LifecycleState[] = [
  LifecycleState.None,
  LifecycleState.Onboarded,
  LifecycleState.UatActive,
  LifecycleState.UatCompleted,
  LifecycleState.Live,
]

function mapBackendPartner(p: BackendPartner): PartnerSummary {
  const products = p.products.map((pp) => pp.productCode as ProductCode)
  const productDetails: PartnerProductDetail[] = p.products.map((pp) => ({
    productCode: pp.productCode as ProductCode,
    productName: pp.productName,
    lifecycleState: pp.lifecycleState as LifecycleState,
    companyCode: pp.companyCode,
  }))
  const states = p.products.map((pp) => pp.lifecycleState as LifecycleState)
  const highestState = states.reduce(
    (best, s) => (LIFECYCLE_ORDER.indexOf(s) > LIFECYCLE_ORDER.indexOf(best) ? s : best),
    LifecycleState.None,
  )
  return {
    id: p.id,
    name: p.name,
    refId: p.alias,
    products,
    productDetails,
    lifecycleState: highestState,
  }
}

export interface PartnerFilters {
  search?: string
  lifecycleState?: string
  product?: string
}

function applyFilters(partners: PartnerSummary[], filters?: PartnerFilters): PartnerSummary[] {
  let results = partners
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    results = results.filter(
      (p) => p.name.toLowerCase().includes(q) || p.refId.toLowerCase().includes(q),
    )
  }
  if (filters?.lifecycleState && filters.lifecycleState !== 'All') {
    results = results.filter((p) => p.lifecycleState === filters.lifecycleState)
  }
  if (filters?.product && filters.product !== 'All') {
    results = results.filter((p) => p.products.includes(filters.product as ProductCode))
  }
  return results
}

export async function fetchPartners(filters?: PartnerFilters): Promise<PartnerSummary[]> {
  const res = await apiClient.get<BackendPartner[]>('/partners')
  const mapped = res.data.map(mapBackendPartner)
  return applyFilters(mapped, filters)
}
