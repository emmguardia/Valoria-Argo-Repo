export type ProductCategory = 'cosmetiques' | 'avantages' | 'kits' | 'grades';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: ProductCategory;
  description?: string;
  isNew?: boolean;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Particule Flamme',
    price: 299,
    image: 'https://placehold.co/400x400/1e3a5f/fbbf24?text=Particule',
    category: 'cosmetiques',
    description: 'Particules de flamme autour de ton personnage.',
    isNew: true,
  },
  {
    id: 2,
    name: 'Grade VIP',
    price: 999,
    image: 'https://placehold.co/400x400/1e3a5f/fbbf24?text=VIP',
    category: 'grades',
    description: 'Accès au grade VIP avec avantages exclusifs.',
    isNew: true,
  },
  {
    id: 3,
    name: 'Kit Démarrage Premium',
    price: 499,
    image: 'https://placehold.co/400x400/1e3a5f/fbbf24?text=Kit',
    category: 'kits',
    description: 'Kit de démarrage avec équipement amélioré.',
  },
  {
    id: 4,
    name: 'Fly 7 jours',
    price: 199,
    image: 'https://placehold.co/400x400/1e3a5f/fbbf24?text=Fly',
    category: 'avantages',
    description: 'Capacité de vol pendant 7 jours.',
  },
  {
    id: 5,
    name: 'Particule Cœur',
    price: 249,
    image: 'https://placehold.co/400x400/1e3a5f/fbbf24?text=Coeur',
    category: 'cosmetiques',
    description: 'Particules de cœurs autour de ton personnage.',
  },
  {
    id: 6,
    name: 'Grade MVP',
    price: 1999,
    image: 'https://placehold.co/400x400/1e3a5f/fbbf24?text=MVP',
    category: 'grades',
    description: 'Grade MVP avec tous les avantages.',
  },
];

export function getMockProducts(): Product[] {
  return MOCK_PRODUCTS;
}
