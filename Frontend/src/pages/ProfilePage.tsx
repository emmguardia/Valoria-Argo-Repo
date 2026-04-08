import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Coins, ShoppingBag, Trash2, AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';
import { useUser } from '../context/UserContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isLoggedIn, ecus, profile, purchaseHistory, updateProfile, deleteAccount } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editPseudo, setEditPseudo] = useState(profile?.pseudo ?? '');
  const [editEmail, setEditEmail] = useState(profile?.email ?? '');
  const [isEditing, setIsEditing] = useState(false);

  if (!isLoggedIn) {
    navigate('/connexion', { replace: true });
    return null;
  }

  const handleSaveProfile = () => {
    updateProfile({ pseudo: editPseudo.trim(), email: editEmail.trim() });
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    deleteAccount();
    setShowDeleteConfirm(false);
    navigate('/');
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#fefce8]">
      <SEO title="Mon profil" description="Gère tes informations personnelles et consulte ton historique d'achats." url="/profile" />
      <section className="relative py-20 bg-gradient-to-b from-[#1e3a5f] to-[#152a45] border-b border-[#f59e0b]/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#fbbf24]/90 font-medium">Compte</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">Mon profil</h1>
          <p className="text-white/85 max-w-2xl mt-4 text-lg">
            Gère tes informations personnelles et consulte ton historique d'achats.
          </p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Infos personnelles */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 p-8">
            <h2 className="font-display text-xl text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-[#1e3a5f]" />
              Informations personnelles
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Conformément au RGPD, tu peux modifier ou supprimer tes données à tout moment.
            </p>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="profile-pseudo" className="block text-sm font-medium text-gray-700 mb-2">
                    Pseudo Minecraft
                  </label>
                  <input
                    id="profile-pseudo"
                    type="text"
                    value={editPseudo}
                    onChange={(e) => setEditPseudo(e.target.value)}
                    placeholder="TonPseudo"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45] transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditPseudo(profile?.pseudo ?? '');
                      setEditEmail(profile?.email ?? '');
                    }}
                    className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Pseudo Minecraft</p>
                    <p className="font-medium text-gray-900">{profile?.pseudo || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{profile?.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-gray-500">Solde actuel</p>
                    <p className="font-bold text-[#1e3a5f]">{ecus} Écus</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditPseudo(profile?.pseudo ?? '');
                    setEditEmail(profile?.email ?? '');
                    setIsEditing(true);
                  }}
                  className="px-6 py-3 rounded-xl border-2 border-[#1e3a5f] text-[#1e3a5f] font-semibold hover:bg-[#1e3a5f]/5 transition-colors"
                >
                  Modifier mes informations
                </button>
              </div>
            )}
          </div>

          {/* Historique d'achats */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 p-8">
            <h2 className="font-display text-xl text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#1e3a5f]" />
              Historique d'achats
            </h2>
            {purchaseHistory.length > 0 ? (
              <ul className="space-y-3">
                {purchaseHistory.map((p, i) => (
                  <li
                    key={`${p.productId}-${p.date}-${i}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.productName}</p>
                      <p className="text-sm text-gray-500">{formatDate(p.date)}</p>
                    </div>
                    <span className="font-semibold text-[#1e3a5f]">{p.price} Écus</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 py-8 text-center">Aucun achat pour le moment.</p>
            )}
            <Link
              to="/boutique"
              className="mt-6 inline-block px-6 py-3 rounded-xl bg-[#1e3a5f] text-white font-semibold hover:bg-[#152a45] transition-colors"
            >
              Voir la boutique
            </Link>
          </div>

          {/* Suppression du compte */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-red-100 p-8">
            <h2 className="font-display text-xl text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Zone de danger
            </h2>
            <p className="text-gray-600 mb-6">
              La suppression de ton compte effacera toutes tes données (profil, historique, Écus). Cette action est irréversible.
            </p>
            {showDeleteConfirm ? (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="font-medium text-red-800 mb-4">Es-tu sûr de vouloir supprimer ton compte ?</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Oui, supprimer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Supprimer mon compte
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
