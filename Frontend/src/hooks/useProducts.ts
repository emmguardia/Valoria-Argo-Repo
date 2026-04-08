import { useState, useEffect } from 'react';
import { getMockProducts, type Product } from '../data/products';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getMockProducts();
    const timer = setTimeout(() => {
      setProducts(data);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return { products, loading };
}
