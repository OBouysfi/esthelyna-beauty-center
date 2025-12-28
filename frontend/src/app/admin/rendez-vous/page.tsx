'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalNouveauRDV from '@/components/ModalNouveauRDV';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  CalendarIcon, 
  PlusIcon,
  ClockIcon,
  PhoneIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function RendezVousPage() {
  const router = useRouter();
  const [rendezVous, setRendezVous] = useState([]);
  const [filteredRDV, setFilteredRDV] = useState([]);
  const [paginatedRDV, setPaginatedRDV] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRDV, setSelectedRDV] = useState<any>(null);
  
  // Filtres
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    loadRendezVous();
  }, []);

  const loadRendezVous = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rendez-vous');
      const rdvData = data.data || data;
      setRendezVous(rdvData);
      setFilteredRDV(rdvData);
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtres locaux
  useEffect(() => {
    let filtered = [...rendezVous];

    // Recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((rdv: any) =>
        rdv.client?.nom?.toLowerCase().includes(searchLower) ||
        rdv.client?.prenom?.toLowerCase().includes(searchLower) ||
        rdv.client?.telephone?.includes(search) ||
        rdv.prestation?.nom?.toLowerCase().includes(searchLower) ||
        rdv.pack?.nom?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre statut
    if (filterStatut !== 'all') {
      filtered = filtered.filter((rdv: any) => rdv.statut === filterStatut);
    }

    // Filtre date
    if (filterDate) {
      filtered = filtered.filter((rdv: any) => 
        rdv.date_heure?.split('T')[0] === filterDate
      );
    }

    setFilteredRDV(filtered);
    setCurrentPage(1);
  }, [search, filterStatut, filterDate, rendezVous]);

  // Pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedRDV(filteredRDV.slice(startIndex, endIndex));
  }, [filteredRDV, currentPage]);

  const totalPages = Math.ceil(filteredRDV.length / itemsPerPage);

  const isRDVPassed = (dateHeure: string) => {
    const rdvDate = new Date(dateHeure);
    const now = new Date();
    return rdvDate < now;
  };

  const getRowColor = (rdv: any) => {
    // RDV passé non terminé = Rouge
    if (isRDVPassed(rdv.date_heure) && rdv.statut !== 'Terminé' && rdv.statut !== 'Annulé') {
      return 'bg-red-50 hover:bg-red-100';
    }
    return 'hover:bg-gray-50';
  };

  const updateStatus = async (id: number, newStatut: string) => {
    try {
      await api.patch(`/rendez-vous/${id}/status`, { statut: newStatut });
      
      // Mise à jour locale
      setRendezVous(rendezVous.map((rdv: any) =>
        rdv.id === id ? { ...rdv, statut: newStatut } : rdv
      ));

      Swal.fire({
        icon: 'success',
        title: 'Statut mis à jour',
        timer: 1000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de mettre à jour le statut',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
        }
      });
    }
  };

  const handleDelete = async (rdv: any) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      html: `Voulez-vous supprimer le RDV de <strong>${rdv.client?.prenom} ${rdv.client?.nom}</strong>?`,
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
        await api.delete(`/rendez-vous/${rdv.id}`);
        
        setRendezVous(rendezVous.filter((r: any) => r.id !== rdv.id));

        Swal.fire({
          icon: 'success',
          title: 'Supprimé!',
          text: 'Le rendez-vous a été supprimé',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de supprimer le rendez-vous',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
          }
        });
      }
    }
  };

  const handleRDVSaved = (savedRDV: any) => {
    if (selectedRDV) {
      setRendezVous(rendezVous.map((r: any) => 
        r.id === savedRDV.id ? savedRDV : r
      ));
    } else {
      setRendezVous([savedRDV, ...rendezVous]);
    }
    setShowModal(false);
    setSelectedRDV(null);
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Planifié': return 'bg-blue-100 text-blue-700';
      case 'Confirmé': return 'bg-green-100 text-green-700';
      case 'Terminé': return 'bg-gray-100 text-gray-700';
      case 'Annulé': return 'bg-red-100 text-red-700';
      case 'NoShow': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-xs text-gray-600 mt-0.5">Gérez vos rendez-vous</p>
        </div>
        
        <button
          onClick={() => {
            setSelectedRDV(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Nouveau RDV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Recherche */}
          <div className="md:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher client, service..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Statut */}
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="Planifié">Planifié</option>
            <option value="Confirmé">Confirmé</option>
            <option value="Terminé">Terminé</option>
            <option value="Annulé">Annulé</option>
          </select>

          {/* Date */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : paginatedRDV.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">Aucun rendez-vous trouvé</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg text-xs font-medium"
          >
            Créer un rendez-vous
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
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Date & Heure
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRDV.map((rdv: any) => {
                    if (!rdv.client) return null;
                    
                    const isPassed = isRDVPassed(rdv.date_heure) && 
                                    rdv.statut !== 'Terminé' && 
                                    rdv.statut !== 'Annulé';
                    
                    return (
                      <tr key={rdv.id} className={`transition-colors ${getRowColor(rdv)}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-amber-700 font-semibold text-xs">
                                {rdv.client.prenom?.[0] || ''}{rdv.client.nom?.[0] || ''}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {rdv.client.prenom} {rdv.client.nom}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <PhoneIcon className="h-3 w-3" />
                                {rdv.client.telephone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">
                            {rdv.prestation?.nom || rdv.pack?.nom || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg w-fit relative">
                            {isPassed && (
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500 animate-pulse" />
                              </div>
                            )}
                            <ClockIcon className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-xs font-medium text-gray-900">
                              {new Date(rdv.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-600">{rdv.duree} min</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={rdv.statut}
                            onChange={(e) => updateStatus(rdv.id, e.target.value)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(rdv.statut)}`}
                          >
                            <option value="Planifié">Planifié</option>
                            <option value="Confirmé">Confirmé</option>
                            <option value="Terminé">Terminé</option>
                            <option value="Annulé">Annulé</option>
                            <option value="NoShow">No-show</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRDV(rdv);
                                setShowModal(true);
                              }}
                              className="p-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all"
                              title="Modifier"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(rdv)}
                              className="p-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredRDV.length)} sur {filteredRDV.length} RDV
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
        <ModalNouveauRDV
          rdv={selectedRDV}
          onClose={() => {
            setShowModal(false);
            setSelectedRDV(null);
          }}
          onSuccess={handleRDVSaved}
        />
      )}
    </AdminLayout>
  );
}