import { useState, useMemo } from 'react'
import { usePartners } from '@/api/hooks/usePartners'
import { FilterBar } from '@/pages/TeamQueue/FilterBar'
import { SearchableDropdown } from '@/components/ui/SearchableDropdown'
import { PartnerRow } from './PartnerRow'

export default function Partners() {
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [lifecycle, setLifecycle] = useState('All')
  const [product, setProduct] = useState('All')

  const filters = {
    lifecycleState: lifecycle !== 'All' ? lifecycle : undefined,
    product: product !== 'All' ? product : undefined,
  }

  const { data: allFiltered = [], isLoading } = usePartners(
    Object.values(filters).some(Boolean) ? filters : undefined,
  )

  // If a partner is selected from dropdown, show only that one; otherwise show all filtered
  const partners = selectedPartnerId
    ? allFiltered.filter((p) => p.id === selectedPartnerId)
    : allFiltered

  // Total count (unfiltered) for "Showing X of Y"
  const { data: allPartners = [] } = usePartners()

  // Build searchable dropdown options from all partners
  const searchOptions = useMemo(
    () => allPartners.map((p) => ({ label: p.name, value: p.id, sublabel: p.refId })),
    [allPartners],
  )

  const clearFilters = () => {
    setSelectedPartnerId('')
    setLifecycle('All')
    setProduct('All')
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

      {/* Filter Bar with inline partner search */}
      <FilterBar
        product={product}
        onProductChange={setProduct}
        lifecycle={lifecycle}
        onLifecycleChange={setLifecycle}
        onClear={clearFilters}
        hasExtraFilters={!!selectedPartnerId}
      >
        <SearchableDropdown
          options={searchOptions}
          value={selectedPartnerId}
          onChange={setSelectedPartnerId}
          placeholder="Search partner..."
          icon="search"
          compact
        />
      </FilterBar>

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
