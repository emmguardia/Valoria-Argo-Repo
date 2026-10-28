import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, MessageCircle, Package } from 'lucide-react';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import ProductModal from '../components/ProductModal';
import EcuIcon from '../components/EcuIcon';
import { useProducts } from '../hooks/useProducts';
import { useUser } from '../context/UserContext';
import { ECUS_PACKS } from '../data/ecusPacks';
import type { Product, ProductCategory } from '../data/products';

const categories: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'grades', label: 'Grades' },
  { value: 'cosmetiques', label: 'Cosmétiques' },
  { value: 'kits', label: 'Kits' },
  { value: 'avantages', label: 'Avantages' },
];

const REASSURANCE = [
  { icon: Lock, label: 'Paiement sécurisé par Stripe' },
  { icon: Package, label: 'Livré directement en jeu' },
  { icon: MessageCircle, label: 'Un souci ? Ticket sur le Discord' },
];

export default function BoutiquePage() {
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { isLoggedIn, ecus, createEcusCheckout } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPack, setPendingPack] = useState<number | null>(null);
  const [packError, setPackError] = useState<string | null>(null);

  const filteredProducts = useMemo(
    () =>
      selectedCategory === 'all'
        ? products
        : products.filter((p) => p.category === selectedCategory),
    [products, selectedCategory]
  );

  // Même flux que /ecus : Stripe renvoie sur /ecus?checkout=… qui valide le paiement
  const handleBuyPack = async (amount: number) => {
    if (!isLoggedIn) {
      navigate('/connexion');
      return;
    }
    try {
      setPackError(null);
      setPendingPack(amount);
      window.location.assign(await createEcusCheckout(amount));
    } catch (err) {
      setPackError(err instanceof Error ? err.message : 'Paiement indisponible pour le moment.');
      setPendingPack(null);
    }
  };

  return (
    <>
      <SEO
        title="Boutique"
        description="Boutique Valoria : grades, cosmétiques, kits et avantages. Achète avec des Écus, livrés directement en jeu."
        keywords="boutique, Valoria, Écus, cosmétiques, grades, kits Minecraft"
        url="/boutique"
      />

      <section className="bandeau-nuit-sombre -mt-24 px-5 pb-16 pt-36">
        <div className="mx-auto flex max-w-[75rem] flex-wrap items-end justify-between gap-8">
          <div className="min-w-0 flex-[1_1_30rem]">
            <p className="kicker">Boutique</p>
            <h1 className="mt-2.5 text-[clamp(2.5rem,5.5vw,4.25rem)] leading-[1.02] text-white [text-shadow:0_4px_0_#0a1228,0_10px_30px_rgb(0_0_0/0.5)]">
              Le trésor du royaume
            </h1>
            <p className="mt-3.5 max-w-xl text-lg font-semibold leading-relaxed text-brume-200">
              Grades, cosmétiques, kits et avantages. Tout se paie en Écus et arrive directement en jeu.
            </p>
          </div>
          <div className="flex flex-[0_1_22rem] items-center gap-4 rounded-2xl border-2 border-or/45 bg-nuit-800 px-5 py-4 shadow-[0_6px_0_#091127]">
            <EcuIcon className="h-12 w-12 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brume-600">Ton solde</p>
              <p className="font-display text-3xl text-or">{isLoggedIn ? `${ecus} Écus` : '—'}</p>
            </div>
            {isLoggedIn ? (
              <a href="#recharger" className="btn-3d btn-or min-h-[2.875rem] px-4 text-[17px]">
                Recharger
              </a>
            ) : (
              <Link to="/connexion" className="btn-3d btn-or min-h-[2.875rem] px-4 text-[17px]">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-[75rem] px-5 pb-16 pt-8">
        <div role="group" aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2.5">
          {categories.map((cat) => {
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(cat.value)}
                className={`min-h-[2.875rem] rounded-xl border-2 px-5 text-[15px] transition-colors ${
                  active
                    ? 'border-or bg-or font-black text-encre shadow-[0_4px_0_var(--color-or-fonce)]'
                    : 'border-ciel/25 bg-nuit-800 font-extrabold text-brume-300 hover:border-ciel/50 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <p className="carte mt-7 px-6 py-14 text-center text-lg font-bold text-brume-500">
            Aucun produit dans cette catégorie pour le moment.
          </p>
        )}
      </section>

      {/* Recharger */}
      <section id="recharger" className="mx-auto max-w-[75rem] scroll-mt-28 px-5 pb-14 pt-8">
        <div className="text-center">
          <p className="kicker">Recharger</p>
          <h2 className="titre-section mt-2.5 text-[clamp(2rem,4vw,2.9rem)]">Remplis ta bourse d'Écus</h2>
          <p className="mx-auto mt-3 max-w-xl text-[17px] leading-relaxed text-brume-500">
            Plus le pack est gros, plus le bonus monte. Les Écus ne sont pas des points de vote.
          </p>
        </div>
        <ul className="mt-12 grid items-end gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {ECUS_PACKS.map((pack) => (
            <li
              key={pack.ecus}
              className={`relative rounded-[1.375rem] bg-nuit-800 px-4 pb-5 text-center shadow-[0_6px_0_#091127] ${
                pack.popular ? 'border-[3px] border-ciel pt-9' : 'border-2 border-or/30 pt-6'
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ciel px-3.5 py-1.5 text-xs font-black tracking-[0.14em] text-[#062033] shadow-[0_3px_0_#1f7ea0]">
                  POPULAIRE
                </span>
              )}
              <p className="font-display text-5xl leading-none text-or [text-shadow:0_3px_0_var(--color-brique)]">
                {pack.ecus.toLocaleString('fr-FR')}
              </p>
              <p className="mt-1.5 text-[13px] font-black uppercase tracking-[0.14em] text-brume-300">Écus</p>
              <p className="mt-3 min-h-7">
                {pack.bonus && (
                  <span className="inline-block rounded-lg bg-emerald-400/15 px-2.5 py-1 text-[13px] font-black text-emerald-300">
                    Bonus {pack.bonus}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => handleBuyPack(pack.ecus)}
                disabled={pendingPack !== null}
                className="btn-3d btn-or mt-4 w-full"
              >
                {pendingPack === pack.ecus ? 'Redirection…' : pack.price}
                <span className="sr-only"> pour {pack.ecus} Écus</span>
              </button>
            </li>
          ))}
        </ul>
        {packError && (
          <p role="alert" className="mt-6 rounded-xl border-2 border-red-400/40 bg-red-500/10 px-5 py-4 text-center font-bold text-red-200">
            {packError}
          </p>
        )}
      </section>

      {/* Réassurance */}
      <section className="mx-auto max-w-[75rem] px-5 pb-24">
        <ul className="grid gap-4 md:grid-cols-3">
          {REASSURANCE.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3.5 rounded-2xl border-2 border-ciel/12 bg-nuit-850 p-5 font-extrabold">
              <Icon className="h-7 w-7 shrink-0 text-ciel" strokeWidth={2.2} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
