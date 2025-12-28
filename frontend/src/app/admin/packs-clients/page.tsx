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
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon
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
  const [selectedSeance, setSelectedSeance] = useState<any>(null);
  const [expandedPack, setExpandedPack] = useState<number | null>(null);
  const [openMenuSeance, setOpenMenuSeance] = useState<number | null>(null);
  
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
    setSelectedSeance(null);
  };

  const handleDeleteSeance = async (seanceId: number) => {
    setOpenMenuSeance(null);
    
    const result = await Swal.fire({
      title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600;">Supprimer cette séance?</span>',
      html: '<p style="font-family: Poppins; font-size: 14px; color: #6b7280;">Action irréversible</p>',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      buttonsStyling: false,
      width: '380px',
      padding: '25px',
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        confirmButton: 'px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors',
        cancelButton: 'px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors mr-2',
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/seances/${seanceId}`);
        await loadData();
        
        Swal.fire({
          title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: #10b981;">Supprimé!</span>',
          html: '<p style="font-family: Poppins; font-size: 14px; color: #6b7280;">Séance supprimée</p>',
          timer: 1500,
          showConfirmButton: false,
          width: '350px',
          padding: '25px',
          customClass: {
            popup: 'rounded-xl shadow-2xl'
          }
        });
      } catch (error) {
        Swal.fire({
          title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: rgb(173, 18, 18);">Erreur</span>',
          html: '<p style="font-family: Poppins; font-size: 14px; color: #6b7280;">Impossible de supprimer</p>',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          width: '350px',
          padding: '25px',
          customClass: {
            popup: 'rounded-xl shadow-2xl',
            confirmButton: 'px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm'
          }
        });
      }
    }
  };

  const handleModifySeance = (seance: any, clientPack: any) => {
    setOpenMenuSeance(null);
    setSelectedSeance(seance);
    setSelectedClientPack(clientPack);
    setShowModalConsommer(true);
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

      {/* Stats */}
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

      {/* Filters */}
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

      {/* Liste */}
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

                  {/* Info Grid avec Bouton Payer dans Reste */}
                  <div className="grid grid-cols-3 gap-3 mb-4 text-xs" style={{ fontFamily: 'Poppins' }}>
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
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 mb-0.5">Reste</p>
                      <p className={`font-bold text-base mb-1 ${
                        clientPack.montant_total && clientPack.montant_paye < clientPack.montant_total 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {clientPack.montant_total && clientPack.montant_paye < clientPack.montant_total
                          ? `${(clientPack.montant_total - clientPack.montant_paye).toFixed(0)} DH`
                          : '0 DH'
                        }
                      </p>
                      {/* Bouton Payer DANS la card Reste */}
                      {clientPack.montant_total && clientPack.montant_paye < clientPack.montant_total && (
                        <button
                          onClick={async () => {
                            if (!clientPack.paiement) {
                              Swal.fire({
                                title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600;">Aucun paiement</span>',
                                html: '<p style="font-family: Poppins; font-size: 14px; color: #6b7280;">Allez dans Paiements</p>',
                                confirmButtonText: 'OK',
                                buttonsStyling: false,
                                width: '350px',
                                padding: '25px',
                                customClass: {
                                  popup: 'rounded-xl shadow-2xl',
                                  confirmButton: 'px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm'
                                }
                              });
                              return;
                            }

                            const { value: formValues } = await Swal.fire({
                              title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: #1f2937;">Ajouter un paiement</span>',
                              html: `
                                <div style="font-family: Poppins; padding: 10px;">
                                  <p style="font-size: 13px; color: #6b7280; margin-bottom: 15px;">
                                    Reste: <strong style="color: rgb(173, 18, 18); font-size: 16px;">${(clientPack.montant_total - clientPack.montant_paye).toFixed(2)} DH</strong>
                                  </p>
                                  
                                  <input 
                                    id="montant" 
                                    type="number" 
                                    placeholder="Montant" 
                                    min="0" 
                                    max="${clientPack.montant_total - clientPack.montant_paye}" 
                                    step="0.01"
                                    style="
                                      width: 100%;
                                      padding: 10px 12px;
                                      border: 1px solid #e5e7eb;
                                      border-radius: 8px;
                                      font-size: 14px;
                                      font-family: Poppins;
                                      margin-bottom: 12px;
                                      outline: none;
                                    "
                                  >
                                  
                                  <select 
                                    id="methode" 
                                    style="
                                      width: 100%;
                                      padding: 10px 12px;
                                      border: 1px solid #e5e7eb;
                                      border-radius: 8px;
                                      font-size: 14px;
                                      font-family: Poppins;
                                      outline: none;
                                      background: white;
                                    "
                                  >
                                    <option value="Espèces">Espèces</option>
                                    <option value="Carte">Carte bancaire</option>
                                    <option value="Virement">Virement</option>
                                    <option value="Chèque">Chèque</option>
                                  </select>
                                </div>
                              `,
                              width: '400px',
                              padding: '25px',
                              showCancelButton: true,
                              confirmButtonText: 'Ajouter',
                              cancelButtonText: 'Annuler',
                              buttonsStyling: false,
                              customClass: {
                                popup: 'rounded-xl shadow-2xl',
                                confirmButton: 'px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 transition-colors',
                                cancelButton: 'px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors mr-2',
                                actions: 'gap-2'
                              },
                              preConfirm: () => {
                                const montant = (document.getElementById('montant') as HTMLInputElement).value;
                                const methode = (document.getElementById('methode') as HTMLSelectElement).value;
                                
                                if (!montant || parseFloat(montant) <= 0) {
                                  Swal.showValidationMessage('Montant invalide');
                                  return false;
                                }
                                
                                if (parseFloat(montant) > (clientPack.montant_total - clientPack.montant_paye)) {
                                  Swal.showValidationMessage(`Max: ${(clientPack.montant_total - clientPack.montant_paye).toFixed(2)} DH`);
                                  return false;
                                }
                                
                                return { montant: parseFloat(montant), methode };
                              }
                            });

                            if (formValues) {
                              try {
                                await api.post(`/paiements/${clientPack.paiement.id}/ajouter`, formValues);
                                await loadData();
                                
                                Swal.fire({
                                  title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: #10b981;">Paiement ajouté!</span>',
                                  html: '<p style="font-family: Poppins; font-size: 14px; color: #6b7280; margin-top: 8px;">Succès</p>',
                                  timer: 2000,
                                  showConfirmButton: false,
                                  width: '350px',
                                  padding: '25px',
                                  customClass: {
                                    popup: 'rounded-xl shadow-2xl'
                                  }
                                });
                              } catch (error: any) {
                                Swal.fire({
                                  title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: rgb(173, 18, 18);">Erreur</span>',
                                  html: `<p style="font-family: Poppins; font-size: 14px; color: #6b7280;">${error.response?.data?.message || 'Impossible'}</p>`,
                                  confirmButtonText: 'OK',
                                  buttonsStyling: false,
                                  width: '350px',
                                  padding: '25px',
                                  customClass: {
                                    popup: 'rounded-xl shadow-2xl',
                                    confirmButton: 'px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm'
                                  }
                                });
                              }
                            }
                          }}
                          className="w-full px-2 py-0.5 text-white rounded text-xs font-medium transition-colors"
                          style={{ 
                            fontFamily: 'Poppins',
                            backgroundColor: 'rgb(173, 18, 18)',
                            fontSize: '10px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(153, 15, 15)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(173, 18, 18)'}
                        >
                          Payer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {clientPack.statut === 'En cours' && (
                      <button
                        onClick={() => {
                          setSelectedSeance(null);
                          setSelectedClientPack(clientPack);
                          setShowModalConsommer(true);
                        }}
                        className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        Consommer
                      </button>
                    )}
                    
                    {clientPack.seances && clientPack.seances.length > 0 && (
                      <button
                        onClick={() => toggleExpand(clientPack.id)}
                        className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        {expandedPack === clientPack.id ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        Historique
                      </button>
                    )}
                  </div>
                </div>

                {/* Historique avec menu 3 points */}
                {expandedPack === clientPack.id && clientPack.seances && clientPack.seances.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {clientPack.seances.map((seance: any, index: number) => (
                        <div key={seance.id} className="bg-white rounded-lg p-3 flex items-start justify-between relative">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                                #{clientPack.seances.length - index}
                              </span>
                              <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
                                {new Date(seance.date_seance).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            {seance.prestation && (
                              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins' }}>{seance.prestation.nom}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            
                            {/* Bouton 3 points */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuSeance(openMenuSeance === seance.id ? null : seance.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
                              </button>
                              
                              {/* Menu dropdown */}
                              {openMenuSeance === seance.id && (
                                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                                  <button
                                    onClick={() => handleModifySeance(seance, clientPack)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    style={{ fontFamily: 'Poppins' }}
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSeance(seance.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                    style={{ fontFamily: 'Poppins' }}
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
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
          seance={selectedSeance}
          onClose={() => {
            setShowModalConsommer(false);
            setSelectedClientPack(null);
            setSelectedSeance(null);
          }}
          onSuccess={handleSeanceConsommee}
        />
      )}
    </AdminLayout>
  );
}