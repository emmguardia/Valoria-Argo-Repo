import { useEffect, useState } from 'react';
import type { Product, ProductCategory } from '../data/products';

interface ApiProduct {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  priceEcus: number;
  imageUrl: string | null;
  isNew: boolean;
}

function placeholderImage(name: string) {
  const label = encodeURIComponent(name.slice(0, 16));
  return `https://placehold.co/400x400/1e3a5f/fbbf24?text=${label}`;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/products');
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || `Erreur ${res.status}`);
        if (cancelled) return;
        const items = (payload.items || []) as ApiProduct[];
        const mapped: Product[] = items.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.priceEcus,
          image: p.imageUrl?.trim() ? p.imageUrl : placeholderImage(p.name),
          category: p.category,
          description: p.description ?? undefined,
          isNew: p.isNew,
        }));
        setProducts(mapped);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { products, loading, error };
}
