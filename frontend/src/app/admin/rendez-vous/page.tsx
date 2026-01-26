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
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function RendezVousPage() {
  const router = useRouter();
  const [rendezVous, setRendezVous] = useState([]);
  const [filteredRDV, setFilteredRDV] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRDV, setSelectedRDV] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Liste par défaut
  
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

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
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...rendezVous];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((rdv: any) =>
        rdv.client?.nom?.toLowerCase().includes(searchLower) ||
        rdv.client?.prenom?.toLowerCase().includes(searchLower) ||
        rdv.client?.telephone?.includes(search)
      );
    }

    if (filterStatut !== 'all') {
      filtered = filtered.filter((rdv: any) => rdv.statut === filterStatut);
    }

    if (filterDate) {
      filtered = filtered.filter((rdv: any) => 
        rdv.date_heure?.split('T')[0] === filterDate ||
        rdv.date_heure?.split(' ')[0] === filterDate
      );
    }

    setFilteredRDV(filtered);
    setCurrentPage(1);
  }, [search, filterStatut, filterDate, rendezVous]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRDV.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRDV.length / itemsPerPage);

  const updateStatus = async (id: number, newStatut: string) => {
    try {
      await api.patch(`/rendez-vous/${id}/status`, { statut: newStatut });
      
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
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDelete = async (rdv: any) => {
    const result = await Swal.fire({
      title: 'Supprimer?',
      text: `RDV de ${rdv.client?.prenom} ${rdv.client?.nom}`,
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
        await api.delete(`/rendez-vous/${rdv.id}`);
        setRendezVous(rendezVous.filter((r: any) => r.id !== rdv.id));
        Swal.fire('Supprimé!', '', 'success');
      } catch (error) {
        Swal.fire('Erreur', '', 'error');
      }
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-blue-100 text-blue-700';
      case 'confirme': return 'bg-green-100 text-green-700';
      case 'termine': return 'bg-gray-100 text-gray-700';
      case 'annule': return 'bg-red-100 text-red-700';
      case 'absent': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (statut: string) => {
    const labels: any = {
      'planifie': 'Planifié',
      'confirme': 'Confirmé',
      'termine': 'Terminé',
      'annule': 'Annulé',
      'absent': 'Absent'
    };
    return labels[statut] || statut;
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-sm text-gray-600">{filteredRDV.length} rendez-vous</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle View */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              Cartes
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedRDV(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau RDV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg p-4 border-l-4 border-[#0C4DA0] shadow-sm">
          <p className="text-xs text-gray-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{rendezVous.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
          <p className="text-xs text-gray-600 font-medium">Confirmés</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {rendezVous.filter((r: any) => r.statut === 'confirme').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
          <p className="text-xs text-gray-600 font-medium">Planifiés</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {rendezVous.filter((r: any) => r.statut === 'planifie').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border-l-4 border-gray-500 shadow-sm">
          <p className="text-xs text-gray-600 font-medium">Terminés</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {rendezVous.filter((r: any) => r.statut === 'termine').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-transparent text-sm"
            />
          </div>
          
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-transparent text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="planifie">Planifié</option>
            <option value="confirme">Confirmé</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12 bg-white rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C4DA0]"></div>
        </div>
      ) : filteredRDV.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Aucun rendez-vous</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Vue Cartes */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((rdv: any) => {
              if (!rdv.client) return null;
              
              return (
                <div key={rdv.id} className="bg-white rounded-lg border hover:shadow-lg transition-all">
                  {/* Header */}
                  <div className="p-4 border-b bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-[#0C4DA0] font-bold">
                          {rdv.client.prenom?.[0]}{rdv.client.nom?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{rdv.client.prenom} {rdv.client.nom}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <PhoneIcon className="h-3 w-3" />
                          {rdv.client.telephone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {new Date(rdv.date_heure).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">
                        {new Date(rdv.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Service</p>
                      <p className="text-sm font-medium text-gray-900">
                        {rdv.pack?.nom || 'N/A'}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Statut</p>
                      <select
                        value={rdv.statut}
                        onChange={(e) => updateStatus(rdv.id, e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg ${getStatusColor(rdv.statut)}`}
                      >
                        <option value="planifie">Planifié</option>
                        <option value="confirme">Confirmé</option>
                        <option value="termine">Terminé</option>
                        <option value="annule">Annulé</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRDV(rdv);
                          setShowModal(true);
                        }}
                        className="flex-1 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 text-sm"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(rdv)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white font-medium"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg border p-4 flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRDV.length)} sur {filteredRDV.length}
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                  disabled={currentPage === 1} 
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <span className="text-sm font-medium">
                  Page {currentPage} / {totalPages}
                </span>
                
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                  disabled={currentPage === totalPages} 
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Vue Liste (Tableau) */
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pack</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date & Heure</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((rdv: any) => {
                    if (!rdv.client) return null;
                    
                    return (
                      <tr key={rdv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-[#0C4DA0] font-semibold text-sm">
                                {rdv.client.prenom?.[0]}{rdv.client.nom?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {rdv.client.prenom} {rdv.client.nom}
                              </p>
                              <p className="text-xs text-gray-500">{rdv.client.telephone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{rdv.pack?.nom || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Séance {rdv.numero_seance}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(rdv.date_heure).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(rdv.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={rdv.statut}
                            onChange={(e) => updateStatus(rdv.id, e.target.value)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getStatusColor(rdv.statut)}`}
                          >
                            <option value="planifie">Planifié</option>
                            <option value="confirme">Confirmé</option>
                            <option value="termine">Terminé</option>
                            <option value="annule">Annulé</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRDV(rdv);
                                setShowModal(true);
                              }}
                              className="p-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(rdv)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white"
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
            <div className="bg-white rounded-lg border p-4 flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRDV.length)} sur {filteredRDV.length}
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                  disabled={currentPage === 1} 
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <span className="text-sm font-medium">
                  Page {currentPage} / {totalPages}
                </span>
                
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                  disabled={currentPage === totalPages} 
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <ModalNouveauRDV
          rdv={selectedRDV}
          onClose={() => {
            setShowModal(false);
            setSelectedRDV(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedRDV(null);
            loadRendezVous();
          }}
        />
      )}
    </AdminLayout>
  );
}