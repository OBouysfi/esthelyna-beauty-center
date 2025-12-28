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
  ClockIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

export default function PaiementsPage() {
  const router = useRouter();
  
  const [paiements, setPaiements] = useState([]);
  const [filteredPaiements, setFilteredPaiements] = useState([]);
  const [paginatedPaiements, setPaginatedPaiements] = useState([]);
  const [stats, setStats] = useState({
    total_revenu: 0,
    total_impaye: 0,
    paiements_aujourdhui: 0,
    paiements_mois: 0,
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedPeriode, setSelectedPeriode] = useState('mois');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
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


  useEffect(() => {
    if (!loading) {
      loadAnalytics();
    }
  }, [selectedPeriode]);

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
      
      await loadAnalytics();
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get('/paiements/analytics', {
        params: { periode: selectedPeriode }
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Erreur analytics:', error);
    }
  };

  useEffect(() => {
    let filtered = [...paiements];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.client?.nom?.toLowerCase().includes(searchLower) ||
        p.client?.prenom?.toLowerCase().includes(searchLower) ||
        p.prestation?.nom?.toLowerCase().includes(searchLower) ||
        p.pack?.nom?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatut !== 'all') {
      filtered = filtered.filter((p: any) => p.statut === filterStatut);
    }

    if (filterMethode !== 'all') {
      filtered = filtered.filter((p: any) => p.methode_paiement === filterMethode);
    }

    if (dateDebut && dateFin) {
      filtered = filtered.filter((p: any) => {
        const date = new Date(p.date_paiement);
        return date >= new Date(dateDebut) && date <= new Date(dateFin);
      });
    }

    setFilteredPaiements(filtered);
    setCurrentPage(1);
  }, [search, filterStatut, filterMethode, dateDebut, dateFin, paiements]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPaiements(filteredPaiements.slice(startIndex, endIndex));
  }, [filteredPaiements, currentPage]);

  const totalPages = Math.ceil(filteredPaiements.length / itemsPerPage);

  const handleDelete = async (paiement: any) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      html: `Voulez-vous supprimer ce paiement?`,
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
        await api.delete(`/paiements/${paiement.id}`);
        
        setPaiements(paiements.filter((p: any) => p.id !== paiement.id));

        const { data: statsData } = await api.get('/paiements/stats');
        setStats(statsData);
        await loadAnalytics();

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
          text: 'Impossible de supprimer le paiement',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
          }
        });
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
    await loadAnalytics();

    setShowModal(false);
    setSelectedPaiement(null);
  };

  const handleAjouterPaiement = async (paiement: any) => {
    const { value: formValues } = await Swal.fire({
      title: `Ajouter un paiement`,
      html: `
        <div class="text-left">
          <p class="text-sm mb-3 text-gray-700">Reste à payer: <strong class="text-red-600">${paiement.reste} DH</strong></p>
          <input 
            id="montant" 
            type="number" 
            class="swal2-input" 
            placeholder="Montant" 
            min="0" 
            max="${paiement.reste}" 
            step="0.01"
            style="font-size: 14px;"
          >
          <select id="methode" class="swal2-input" style="font-size: 14px;">
            <option value="Espèces">Espèces</option>
            <option value="Carte">Carte</option>
            <option value="Virement">Virement</option>
            <option value="Chèque">Chèque</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Ajouter',
      cancelButtonText: 'Annuler',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm mr-2',
        cancelButton: 'px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm',
        title: 'text-base font-semibold text-gray-900',
        htmlContainer: 'text-sm'
      },
      preConfirm: () => {
        const montant = (document.getElementById('montant') as HTMLInputElement).value;
        const methode = (document.getElementById('methode') as HTMLSelectElement).value;
        
        if (!montant || parseFloat(montant) <= 0) {
          Swal.showValidationMessage('Veuillez entrer un montant valide');
          return false;
        }
        
        if (parseFloat(montant) > paiement.reste) {
          Swal.showValidationMessage(`Le montant ne peut pas dépasser ${paiement.reste} DH`);
          return false;
        }
        
        return { montant: parseFloat(montant), methode };
      }
    });

    if (formValues) {
      try {
        const { data } = await api.post(`/paiements/${paiement.id}/ajouter`, formValues);
        
        const paiementMisAJour = data.paiement;
        
        setPaiements(paiements.map((p: any) => 
          p.id === paiementMisAJour.id ? paiementMisAJour : p
        ));
        
        Promise.all([
          api.get('/paiements/stats'),
          api.get('/paiements/analytics', { params: { periode: selectedPeriode } })
        ]).then(([statsRes, analyticsRes]) => {
          setStats(statsRes.data);
          setAnalytics(analyticsRes.data);
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Paiement ajouté!',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error: any) {
        console.error('Erreur:', error);
        
        const errorMessage = error.response?.data?.message || 'Impossible d\'ajouter le paiement';
        
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
          }
        });
      }
    }
  };

  const genererRecu = (paiement: any) => {
    const recu = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Poppins', sans-serif; color: #1a1a1a; background: white; width: 210mm; height: 297mm; padding: 20mm; position: relative; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(217, 119, 6, 0.03); font-weight: 700; z-index: 0; pointer-events: none; }
          .container { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }
          .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 15px; border-bottom: 3px solid #d97706; margin-bottom: 20px; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { width: 70px; height: 70px; }
          .logo img { width: 100%; height: 100%; object-fit: contain; }
          .company-info h1 { font-size: 22px; color: #d97706; margin-bottom: 3px; font-weight: 600; letter-spacing: 0.5px; }
          .company-info p { font-size: 10px; color: #666; line-height: 1.4; font-weight: 400; }
          .recu-badge { text-align: right; }
          .recu-badge h2 { font-size: 18px; color: #1a1a1a; margin-bottom: 5px; font-weight: 600; }
          .recu-badge p { font-size: 9px; color: #888; font-weight: 400; }
          .recu-number { font-size: 11px; color: #d97706; font-weight: 600; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-card { background: #fafafa; padding: 12px; border-left: 2px solid #d97706; }
          .info-card h3 { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 500; }
          .info-card .client-name { font-size: 15px; color: #1a1a1a; font-weight: 600; margin-bottom: 4px; }
          .info-card p { font-size: 10px; color: #555; line-height: 1.5; font-weight: 400; }
          .detail-row { display: flex; justify-content: space-between; font-size: 10px; color: #666; margin: 3px 0; font-weight: 400; }
          .detail-row strong { color: #1a1a1a; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          thead { background: #1a1a1a; color: white; }
          th { padding: 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
          th:last-child, td:last-child { text-align: right; }
          td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 11px; color: #333; font-weight: 400; }
          .service-name { font-weight: 600; color: #1a1a1a; }
          .service-duration { font-size: 9px; color: #888; margin-top: 2px; font-weight: 400; }
          .amount { font-weight: 600; color: #1a1a1a; }
          .paid-amount { color: #059669; }
          .remaining-amount { color: #dc2626; }
          .total-section { background: #fafafa; padding: 15px; margin-top: auto; }
          .total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
          .total-row.main { border-top: 2px solid #d97706; padding-top: 12px; margin-top: 8px; }
          .total-label { font-size: 11px; color: #666; font-weight: 400; }
          .total-label.main { font-size: 13px; font-weight: 600; color: #1a1a1a; }
          .total-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }
          .total-value.main { font-size: 18px; color: #d97706; font-weight: 700; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 3px; font-size: 10px; font-weight: 600; border: 1.5px solid; }
          .status-paye { color: #065f46; border-color: #065f46; background: transparent; }
          .status-partiel { color: #9a3412; border-color: #9a3412; background: transparent; }
          .status-impaye { color: #991b1b; border-color: #991b1b; background: transparent; }
          .notes-section { background: #fafafa; padding: 12px; margin: 15px 0; border-left: 2px solid #d97706; }
          .notes-section h4 { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 500; }
          .notes-section p { font-size: 10px; color: #555; line-height: 1.6; font-weight: 400; }
          .footer { margin-top: auto; padding-top: 15px; border-top: 1px solid #eee; }
          .footer-content { display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-area { text-align: right; }
          .signature-line { width: 180px; border-top: 1.5px solid #1a1a1a; margin-top: 40px; padding-top: 6px; font-size: 9px; color: #888; font-weight: 400; }
          .footer-note { font-size: 8px; color: #999; line-height: 1.5; font-weight: 400; }
          .footer-note strong { color: #666; font-weight: 600; }
          @media print { body { margin: 0; padding: 20mm; } .container { page-break-after: avoid; } }
        </style>
      </head>
      <body>
        <div class="watermark">ESTHELYNA</div>
        <div class="container">
          <div class="header">
            <div class="logo-section">
              <div class="logo"><img src="/logo.png" alt="Esthelyna"></div>
              <div class="company-info">
                <h1>ESTHELYNA BEAUTY CENTER</h1>
                <p>Centre de Beauté & Bien-être</p>
                <p style="margin-top: 2px;">Casablanca, Maroc</p>
              </div>
            </div>
            <div class="recu-badge">
              <h2>REÇU DE PAIEMENT</h2>
              <p class="recu-number">N° ${String(paiement.id).padStart(6, '0')}</p>
              <p style="margin-top: 4px;">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <h3>Informations Client</h3>
              <div class="client-name">${paiement.client?.prenom} ${paiement.client?.nom}</div>
            </div>
            <div class="info-card">
              <h3>Détails de la Transaction</h3>
              <div class="detail-row">
                <span>Date de paiement:</span>
                <strong>${new Date(paiement.date_paiement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
              </div>
              <div class="detail-row">
                <span>Méthode:</span>
                <strong>${paiement.methode_paiement}</strong>
              </div>
              <div class="detail-row">
                <span>Statut:</span>
                <span class="status-badge status-${paiement.statut.toLowerCase()}">${paiement.statut.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="service-name">${paiement.prestation?.nom || paiement.pack?.nom || 'Service'}</div>
                  ${paiement.prestation?.duree ? `<div class="service-duration">${paiement.prestation.duree} minutes</div>` : ''}
                </td>
                <td class="amount">${paiement.montant_total.toLocaleString()} DH</td>
              </tr>
            </tbody>
          </table>
          ${paiement.notes ? `<div class="notes-section"><h4>Notes</h4><p>${paiement.notes}</p></div>` : ''}
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Montant Total</span>
              <span class="total-value">${paiement.montant_total.toLocaleString()} DH</span>
            </div>
            <div class="total-row">
              <span class="total-label paid-amount">Montant Payé</span>
              <span class="total-value paid-amount">${paiement.montant_paye.toLocaleString()} DH</span>
            </div>
            ${paiement.reste > 0 ? `<div class="total-row"><span class="total-label remaining-amount">Reste à Payer</span><span class="total-value remaining-amount">${paiement.reste.toLocaleString()} DH</span></div>` : ''}
            <div class="total-row main">
              <span class="total-label main">Montant de ce Paiement</span>
              <span class="total-value main">${paiement.montant_paye.toLocaleString()} DH</span>
            </div>
          </div>
          <div class="footer">
            <div class="footer-content">
              <div>
                <p class="footer-note"><strong>Merci pour votre confiance</strong><br>Ce document fait foi de paiement et ne peut être remboursé.<br>Pour toute question, veuillez nous contacter.</p>
              </div>
              <div class="signature-area">
                <div class="signature-line">Signature & Cachet</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '', 'height=842,width=595');
    if (printWindow) {
      printWindow.document.write(recu);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 300);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Payé': return 'bg-green-100 text-green-700';
      case 'Partiel': return 'bg-orange-100 text-orange-700';
      case 'Impayé': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getMethodeIcon = (methode: string) => {
    switch (methode) {
      case 'Espèces': return '';
      case 'Carte': return '';
      case 'Virement': return '';
      case 'Chèque': return '';
      default: return '';
    }
  };

  const exportData = () => {
    const csv = [
      ['Date', 'Client', 'Service', 'Montant Total', 'Montant Payé', 'Reste', 'Statut', 'Méthode'].join(','),
      ...filteredPaiements.map((p: any) => [
        new Date(p.date_paiement).toLocaleDateString('fr-FR'),
        `${p.client?.prenom} ${p.client?.nom}`,
        p.prestation?.nom || p.pack?.nom || '-',
        p.montant_total,
        p.montant_paye,
        p.reste,
        p.statut,
        p.methode_paiement
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Paiements</h1>
          <p className="text-xs text-gray-600 mt-0.5">Suivez vos revenus</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={exportData} className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 transition-all text-xs font-medium">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            Export
          </button>
          <button onClick={() => { setSelectedPaiement(null); setShowModal(true); }} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-medium">
            <PlusIcon className="h-3.5 w-3.5" />
            Nouveau
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-0.5">Aujourd'hui</p>
          <p className="text-lg font-bold text-gray-900">{stats.paiements_aujourdhui.toLocaleString()} DH</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-0.5">Ce Mois</p>
          <p className="text-lg font-bold text-gray-900">{stats.paiements_mois.toLocaleString()} DH</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-red-500 mb-0.5">Impayés</p>
          <p className="text-lg font-bold text-red-600">{stats.total_impaye.toLocaleString()} DH</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-amber-600 mb-0.5">Total</p>
          <p className="text-lg font-bold text-amber-600">{stats.total_revenu.toLocaleString()} DH</p>
        </div>
      </div>

      {analytics && (
        <div className="bg-white rounded-lg border-t-4 border-amber-500 p-5 mb-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Revenu</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Populaire</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{analytics.periode_data?.label}</h2>
              <p className="text-sm text-gray-600">Suivi de vos revenus selon la période sélectionnée</p>
            </div>
            <select value={selectedPeriode} onChange={(e) => setSelectedPeriode(e.target.value)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-medium">
              <option value="mois">Ce Mois</option>
              <option value="3mois">3 Derniers Mois</option>
              <option value="6mois">6 Derniers Mois</option>
              <option value="annee">Cette Année</option>
              <option value="annee_precedente">Année Précédente</option>
              <option value="total">Total (Tout)</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span className="text-xs">Mis à jour en temps réel</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-600">{analytics.periode_data?.montant?.toLocaleString() || 0} DH</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <div className="md:col-span-2 relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
          </div>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent">
            <option value="all">Tous statuts</option>
            <option value="Payé">Payé</option>
            <option value="Partiel">Partiel</option>
            <option value="Impayé">Impayé</option>
          </select>
          <select value={filterMethode} onChange={(e) => setFilterMethode(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent">
            <option value="all">Toutes méthodes</option>
            <option value="Espèces">Espèces</option>
            <option value="Carte">Carte</option>
            <option value="Virement">Virement</option>
            <option value="Chèque">Chèque</option>
          </select>
          <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Date début" />
          <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Date fin" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : paginatedPaiements.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <CreditCardIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-xs text-gray-600 mb-3">Aucun paiement trouvé</p>
          <button onClick={() => setShowModal(true)} className="px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg text-xs font-medium">Créer un paiement</button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Client</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Service</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Montants</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Méthode</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900 uppercase">Statut</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPaiements.map((paiement: any) => (
                    <tr
                      key={paiement.id}
className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <p className="text-xs text-gray-900">{new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-700 font-semibold text-xs">{paiement.client?.prenom?.[0]}{paiement.client?.nom?.[0]}</span>
                          </div>
                          <p className="text-xs font-medium text-gray-900">{paiement.client?.prenom} {paiement.client?.nom}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-xs text-gray-900">{paiement.prestation?.nom || paiement.pack?.nom || '-'}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs">
                          <p className="text-gray-600">Total: <span className="font-bold text-gray-900">{paiement.montant_total} DH</span></p>
                          <p className="text-green-600">Payé: <span className="font-bold">{paiement.montant_paye} DH</span></p>
                          {paiement.reste > 0 && <p className="text-red-600">Reste: <span className="font-bold">{paiement.reste} DH</span></p>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs flex items-center gap-1">{getMethodeIcon(paiement.methode_paiement)} {paiement.methode_paiement}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(paiement.statut)}`}>{paiement.statut}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          {paiement.statut === 'Partiel' && (
                            <button onClick={() => handleAjouterPaiement(paiement)} className="p-1 bg-green-600 text-white rounded-lg hover:shadow-md transition-all" title="Ajouter un paiement">
                              <PlusIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => genererRecu(paiement)} className="p-1 bg-blue-600 text-white rounded-lg hover:shadow-md transition-all" title="Imprimer reçu">
                            <PrinterIcon className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setSelectedPaiement(paiement); setShowModal(true); }} className="p-1 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all">
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(paiement)} className="p-1 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all">
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
              <p className="text-xs text-gray-600">{((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredPaiements.length)} sur {filteredPaiements.length}</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  <ChevronLeftIcon className="h-3.5 w-3.5 text-gray-600" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-2.5 py-1 text-xs font-medium rounded-lg ${currentPage === page ? 'bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                      {page}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  <ChevronRightIcon className="h-3.5 w-3.5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

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