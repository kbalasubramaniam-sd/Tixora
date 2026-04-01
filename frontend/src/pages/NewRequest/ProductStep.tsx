import { useProducts } from '@/api/hooks/useProducts'
import type { Product } from '@/types/product'

interface ProductStepProps {
  onSelect: (product: Product) => void
}

export function ProductStep({ onSelect }: ProductStepProps) {
  const { data: products, isLoading } = useProducts()

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="h-10 w-64 bg-surface-container-low rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-surface-container-low rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-8 animate-pulse h-52" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-on-surface mb-2 font-headline">
          Select a Product
        </h1>
        <p className="text-lg text-on-surface-variant font-body">
          Choose the platform this request relates to
        </p>
      </header>

      {/* Product Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {products?.map((product) => (
          <button
            key={product.code}
            onClick={() => onSelect(product)}
            className="text-left group bg-surface-container-lowest p-8 rounded-xl shadow-md shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 outline-none focus:ring-2 focus:ring-primary/20"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-xl ${product.iconBg} flex items-center justify-center ${product.iconColor}`}>
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{product.icon}</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {product.accessType === 'Portal + API' ? (
                  <>
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Portal</span>
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">API</span>
                  </>
                ) : (
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">API Only</span>
                )}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-1">{product.name}</h3>
            <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant opacity-70">
              {product.description}
            </p>
            <div className="mt-8 flex items-center text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Select Product
              <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
