import { useState } from 'react'
import { usePartners } from '@/api/hooks/usePartners'
import { ApiError } from '@/components/ui/ApiError'
import { FilterBar } from '@/pages/TeamQueue/FilterBar'
import { PartnerRow } from './PartnerRow'

export default function Partners() {
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [lifecycle, setLifecycle] = useState('All')
  const [product, setProduct] = useState('All')

  const filters = {
    lifecycleState: lifecycle !== 'All' ? lifecycle : undefined,
    product: product !== 'All' ? product : undefined,
  }

  const { data: allFiltered = [], isLoading, isError, refetch } = usePartners(
    Object.values(filters).some(Boolean) ? filters : undefined,
  )

  // If a partner is selected from dropdown, show only that one; otherwise show all filtered
  const partners = selectedPartnerId
    ? allFiltered.filter((p) => p.id === selectedPartnerId)
    : allFiltered

  // Total count (unfiltered) for "Showing X of Y"
  const { data: allPartners = [] } = usePartners()


  const clearFilters = () => {
    setSelectedPartnerId('')
    setLifecycle('All')
    setProduct('All')
  }

  if (isError) {
    return <ApiError title="Failed to load partners" message="Could not fetch partner data from the server." onRetry={() => refetch()} />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-on-background font-headline">Partners</h1>
        <p className="text-on-surface-variant mt-2 text-lg">Manage and explore Tixora's global partner network.</p>
      </header>

      {/* Search Bar */}
      <section className="mb-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-primary transition-transform group-focus-within:scale-110">search</span>
          </div>
          <input
            type="text"
            value={selectedPartnerId ? allPartners.find((p) => p.id === selectedPartnerId)?.name ?? '' : ''}
            onChange={(e) => {
              const match = allPartners.find((p) => p.name.toLowerCase().includes(e.target.value.toLowerCase()))
              setSelectedPartnerId(match ? match.id : '')
            }}
            className="w-full bg-surface-container-low border-none rounded-full py-5 pl-16 pr-8 text-on-surface text-lg font-medium focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest shadow-sm transition-all duration-300 placeholder-slate-400"
            placeholder="Search by partner name or account reference"
          />
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar
        product={product}
        onProductChange={setProduct}
        lifecycle={lifecycle}
        onLifecycleChange={setLifecycle}
        onClear={clearFilters}
      />

      {/* Result Count */}
      <div className="mb-4 text-sm text-on-surface-variant">
        Showing <span className="font-bold text-on-surface">{partners.length}</span> of{' '}
        <span className="font-bold text-on-surface">{allPartners.length}</span> partners
      </div>

      {/* Partner List */}
      {partners.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">business</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">No partners found</h3>
          <p className="text-sm text-on-surface-variant">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <PartnerRow key={partner.id} partner={partner} />
          ))}
        </div>
      )}

      {/* Pagination (decorative for mock data) */}
      {partners.length > 0 && (
        <footer className="mt-12 flex items-center justify-between">
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="text-on-surface font-bold">1-{partners.length}</span> of{' '}
            <span className="text-on-surface font-bold">{partners.length}</span> partners
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-surface-container-low text-slate-400 hover:bg-secondary-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">first_page</span>
            </button>
            <button className="p-2 rounded-lg bg-surface-container-low text-slate-400 hover:bg-secondary-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex items-center px-4 gap-4">
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-xs font-bold shadow-md">1</span>
            </div>
            <button className="p-2 rounded-lg bg-surface-container-low text-slate-400 hover:bg-secondary-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button className="p-2 rounded-lg bg-surface-container-low text-slate-400 hover:bg-secondary-container hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">last_page</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
