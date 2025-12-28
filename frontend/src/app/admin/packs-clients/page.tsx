'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalAttribuerPack from '@/components/ModalAttribuerPack';
import ModalConsommerSeance from '@/components/ModalConsommerSeance';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  CubeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

export default function PacksClientsPage() {
  const router = useRouter();
  const [clientPacks, setClientPacks] = useState([]);
  const [filteredPacks, setFilteredPacks] = useState([]);
  const [paginatedPacks, setPaginatedPacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    en_cours: 0,
    termines: 0,
    expires: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [showModalAttribuer, setShowModalAttribuer] = useState(false);
  const [showModalConsommer, setShowModalConsommer] = useState(false);
  const [selectedClientPack, setSelectedClientPack] = useState<any>(null);
  const [expandedPack, setExpandedPack] = useState<number | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

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
      const [packsRes, statsRes] = await Promise.all([
        api.get('/client-packs'),
        api.get('/client-packs/stats')
      ]);
      
      setClientPacks(packsRes.data);
      setFilteredPacks(packsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...clientPacks];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((cp: any) =>
        cp.client?.nom?.toLowerCase().includes(searchLower) ||
        cp.client?.prenom?.toLowerCase().includes(searchLower) ||
        cp.pack?.nom?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatut !== 'all') {
      filtered = filtered.filter((cp: any) => cp.statut === filterStatut);
    }

    setFilteredPacks(filtered);
    setCurrentPage(1);
  }, [search, filterStatut, clientPacks]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPacks(filteredPacks.slice(startIndex, endIndex));
  }, [filteredPacks, currentPage]);

  const totalPages = Math.ceil(filteredPacks.length / itemsPerPage);

  const handlePackAttribue = async () => {
    await loadData();
    setShowModalAttribuer(false);
  };

  const handleSeanceConsommee = async () => {
    await loadData();
    setShowModalConsommer(false);
    setSelectedClientPack(null);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En cours': return 'bg-green-100 text-green-700 border-green-200';
      case 'Terminé': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Expiré': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressPercentage = (cp: any) => {
    return (cp.nombre_seances_consommees / cp.nombre_seances_total) * 100;
  };

  const toggleExpand = (id: number) => {
    setExpandedPack(expandedPack === id ? null : id);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>Packs Clients</h1>
          <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Poppins' }}>Suivi des forfaits</p>
        </div>
        
        <button
          onClick={() => setShowModalAttribuer(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm font-medium"
          style={{ fontFamily: 'Poppins' }}
        >
          <PlusIcon className="h-4 w-4" />
          Attribuer Pack
        </button>
      </div>

      {/* Stats - Ligne simple */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins' }}>Total</p>
          <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-green-600 mb-1" style={{ fontFamily: 'Poppins' }}>En cours</p>
          <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Poppins' }}>{stats.en_cours}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins' }}>Terminés</p>
          <p className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Poppins' }}>{stats.termines}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-red-600 mb-1" style={{ fontFamily: 'Poppins' }}>Expirés</p>
          <p className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Poppins' }}>{stats.expires}</p>
        </div>
      </div>

      {/* Filters - Épurés */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            style={{ fontFamily: 'Poppins' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="Expiré">Expiré</option>
          </select>
        </div>
      </div>

      {/* Liste - Design Cards Épuré */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-amber-500"></div>
        </div>
      ) : paginatedPacks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <CubeIcon className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Poppins' }}>Aucun pack trouvé</p>
          <button
            onClick={() => setShowModalAttribuer(true)}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
            style={{ fontFamily: 'Poppins' }}
          >
            Attribuer un pack
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {paginatedPacks.map((clientPack: any) => (
              <div key={clientPack.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-700 font-bold text-sm">
                            {clientPack.client?.prenom?.[0]}{clientPack.client?.nom?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                            {clientPack.client?.prenom} {clientPack.client?.nom}
                          </h3>
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>{clientPack.pack?.nom}</p>
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatutColor(clientPack.statut)}`} style={{ fontFamily: 'Poppins' }}>
                      {clientPack.statut}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>Progression</span>
                      <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                        {clientPack.nombre_seances_consommees}/{clientPack.nombre_seances_total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-amber-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(clientPack)}%` }}
                      />
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs" style={{ fontFamily: 'Poppins' }}>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">Expire le</p>
                      <p className="font-medium text-gray-900">
                        {clientPack.date_expiration 
                          ? new Date(clientPack.date_expiration).toLocaleDateString('fr-FR')
                          : '-'
                        }
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">Restantes</p>
                      <p className="font-bold text-amber-600 text-base">
                        {clientPack.nombre_seances_restantes}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {clientPack.statut === 'En cours' && (
                      <button
                        onClick={() => {
                          setSelectedClientPack(clientPack);
                          setShowModalConsommer(true);
                        }}
                        className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        Consommer séance
                      </button>
                    )}
                    
                    {clientPack.seances && clientPack.seances.length > 0 && (
                      <button
                        onClick={() => toggleExpand(clientPack.id)}
                        className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        {expandedPack === clientPack.id ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        Historique ({clientPack.seances.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Historique */}
                {expandedPack === clientPack.id && clientPack.seances && clientPack.seances.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {clientPack.seances.map((seance: any, index: number) => (
                        <div key={seance.id} className="bg-white rounded-lg p-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                                Séance #{clientPack.seances.length - index}
                              </span>
                              <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
                                {new Date(seance.date_seance).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            {seance.prestation && (
                              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins' }}>{seance.prestation.nom}</p>
                            )}
                          </div>
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-amber-500 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ fontFamily: 'Poppins' }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showModalAttribuer && (
        <ModalAttribuerPack
          onClose={() => setShowModalAttribuer(false)}
          onSuccess={handlePackAttribue}
        />
      )}

      {showModalConsommer && selectedClientPack && (
        <ModalConsommerSeance
          clientPack={selectedClientPack}
          onClose={() => {
            setShowModalConsommer(false);
            setSelectedClientPack(null);
          }}
          onSuccess={handleSeanceConsommee}
        />
      )}
    </AdminLayout>
  );
}