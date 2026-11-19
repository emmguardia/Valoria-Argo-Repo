export type ProductCategory = 'cosmetiques' | 'avantages' | 'kits' | 'grades';

export interface Product {
  id: number;
  /** Identifiant du produit côté serveur (achat : POST /api/shop/purchase) */
  slug?: string;
  name: string;
  price: number;
  image: string;
  category: ProductCategory;
  description?: string;
  isNew?: boolean;
}
