import { ShoppingBag } from 'lucide-react';
import type { Product } from '../data/products';

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export default function ProductCard({ product, onProductClick }: ProductCardProps) {
  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-[#f59e0b]/30"
      onClick={() => onProductClick?.(product)}
    >
      <div className="h-52 relative overflow-hidden bg-[#1e3a5f]/5">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {product.isNew && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-[#f59e0b] text-[#1e3a5f] text-xs font-bold rounded-full">
            Nouveau
          </span>
        )}
      </div>
      <div className="p-6 space-y-3">
        <h3 className="font-display text-xl text-gray-900 group-hover:text-[#1e3a5f] transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between pt-3">
          <span className="text-xl font-bold text-[#1e3a5f]">{product.price} Écus</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductClick?.(product);
            }}
            className="p-3 bg-[#1e3a5f] text-white rounded-full hover:bg-[#152a45] hover:scale-110 transition-all duration-200 shadow-md"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
