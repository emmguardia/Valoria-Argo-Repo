import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import ProductModal from '../components/ProductModal';
import { useProducts } from '../hooks/useProducts';
import type { Product, ProductCategory } from '../data/products';

const categories: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les produits' },
  { value: 'cosmetiques', label: 'Cosmétiques' },
  { value: 'avantages', label: 'Avantages' },
  { value: 'kits', label: 'Kits' },
  { value: 'grades', label: 'Grades' },
];

export default function BoutiquePage() {
  const { products, loading } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProducts = useMemo(
    () =>
      selectedCategory === 'all'
        ? products
        : products.filter((p) => p.category === selectedCategory),
    [products, selectedCategory]
  );

  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO
        title="Boutique"
        description="Boutique Valoria : cosmétiques, grades, kits et avantages. Achète avec des Écus."
        keywords="boutique, Valoria, Écus, cosmétiques, grades, kits Minecraft"
        url="/boutique"
      />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Boutique</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">
            Boutique Valoria
          </h1>
          <p className="text-white/85 max-w-2xl mt-4 text-lg">
            Achète des cosmétiques, grades et avantages avec des Écus. Personnalise ton expérience sur le serveur.
          </p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-200/60 flex flex-wrap items-center justify-between gap-4">
            <p className="text-gray-700 text-sm">
              Les produits se paient en <strong>Écus</strong>. Les Écus sont différents des points de vote.
            </p>
            <Link
              to="/ecus"
              className="px-5 py-2.5 bg-[#1e3a5f] text-white font-semibold rounded-lg hover:bg-[#152a45] transition-colors text-sm"
            >
              Acheter des Écus
            </Link>
          </div>
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Catégories</h2>
            <nav className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === cat.value
                      ? 'bg-[#1e3a5f] text-white shadow-lg shadow-slate-900/20'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f] hover:shadow-md'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={(p) => {
                    setSelectedProduct(p);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">Aucun produit dans cette catégorie.</div>
          )}
        </div>
      </section>
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
