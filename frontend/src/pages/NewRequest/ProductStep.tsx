import { useProducts } from '@/api/hooks/useProducts'
import type { Product } from '@/types/product'

interface ProductStepProps {
  onSelect: (product: Product) => void
}

export function ProductStep({ onSelect }: ProductStepProps) {
  const { data: products, isLoading } = useProducts()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="h-8 w-64 bg-surface-container-low rounded animate-pulse mb-2" />
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-background tracking-tight mb-2 leading-tight">
          Select a Product
        </h1>
        <p className="text-on-surface-variant text-lg font-body leading-relaxed">
          Choose the platform this request relates to
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products?.map((product) => (
          <div
            key={product.code}
            onClick={() => onSelect(product)}
            className="group relative bg-surface-container-lowest rounded-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(23,29,28,0.08)] cursor-pointer overflow-hidden"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(product) }}
          >
            {/* Decorative background icon */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">{product.bgIcon}</span>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-primary-container/10 transition-colors">
                  <span className="material-symbols-outlined text-primary">{product.icon}</span>
                </div>
                <span
                  className={
                    product.accessType === 'Portal + API'
                      ? 'bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider'
                      : 'bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider'
                  }
                >
                  {product.accessType}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-2">{product.name}</h3>
              <p className="text-on-surface-variant font-medium leading-relaxed">{product.description}</p>
              <div className="mt-8 flex items-center text-primary font-bold text-sm">
                <span>Select Platform</span>
                <span className="material-symbols-outlined ml-2 text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help section */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-surface-container-low rounded-xl p-6 flex items-center gap-6">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-tertiary">info</span>
          </div>
          <div>
            <h4 className="text-on-surface font-bold text-sm uppercase tracking-wider mb-1">Need assistance?</h4>
            <p className="text-on-surface-variant text-sm">
              If you don't see the product you need, contact your department administrator or reach out to{' '}
              <span className="text-primary underline cursor-pointer">Support</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
