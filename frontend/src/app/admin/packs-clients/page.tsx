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
  ClockIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon
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
      case 'En cours': return 'bg-blue-100 text-blue-700';
      case 'Terminé': return 'bg-gray-100 text-gray-700';
      case 'Expiré': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Packs Clients</h1>
          <p className="text-xs text-gray-600 mt-0.5">Suivi des forfaits et séances</p>
        </div>
        
        <button
          onClick={() => setShowModalAttribuer(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-medium"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Attribuer Pack
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-0.5">Total</p>
          <p className="text-lg font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-blue-500 mb-0.5">En cours</p>
          <p className="text-lg font-bold text-blue-600">{stats.en_cours}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-0.5">Terminés</p>
          <p className="text-lg font-bold text-gray-600">{stats.termines}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-red-500 mb-0.5">Expirés</p>
          <p className="text-lg font-bold text-red-600">{stats.expires}</p>
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
              placeholder="Rechercher client, pack..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="Expiré">Expiré</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : paginatedPacks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-xs text-gray-600 mb-3">Aucun pack client trouvé</p>
          <button
            onClick={() => setShowModalAttribuer(true)}
            className="px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg text-xs font-medium"
          >
            Attribuer un pack
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {paginatedPacks.map((clientPack: any) => (
              <div key={clientPack.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header du pack */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900">
                          {clientPack.client?.prenom} {clientPack.client?.nom}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatutColor(clientPack.statut)}`}>
                          {clientPack.statut}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{clientPack.pack?.nom}</p>
                    </div>
                    
                    {clientPack.statut === 'En cours' && (
                      <button
                        onClick={() => {
                          setSelectedClientPack(clientPack);
                          setShowModalConsommer(true);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg text-xs font-medium hover:shadow-md transition-all"
                      >
                        Consommer séance
                      </button>
                    )}
                  </div>

                  {/* Progression */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Progression</span>
                      <span className="text-xs font-bold text-gray-900">
                        {clientPack.nombre_seances_consommees} / {clientPack.nombre_seances_total} séances
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(clientPack)}%` }}
                      />
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                        <p className="text-gray-500">Acheté le</p>
                        <p className="font-medium text-gray-900">
                        {new Date(clientPack.date_achat).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Expire le</p>
                        <p className="font-medium text-gray-900">
                        {clientPack.date_expiration 
                            ? new Date(clientPack.date_expiration).toLocaleDateString('fr-FR')
                            : '-'
                        }
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Prix payé</p>
                        <p className="font-bold text-green-600">
                        {clientPack.montant_paye?.toLocaleString()} DH
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500">Restantes</p>
                        <p className="font-bold text-amber-600">
                        {clientPack.nombre_seances_restantes} séances
                        </p>
                    </div>
                    </div>

                   {/* Alerte si paiement partiel */}
                    {clientPack.paiement && clientPack.paiement.reste > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-xs text-red-700 mb-1">
                            💳 <strong>Reste à payer: {clientPack.paiement.reste.toFixed(2)} DH</strong>
                            </p>
                            <p className="text-xs text-red-600">
                            Statut: <span className="font-semibold">{clientPack.paiement.statut}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => {
                            // Ouvre la page paiements avec ce paiement spécifique
                            window.open(`/admin/paiements?highlight=${clientPack.paiement.id}`, '_blank');
                            }}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                            Payer
                        </button>
                        </div>
                    </div>
                    )}

                  {/* Historique toggle */}
                  {clientPack.seances && clientPack.seances.length > 0 && (
                    <button
                      onClick={() => toggleExpand(clientPack.id)}
                      className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {expandedPack === clientPack.id ? 'Masquer' : 'Voir'} l'historique ({clientPack.seances.length})
                    </button>
                  )}
                </div>

                {/* Historique des séances */}
                {expandedPack === clientPack.id && clientPack.seances && clientPack.seances.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-3">Historique des séances</h4>
                    <div className="space-y-2">
                      {clientPack.seances.map((seance: any, index: number) => (
                        <div key={seance.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-900">
                                  Séance #{clientPack.seances.length - index}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(seance.date_seance).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              {seance.prestation && (
                                <p className="text-xs text-gray-600">{seance.prestation.nom}</p>
                              )}
                              {seance.notes && (
                                <p className="text-xs text-gray-500 mt-1 italic">{seance.notes}</p>
                              )}
                            </div>
                            <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          </div>
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