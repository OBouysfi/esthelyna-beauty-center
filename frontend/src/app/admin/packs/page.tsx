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
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function PacksPage() {
  const router = useRouter();
  const [packs, setPacks] = useState([]);
  const [filteredPacks, setFilteredPacks] = useState([]);
  const [paginatedPacks, setPaginatedPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActif, setFilterActif] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
      setPacks(data);
      setFilteredPacks(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...packs];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.nom?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filterActif !== 'all') {
      filtered = filtered.filter((p: any) => p.actif === (filterActif === '1'));
    }

    setFilteredPacks(filtered);
    setCurrentPage(1);
  }, [search, filterActif, packs]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPacks(filteredPacks.slice(startIndex, endIndex));
  }, [filteredPacks, currentPage]);

  const totalPages = Math.ceil(filteredPacks.length / itemsPerPage);

  const toggleActif = async (pack: any) => {
    const newActif = !pack.actif;
    
    setPacks(packs.map((p: any) =>
      p.id === pack.id ? { ...p, actif: newActif } : p
    ));

    try {
      await api.patch(`/packs/${pack.id}/toggle`);
    } catch (error) {
      setPacks(packs.map((p: any) =>
        p.id === pack.id ? { ...p, actif: !newActif } : p
      ));
      
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de modifier le statut',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
        }
      });
    }
  };

  const handleDelete = async (pack: any) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      html: `Voulez-vous supprimer le pack <strong>${pack.nom}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm mr-2',
        cancelButton: 'px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm'
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/packs/${pack.id}`);
        
        setPacks(packs.filter((p: any) => p.id !== pack.id));

        Swal.fire({
          icon: 'success',
          title: 'Supprimé!',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de supprimer le pack',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
          }
        });
      }
    }
  };

  const handlePackSaved = (savedPack: any) => {
    if (selectedPack) {
      setPacks(packs.map((p: any) => 
        p.id === savedPack.id ? savedPack : p
      ));
    } else {
      setPacks([savedPack, ...packs]);
    }

    setShowModal(false);
    setSelectedPack(null);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Packs & Forfaits</h1>
          <p className="text-xs text-gray-600 mt-0.5">Gérez vos offres groupées</p>
        </div>
        
        <button
          onClick={() => {
            setSelectedPack(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-medium"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Nouveau Pack
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-0.5">Total Packs</p>
          <p className="text-lg font-bold text-gray-900">{packs.length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-green-500 mb-0.5">Actifs</p>
          <p className="text-lg font-bold text-green-600">{packs.filter((p: any) => p.actif).length}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-0.5">Inactifs</p>
          <p className="text-lg font-bold text-gray-600">{packs.filter((p: any) => !p.actif).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterActif}
            onChange={(e) => setFilterActif(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="1">Actifs</option>
            <option value="0">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Packs Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : paginatedPacks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-xs text-gray-600 mb-3">Aucun pack trouvé</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg text-xs font-medium"
          >
            Créer un pack
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {paginatedPacks.map((pack: any) => (
              <div key={pack.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{pack.nom}</h3>
                    {pack.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{pack.description}</p>
                    )}
                  </div>
                  
                  <div 
                    onClick={() => toggleActif(pack)}
                    className={`w-9 h-5 rounded-full cursor-pointer transition-all duration-200 relative flex-shrink-0 ml-2 ${
                      pack.actif ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={pack.actif ? 'Actif' : 'Inactif'}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${
                      pack.actif ? 'right-0.5' : 'left-0.5'
                    }`}></div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Prix:</span>
                    <span className="font-bold text-amber-600">{pack.prix} DH</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Séances:</span>
                    <span className="font-bold text-gray-900">{pack.nombre_seances_total}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Validité:</span>
                    <span className="font-bold text-gray-900">{pack.validite_jours} jours</span>
                  </div>
                </div>

                {pack.prestations && pack.prestations.length > 0 && (
                  <div className="mb-3 pb-3 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Prestations incluses:</p>
                    <div className="space-y-1">
                      {pack.prestations.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{p.nom}</span>
                          <span className="text-gray-900 font-medium">{p.pivot.nombre_seances}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPack(pack);
                      setShowModal(true);
                    }}
                    className="flex-1 p-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all text-xs font-medium"
                  >
                    <PencilIcon className="h-3.5 w-3.5 mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(pack)}
                    className="flex-1 p-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all text-xs font-medium"
                  >
                    <TrashIcon className="h-3.5 w-3.5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredPacks.length)} sur {filteredPacks.length}
              </p>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 text-gray-600" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <ModalPack
          pack={selectedPack}
          onClose={() => {
            setShowModal(false);
            setSelectedPack(null);
          }}
          onSuccess={handlePackSaved}
        />
      )}
    </AdminLayout>
  );
}