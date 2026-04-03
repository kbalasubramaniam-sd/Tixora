import { useState } from 'react'
import {
  useAdminPartners,
  useCreatePartner,
  useUpdatePartner,
  useDeletePartner,
  useLinkProduct,
  useUnlinkProduct,
} from '@/api/hooks/useAdminPartners'
import type { PartnerAdmin, PartnerProductAdmin } from '@/api/endpoints/adminPartners'
import { PRODUCT_LABELS } from '@/utils/labels'
import { getInitials } from '@/utils/format'
import { LifecycleState, ProductCode } from '@/types/enums'

const ALL_PRODUCTS = [
  { code: ProductCode.RBT, label: PRODUCT_LABELS.RBT },
  { code: ProductCode.RHN, label: PRODUCT_LABELS.RHN },
  { code: ProductCode.WTQ, label: PRODUCT_LABELS.WTQ },
  { code: ProductCode.MLM, label: PRODUCT_LABELS.MLM },
]

const lifecycleBadge: Record<string, string> = {
  [LifecycleState.Live]: 'bg-teal-100 text-teal-800',
  [LifecycleState.UatCompleted]: 'bg-teal-50 text-teal-700',
  [LifecycleState.UatActive]: 'bg-amber-100 text-amber-800',
  [LifecycleState.Onboarded]: 'bg-secondary-container text-on-secondary-container',
  [LifecycleState.None]: 'bg-surface-container text-on-surface-variant',
}

