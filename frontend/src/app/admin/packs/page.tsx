'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalPack from '@/components/ModalPack';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  CubeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  { id: 'all', nom: 'Toutes', color: 'bg-gray-50 text-gray-700', badge: 'bg-gray-500' },
  { id: 'cavitation', nom: 'Cavitation', color: 'bg-yellow-50 text-yellow-700', badge: 'bg-yellow-500' },
  { id: 'laser', nom: 'Laser', color: 'bg-blue-50 text-blue-700', badge: 'bg-blue-500' },
  { id: 'lumiere_pulsee', nom: 'Lumière Pulsée', color: 'bg-purple-50 text-purple-700', badge: 'bg-purple-500' },
  { id: 'cryo', nom: 'Cryo', color: 'bg-cyan-50 text-cyan-700', badge: 'bg-cyan-500' },
  { id: 'presso', nom: 'Presso', color: 'bg-green-50 text-green-700', badge: 'bg-green-500' },
  { id: 'radiofriconce', nom: 'Radio Fréquence', color: 'bg-red-50 text-red-700', badge: 'bg-red-500' },
  { id: 'carban', nom: 'Carban Pell', color: 'bg-orange-50 text-orange-700', badge: 'bg-orange-500' },
  { id: 'micro', nom: 'Micro', color: 'bg-pink-50 text-pink-700', badge: 'bg-pink-500' },
  { id: 'autres', nom: 'Autres', color: 'bg-indigo-50 text-indigo-700', badge: 'bg-indigo-500' },
];

export default function PacksPage() {
  const router = useRouter();
  const [packs, setPacks] = useState([]);
  const [filteredPacks, setFilteredPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    loadPacks();
  }, []);

  const loadPacks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/packs');
      const packsData = data.data || data;
      setPacks(packsData);
      setFilteredPacks(packsData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...packs];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((pack: any) =>
        pack.nom?.toLowerCase().includes(searchLower)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((pack: any) => pack.categorie === categoryFilter);
    }

    setFilteredPacks(filtered);
  }, [search, categoryFilter, packs]);

  const handleDelete = async (pack: any) => {
    const result = await Swal.fire({
      title: 'Supprimer?',
      text: pack.nom,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-4 py-2 bg-red-600 text-white rounded-lg mr-2',
        cancelButton: 'px-4 py-2 bg-gray-200 text-gray-800 rounded-lg'
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/packs/${pack.id}`);
        setPacks(packs.filter((p: any) => p.id !== pack.id));
        Swal.fire('Supprimé!', '', 'success');
      } catch (error) {
        Swal.fire('Erreur', '', 'error');
      }
    }
  };

  const getCategoryData = (cat: string) => {
    return CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];
  };

  return (
    <AdminLayout>
      {/* Header simple */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Packs</h1>
            <p className="text-sm text-gray-500 mt-1">{packs.length} pack(s) au total</p>
          </div>
          
          <button
            onClick={() => {
              setSelectedPack(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau Pack
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                  categoryFilter === cat.id
                    ? cat.color + ' border-2 border-current'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.nom}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Packs Grid - Clean & Simple */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#0C4DA0] mb-3"></div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      ) : filteredPacks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-2">Aucun pack</h3>
          <p className="text-sm text-gray-500 mb-4">Créez votre premier pack</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#0C4DA0] text-white rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2 text-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Créer un pack
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPacks.map((pack: any) => {
            const catData = getCategoryData(pack.categorie);
            
            return (
              <div 
                key={pack.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
                      {pack.nom}
                    </h3>
                    <span className={`${catData.badge} px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap`}>
                      {catData.nom}
                    </span>
                  </div>
                  
                  {/* Zone - Petit badge */}
                  {pack.zones && (
                    <div className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs font-medium text-blue-700">
                      <MapPinIcon className="h-3 w-3" />
                      {pack.zones} zone{pack.zones > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Prix</p>
                      <p className="text-md font-bold text-[#0C4DA0]">{pack.prix} DH</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Séances</p>
                      <p className="text-md font-bold text-gray-700">{pack.nombre_seances}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedPack(pack);
                        setShowModal(true);
                      }}
                      className="flex-1 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(pack)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ModalPack
          pack={selectedPack}
          categories={CATEGORIES}
          onClose={() => {
            setShowModal(false);
            setSelectedPack(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedPack(null);
            loadPacks();
          }}
        />
      )}
    </AdminLayout>
  );
}