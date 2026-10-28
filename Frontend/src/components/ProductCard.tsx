import type { Product } from '../data/products';
import EcuIcon from './EcuIcon';

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

const CATEGORY_LABEL: Record<Product['category'], string> = {
  grades: 'Grade',
  cosmetiques: 'Cosmétique',
  kits: 'Kit',
  avantages: 'Avantage',
};

export default function ProductCard({ product, onProductClick }: ProductCardProps) {
  return (
    <article className="carte carte-survol flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-nuit-700">
        <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        {product.isNew && (
          <span className="absolute left-3.5 top-3.5 rounded-lg bg-ciel px-2.5 py-1 text-xs font-black tracking-[0.12em] text-[#062033]">
            NOUVEAU
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 pb-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brume-600">{CATEGORY_LABEL[product.category]}</p>
        <h3 className="mt-1.5 text-2xl text-white">{product.name}</h3>
        {product.description && <p className="mt-2 line-clamp-2 flex-1 leading-relaxed text-brume-400">{product.description}</p>}
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-display text-2xl text-or">
            <EcuIcon className="h-[22px] w-[22px]" />
            {product.price}
            <span className="sr-only">Écus</span>
          </span>
          <button
            type="button"
            onClick={() => onProductClick?.(product)}
            className="btn-3d btn-or min-h-[2.875rem] px-4 text-[17px]"
          >
            Voir<span className="sr-only"> {product.name}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