export default function AdminPartners() {
  const { data: partners, isLoading, error } = useAdminPartners()
  const createPartner = useCreatePartner()
  const updatePartner = useUpdatePartner()
  const deletePartner = useDeletePartner()
  const linkProduct = useLinkProduct()
  const unlinkProduct = useUnlinkProduct()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addAlias, setAddAlias] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAlias, setEditAlias] = useState('')
  const [linkingPartnerId, setLinkingPartnerId] = useState<string | null>(null)
  const [linkProductCode, setLinkProductCode] = useState('')
  const [linkCompanyCode, setLinkCompanyCode] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const totalProducts = partners?.reduce((acc, p) => acc + p.products.length, 0) ?? 0
  const liveCount = partners?.reduce(
    (acc, p) => acc + p.products.filter((pp) => pp.lifecycleState === LifecycleState.Live).length,
    0,
  ) ?? 0

  const handleCreatePartner = () => {
    if (!addName.trim()) return
    createPartner.mutate(
      { name: addName.trim(), alias: addAlias.trim() || undefined },
      {
        onSuccess: () => {
          setShowAddForm(false)
          setAddName('')
          setAddAlias('')
        },
      },
    )
  }

  const handleUpdatePartner = (id: string) => {
    if (!editName.trim()) return
    updatePartner.mutate(
      { id, data: { name: editName.trim(), alias: editAlias.trim() || undefined } },
      { onSuccess: () => setEditingId(null) },
    )
  }

  const handleDeletePartner = (id: string, name: string) => {
    if (!confirm(`Delete partner "${name}" and all product links?`)) return
    setErrorMsg(null)
    deletePartner.mutate(id, {
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setErrorMsg(msg ?? 'Failed to delete partner')
      },
    })
  }

  const handleLinkProduct = (partnerId: string) => {
    if (!linkProductCode || !linkCompanyCode.trim()) return
    setErrorMsg(null)
    linkProduct.mutate(
      { partnerId, data: { productCode: linkProductCode, companyCode: linkCompanyCode.trim() } },
      {
        onSuccess: () => {
          setLinkingPartnerId(null)
          setLinkProductCode('')
          setLinkCompanyCode('')
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          setErrorMsg(msg ?? 'Failed to link product')
        },
      },
    )
  }

  const handleUnlinkProduct = (partnerId: string, ppId: string, productName: string) => {
    if (!confirm(`Unlink "${productName}" from this partner?`)) return
    setErrorMsg(null)
    unlinkProduct.mutate(
      { partnerId, productId: ppId },
      {
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          setErrorMsg(msg ?? 'Failed to unlink product')
        },
      },
    )
  }

  const getAvailableProducts = (partner: PartnerAdmin) => {
    const linked = new Set(partner.products.map((pp) => pp.productCode))
    return ALL_PRODUCTS.filter((p) => !linked.has(p.code))
  }

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-surface-container-low rounded w-1/3" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-surface-container-low rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-surface-container-low rounded-xl" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto">
        <div className="bg-error-container text-on-error-container p-6 rounded-xl">
          <p className="font-bold">Failed to load partners</p>
          <p className="text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary font-bold">Partners</span>
          </nav>
          <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">Partner Management</h1>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setErrorMsg(null)
          }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Add Partner
        </button>
      </header>

      {/* Error toast */}
      {errorMsg && (
        <div className="mb-6 bg-error-container text-on-error-container p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="material-symbols-outlined text-sm hover:opacity-70">
            close
          </button>
        </div>
      )}

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-none flex flex-col justify-between">
          <div>
            <p className="text-xs font-label uppercase tracking-widest text-secondary mb-1">Total Partners</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">{partners?.length ?? 0}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">business</span>
            <span className="text-[10px]">Registered companies</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-none flex flex-col justify-between">
          <div>
            <p className="text-xs font-label uppercase tracking-widest text-secondary mb-1">Product Links</p>
            <h3 className="text-3xl font-headline font-bold text-primary">{totalProducts}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">link</span>
            <span className="text-[10px]">Active product associations</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-none flex flex-col justify-between">
          <div>
            <p className="text-xs font-label uppercase tracking-widest text-secondary mb-1">Live Products</p>
            <h3 className="text-3xl font-headline font-bold text-teal-700">{liveCount}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 bg-teal-50 text-teal-700 rounded-full">Production</span>
            <span className="text-[10px] text-on-surface-variant">Fully onboarded</span>
          </div>
        </div>
      </section>

      {/* Add Partner Form */}
      {showAddForm && (
        <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-lg font-bold text-on-surface mb-4">New Partner</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-label uppercase tracking-widest text-secondary mb-1 block">Name *</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Company name"
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm transition-colors"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-label uppercase tracking-widest text-secondary mb-1 block">Alias</label>
              <input
                type="text"
                value={addAlias}
                onChange={(e) => setAddAlias(e.target.value)}
                placeholder="Short alias (optional)"
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-sm transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreatePartner}
                disabled={createPartner.isPending || !addName.trim()}
                className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPartner.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setAddName('')
                  setAddAlias('')
                }}
                className="px-6 py-2.5 rounded-lg border border-outline-variant font-bold text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Partner List */}
      <section className="space-y-4">
        {partners?.map((partner) => (
          <div key={partner.id} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            {/* Card Header */}
            <div
              className="flex items-center p-6 cursor-pointer hover:bg-surface-container-low/50 transition-colors"
              onClick={() => setExpandedId(expandedId === partner.id ? null : partner.id)}
            >
              {/* Initial circle */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm mr-4 flex-shrink-0">
                {getInitials(partner.name)}
              </div>

              {editingId === partner.id ? (
                <div className="flex-1 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editAlias}
                    onChange={(e) => setEditAlias(e.target.value)}
                    placeholder="Alias"
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                  <button
                    onClick={() => handleUpdatePartner(partner.id)}
                    disabled={updatePartner.isPending}
                    className="text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-on-surface-variant hover:text-error"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-on-surface">{partner.name}</h3>
                    {partner.alias && (
                      <span className="text-[10px] font-bold text-slate-400 bg-surface-container py-1 px-2 rounded tracking-widest">
                        {partner.alias}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {partner.products.length} product{partner.products.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              {editingId !== partner.id && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setEditingId(partner.id)
                      setEditName(partner.name)
                      setEditAlias(partner.alias ?? '')
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
                    title="Edit partner"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner.id, partner.name)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error-container transition-colors"
                    title="Delete partner"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant hover:text-error text-lg">delete</span>
                  </button>
                  <span className="material-symbols-outlined text-on-surface-variant ml-2 transition-transform duration-200" style={{ transform: expandedId === partner.id ? 'rotate(180deg)' : undefined }}>
                    expand_more
                  </span>
                </div>
              )}
            </div>

            {/* Expanded Section */}
            {expandedId === partner.id && (
              <div className="border-t border-surface-container px-6 pb-6 pt-4">
                {partner.products.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-label uppercase tracking-[0.1em] text-secondary">
                          <th className="py-3 font-semibold">Product</th>
                          <th className="py-3 font-semibold">Company Code</th>
                          <th className="py-3 font-semibold">Lifecycle</th>
                          <th className="py-3 font-semibold">Created</th>
                          <th className="py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container">
                        {partner.products.map((pp: PartnerProductAdmin) => (
                          <tr key={pp.id} className="group hover:bg-surface-container-low transition-colors">
                            <td className="py-4">
                              <span className="text-sm font-medium text-on-surface">{pp.productName}</span>
                              <span className="ml-2 text-[10px] font-bold text-slate-400 bg-surface-container py-0.5 px-1.5 rounded tracking-widest">
                                {pp.productCode}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className="px-2 py-1 bg-surface-container rounded font-mono text-xs font-bold text-on-surface">
                                {pp.companyCode}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={`${lifecycleBadge[pp.lifecycleState] ?? lifecycleBadge[LifecycleState.None]} px-3 py-1 rounded-full text-[11px] font-bold`}>
                                {pp.lifecycleState}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-on-surface-variant">
                              {new Date(pp.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => handleUnlinkProduct(partner.id, pp.id, pp.productName)}
                                className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors text-lg"
                                title="Unlink product"
                              >
                                link_off
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant py-4">No products linked yet.</p>
                )}

                {/* Link Product */}
                {linkingPartnerId === partner.id ? (
                  <div className="mt-4 flex flex-col md:flex-row gap-3 items-end bg-surface-container-low p-4 rounded-lg">
                    <div className="flex-1">
                      <label className="text-xs font-label uppercase tracking-widest text-secondary mb-1 block">Product *</label>
                      <select
                        value={linkProductCode}
                        onChange={(e) => setLinkProductCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border-none focus:ring-2 focus:ring-primary/20 text-sm"
                      >
                        <option value="">Select product...</option>
                        {getAvailableProducts(partner).map((p) => (
                          <option key={p.code} value={p.code}>{p.label} ({p.code})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-label uppercase tracking-widest text-secondary mb-1 block">Company Code *</label>
                      <input
                        type="text"
                        value={linkCompanyCode}
                        onChange={(e) => setLinkCompanyCode(e.target.value)}
                        placeholder="e.g. AAI-RBT"
                        className="w-full px-3 py-2 rounded-lg bg-white border-none focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLinkProduct(partner.id)}
                        disabled={linkProduct.isPending || !linkProductCode || !linkCompanyCode.trim()}
                        className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {linkProduct.isPending ? 'Linking...' : 'Link'}
                      </button>
                      <button
                        onClick={() => {
                          setLinkingPartnerId(null)
                          setLinkProductCode('')
                          setLinkCompanyCode('')
                        }}
                        className="px-4 py-2 rounded-lg border border-outline-variant font-bold text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  getAvailableProducts(partner).length > 0 && (
                    <button
                      onClick={() => setLinkingPartnerId(partner.id)}
                      className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Link Product
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}

        {partners?.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">group</span>
            <p className="text-lg font-medium">No partners yet</p>
            <p className="text-sm mt-1">Click "Add Partner" to create the first one.</p>
          </div>
        )}
      </section>
    </main>
  )
}
