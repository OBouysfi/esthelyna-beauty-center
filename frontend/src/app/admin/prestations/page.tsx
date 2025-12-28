'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalPrestation from '@/components/ModalPrestation';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  SparklesIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function PrestationsPage() {
  const router = useRouter();
  const [prestations, setPrestations] = useState([]);
  const [filteredPrestations, setFilteredPrestations] = useState([]);
  const [paginatedPrestations, setPaginatedPrestations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('all');
  const [filterActif, setFilterActif] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPrestation, setSelectedPrestation] = useState<any>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prestationsRes, statsRes] = await Promise.all([
        api.get('/prestations'),
        api.get('/prestations/stats')
      ]);
      
      setPrestations(prestationsRes.data);
      setFilteredPrestations(prestationsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtres locaux (instantanés)
  useEffect(() => {
    let filtered = [...prestations];

    // Recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.nom?.toLowerCase().includes(searchLower) ||
        p.categorie?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre catégorie
    if (filterCategorie !== 'all') {
      filtered = filtered.filter((p: any) => p.categorie === filterCategorie);
    }

    // Filtre actif
    if (filterActif !== 'all') {
      filtered = filtered.filter((p: any) => 
        p.actif === (filterActif === '1')
      );
    }

    setFilteredPrestations(filtered);
    setCurrentPage(1);
  }, [search, filterCategorie, filterActif, prestations]);

  // Pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPrestations(filteredPrestations.slice(startIndex, endIndex));
  }, [filteredPrestations, currentPage]);

  const totalPages = Math.ceil(filteredPrestations.length / itemsPerPage);

  const toggleActif = async (prestation: any) => {
    try {
      await api.patch(`/prestations/${prestation.id}/toggle`);
      
      // Mise à jour locale
      setPrestations(prestations.map((p: any) =>
        p.id === prestation.id ? { ...p, actif: !p.actif } : p
      ));

      Swal.fire({
        icon: 'success',
        title: prestation.actif ? 'Désactivée' : 'Activée',
        timer: 1000,
        showConfirmButton: false
      });
    } catch (error) {
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

  const handleDelete = async (prestation: any) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      html: `Voulez-vous supprimer <strong>${prestation.nom}</strong>?`,
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
        await api.delete(`/prestations/${prestation.id}`);
        
        setPrestations(prestations.filter((p: any) => p.id !== prestation.id));

        // Reload stats
        const { data } = await api.get('/prestations/stats');
        setStats(data);

        Swal.fire({
          icon: 'success',
          title: 'Supprimée!',
          text: 'La prestation a été supprimée',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de supprimer la prestation',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
          }
        });
      }
    }
  };

  const handlePrestationSaved = async (savedPrestation: any) => {
    if (selectedPrestation) {
      setPrestations(prestations.map((p: any) => 
        p.id === savedPrestation.id ? savedPrestation : p
      ));
    } else {
      setPrestations([savedPrestation, ...prestations]);
    }

    // Reload stats
    const { data } = await api.get('/prestations/stats');
    setStats(data);

    setShowModal(false);
    setSelectedPrestation(null);
  };

  const statsCards = [
    {
      title: 'Total Prestations',
      value: stats.total,
      icon: SparklesIcon,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Actives',
      value: stats.actives,
      icon: CheckCircleIcon,
      color: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Catégories',
      value: stats.categories?.length || 0,
      icon: SparklesIcon,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600'
    }
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prestations</h1>
          <p className="text-xs text-gray-600 mt-0.5">Gérez vos services</p>
        </div>
        
        <button
          onClick={() => {
            setSelectedPrestation(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Nouvelle Prestation
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 ${stat.color} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Recherche */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une prestation..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Catégorie */}
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Toutes catégories</option>
            {stats.categories?.map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Statut */}
          <select
            value={filterActif}
            onChange={(e) => setFilterActif(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="1">Actives</option>
            <option value="0">Inactives</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : paginatedPrestations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <SparklesIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">Aucune prestation trouvée</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg text-xs font-medium"
          >
            Créer une prestation
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Prestation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Durée
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPrestations.map((prestation: any) => (
                    <tr key={prestation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{prestation.nom}</p>
                          {prestation.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{prestation.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {prestation.categorie}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-amber-600">{prestation.prix} DH</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{prestation.duree} min</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActif(prestation)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 mx-auto ${
                            prestation.actif
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {prestation.actif ? (
                            <><CheckCircleIcon className="h-3.5 w-3.5" /> Active</>
                          ) : (
                            <><XCircleIcon className="h-3.5 w-3.5" /> Inactive</>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPrestation(prestation);
                              setShowModal(true);
                            }}
                            className="p-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all"
                            title="Modifier"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prestation)}
                            className="p-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredPrestations.length)} sur {filteredPrestations.length} prestations
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
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
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <ModalPrestation
          prestation={selectedPrestation}
          onClose={() => {
            setShowModal(false);
            setSelectedPrestation(null);
          }}
          onSuccess={handlePrestationSaved}
        />
      )}
    </AdminLayout>
  );
}