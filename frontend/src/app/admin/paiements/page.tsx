'use client';

import { useState, useEffect } from 'react';
import { useRouter} from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalPaiement from '@/components/ModalPaiement';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  CreditCardIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function PaiementsPage() {
  const router = useRouter();
  
  const [paiements, setPaiements] = useState([]);
  const [filteredPaiements, setFilteredPaiements] = useState([]);
  const [paginatedPaiements, setPaginatedPaiements] = useState([]);
  const [stats, setStats] = useState({
    total_revenu: 0,
    paiements_aujourdhui: 0,
    paiements_mois: 0,
    nombre_paiements: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMethode, setFilterMethode] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<any>(null);
  
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
      const [paiementsRes, statsRes] = await Promise.all([
        api.get('/paiements'),
        api.get('/paiements/stats')
      ]);
      
      setPaiements(paiementsRes.data);
      setFilteredPaiements(paiementsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...paiements];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.client?.nom?.toLowerCase().includes(searchLower) ||
        p.client?.prenom?.toLowerCase().includes(searchLower) ||
        p.client_pack?.pack?.nom?.toLowerCase().includes(searchLower)
      );
    }

    if (filterMethode !== 'all') {
      filtered = filtered.filter((p: any) => p.methode === filterMethode);
    }

    if (dateDebut && dateFin) {
      filtered = filtered.filter((p: any) => {
        const date = new Date(p.date_paiement);
        return date >= new Date(dateDebut) && date <= new Date(dateFin);
      });
    }

    setFilteredPaiements(filtered);
    setCurrentPage(1);
  }, [search, filterMethode, dateDebut, dateFin, paiements]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPaiements(filteredPaiements.slice(startIndex, endIndex));
  }, [filteredPaiements, currentPage]);

  const totalPages = Math.ceil(filteredPaiements.length / itemsPerPage);

  const handleDelete = async (paiement: any) => {
    const result = await Swal.fire({
      title: 'Supprimer ce paiement?',
      text: `${paiement.montant} DH`,
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
        await api.delete(`/paiements/${paiement.id}`);
        setPaiements(paiements.filter((p: any) => p.id !== paiement.id));
        
        const { data: statsData } = await api.get('/paiements/stats');
        setStats(statsData);

        Swal.fire('Supprimé!', '', 'success');
      } catch (error) {
        Swal.fire('Erreur', '', 'error');
      }
    }
  };

  const handlePaiementSaved = async (savedPaiement: any) => {
    if (selectedPaiement) {
      setPaiements(paiements.map((p: any) => 
        p.id === savedPaiement.id ? savedPaiement : p
      ));
    } else {
      setPaiements([savedPaiement, ...paiements]);
    }

    const { data: statsData } = await api.get('/paiements/stats');
    setStats(statsData);

    setShowModal(false);
    setSelectedPaiement(null);
  };

  const genererRecu = (paiement: any) => {
    const recu = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0C4DA0; padding-bottom: 20px; }
          .header h1 { color: #0C4DA0; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .info { margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-row label { font-weight: bold; color: #333; }
          .info-row value { color: #666; }
          .total { margin-top: 30px; text-align: right; font-size: 20px; font-weight: bold; color: #0C4DA0; }
          .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REÇU DE PAIEMENT</h1>
          <p>N° ${String(paiement.id).padStart(6, '0')}</p>
          <p>${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        
        <div class="info">
          <div class="info-row">
            <label>Client:</label>
            <value>${paiement.client?.prenom} ${paiement.client?.nom}</value>
          </div>
          <div class="info-row">
            <label>Date:</label>
            <value>${new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</value>
          </div>
          <div class="info-row">
            <label>Méthode:</label>
            <value>${paiement.methode}</value>
          </div>
          <div class="info-row">
            <label>Pack:</label>
            <value>${paiement.rendez_vous?.pack?.nom || paiement.client_pack?.pack?.nom || '-'}</value>
          </div>
          ${paiement.notes ? `
          <div class="info-row">
            <label>Notes:</label>
            <value>${paiement.notes}</value>
          </div>
          ` : ''}
        </div>
        
        <div class="total">
          Montant: ${paiement.montant} DH
        </div>
        
        <div class="footer">
          <p>Merci pour votre confiance</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(recu);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 300);
    }
  };

  const exportData = () => {
    const csv = [
      ['Date', 'Client', 'Pack', 'Montant', 'Méthode', 'Notes'].join(','),
      ...filteredPaiements.map((p: any) => [
        new Date(p.date_paiement).toLocaleDateString('fr-FR'),
        `${p.client?.prenom} ${p.client?.nom}`,
        p.client_pack?.pack?.nom || '-',
        p.montant,
        p.methode,
        p.notes || '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getMethodeLabel = (methode: string) => {
    const labels: any = {
      'especes': 'Espèces',
      'carte': 'Carte',
      'virement': 'Virement',
      'cheque': 'Chèque'
    };
    return labels[methode] || methode;
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Paiements</h1>
            <p className="text-sm text-gray-500 mt-1">{stats.nombre_paiements} paiement(s) au total</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={exportData} 
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#0C4DA0] text-[#0C4DA0] rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Exporter
            </button>
            <button 
              onClick={() => { setSelectedPaiement(null); setShowModal(true); }} 
              className="flex items-center gap-2 px-4 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Nouveau Paiement
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-900">{stats.paiements_aujourdhui.toLocaleString()} DH</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Ce Mois</p>
              <p className="text-3xl font-bold text-gray-900">{stats.paiements_mois.toLocaleString()} DH</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border-l-4 border-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Total Revenu</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_revenu.toLocaleString()} DH</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <BanknotesIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border-l-4 border-orange-500 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Nombre</p>
              <p className="text-3xl font-bold text-gray-900">{stats.nombre_paiements}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl">
              <CreditCardIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Rechercher par client ou pack..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all" 
            />
          </div>
          
          <select 
            value={filterMethode} 
            onChange={(e) => setFilterMethode(e.target.value)} 
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all"
          >
            <option value="all">Toutes méthodes</option>
            <option value="especes">Espèces</option>
            <option value="carte">Carte</option>
            <option value="virement">Virement</option>
            <option value="cheque">Chèque</option>
          </select>

          <div className="flex gap-2">
            <input 
              type="date" 
              value={dateDebut} 
              onChange={(e) => setDateDebut(e.target.value)} 
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0]" 
              placeholder="Date début" 
            />
            <input 
              type="date" 
              value={dateFin} 
              onChange={(e) => setDateFin(e.target.value)} 
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0]" 
              placeholder="Date fin" 
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#0C4DA0] mb-3"></div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      ) : paginatedPaiements.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CreditCardIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-2">Aucun paiement</h3>
          <p className="text-sm text-gray-500 mb-4">Créez votre premier paiement</p>
          <button 
            onClick={() => setShowModal(true)} 
            className="px-4 py-2 bg-[#0C4DA0] text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Créer un paiement
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pack</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Méthode</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedPaiements.map((paiement: any) => (
                    <tr key={paiement.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {paiement.client?.prenom?.[0]}{paiement.client?.nom?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {paiement.client?.prenom} {paiement.client?.nom}
                            </p>
                            <p className="text-xs text-gray-500">ID: {paiement.client?.id}</p>
                          </div>
                        </div>
                      </td>
                     <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          {paiement.rendez_vous?.pack?.nom || paiement.client_pack?.pack?.nom || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-lg font-bold text-[#0C4DA0]">{paiement.montant} DH</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{getMethodeLabel(paiement.methode)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => genererRecu(paiement)} 
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
                            title="Imprimer"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => { setSelectedPaiement(paiement); setShowModal(true); }} 
                            className="p-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(paiement)} 
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPaiements.length)} sur {filteredPaiements.length}
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                  disabled={currentPage === 1} 
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button 
                      key={page} 
                      onClick={() => setCurrentPage(page)} 
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-[#0C4DA0] text-white'
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
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <ModalPaiement
          paiement={selectedPaiement}
          onClose={() => { setShowModal(false); setSelectedPaiement(null); }}
          onSuccess={handlePaiementSaved}
        />
      )}
    </AdminLayout>
  );
}