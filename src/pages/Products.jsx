import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Package, ChevronRight } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*, requests(id, title, companies(name))')
        .order('created_at', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <div className="bg-brand-navy px-5 pt-4 pb-5">
        <p className="text-brand-blue text-xs font-medium tracking-widest uppercase mb-1">All</p>
        <h1 className="text-white text-2xl font-semibold">Products</h1>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center shadow-sm">
            <Package size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No products yet</p>
            <p className="text-gray-300 text-xs mt-1">Add products from within a request</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {products.map(p => (
              <Link key={p.id} to={`/products/${p.id}`} className="flex items-center px-4 py-4 active:bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center mr-3 flex-shrink-0">
                  <Package size={17} className="text-brand-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-brand-navy truncate">{p.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {p.requests?.companies?.name} · {p.sku || 'No SKU'}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
