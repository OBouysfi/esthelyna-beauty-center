'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon, MagnifyingGlassIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  paiement?: any;
  onClose: () => void;
  onSuccess: (paiement: any) => void;
}

export default function ModalPaiement({ paiement, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingRdvs, setLoadingRdvs] = useState(false);
  const [step, setStep] = useState(1);
  
  // Data
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [clientRdvs, setClientRdvs] = useState([]);

  // Cache
  const searchCache = useRef<{[key: string]: any[]}>({});

  // Form
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedRdv, setSelectedRdv] = useState<any>(null);
  const [formData, setFormData] = useState({
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    methode: 'especes',
    notes: ''
  });

  useEffect(() => {
    if (paiement) {
      setSelectedClient(paiement.client);
      setSelectedRdv(paiement.rendez_vous);
      setFormData({
        montant: paiement.montant?.toString() || '',
        date_paiement: paiement.date_paiement || new Date().toISOString().split('T')[0],
        methode: paiement.methode || 'especes',
        notes: paiement.notes || ''
      });
      setStep(3);
    }
  }, [paiement]);

  // Recherche clients avec debounce
  useEffect(() => {
    if (clientSearch.length < 2) {
      setClientResults([]);
      return;
    }

    if (searchCache.current[clientSearch]) {
      setClientResults(searchCache.current[clientSearch]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingClients(true);
      try {
        const { data } = await api.get('/clients/search', {
          params: { q: clientSearch }
        });
        
        searchCache.current[clientSearch] = data;
        setClientResults(data);
      } catch (error) {
        console.error('Erreur recherche:', error);
        setClientResults([]);
      } finally {
        setSearchingClients(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [clientSearch]);

  // Charger les RDV du client
  const loadClientRdvs = async (clientId: number) => {
    setLoadingRdvs(true);
    try {
      const { data } = await api.get(`/clients/${clientId}/rendez-vous`);
      setClientRdvs(data);
    } catch (error) {
      console.error('Erreur chargement RDV:', error);
      setClientRdvs([]);
      
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Impossible de charger les rendez-vous de ce client',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'px-4 py-2 bg-[#0C4DA0] text-white rounded-lg'
        }
      });
    } finally {
      setLoadingRdvs(false);
    }
  };

  const handleClientSelect = async (client: any) => {
    if (loadingRdvs) return; // Évite les clics multiples
    
    setSelectedClient(client);
    await loadClientRdvs(client.id);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Évite la double soumission
    
    setLoading(true);

    try {
      const payload = {
        client_id: selectedClient.id,
        client_pack_id: selectedRdv?.client_pack_id || null,
        rendez_vous_id: selectedRdv?.id || null,
        montant: parseFloat(formData.montant),
        date_paiement: formData.date_paiement,
        methode: formData.methode,
        notes: formData.notes || null
      };

      let savedPaiement;
      
      if (paiement) {
        const { data } = await api.put(`/paiements/${paiement.id}`, payload);
        savedPaiement = data.paiement;
        
        Swal.fire({
          icon: 'success',
          title: 'Modifié!',
          text: 'Paiement modifié avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const { data } = await api.post('/paiements', payload);
        savedPaiement = data.paiement;
        
        Swal.fire({
          icon: 'success',
          title: 'Créé!',
          text: 'Paiement créé avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      }
      
      onSuccess(savedPaiement);
      
    } catch (err: any) {
      setLoading(false);
      
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
        }
      });
    }
  };

  const getStatusColor = (statut: string) => {
    const colors: any = {
      'planifie': 'bg-blue-100 text-blue-700',
      'confirme': 'bg-green-100 text-green-700',
      'termine': 'bg-gray-100 text-gray-700',
      'annule': 'bg-red-100 text-red-700'
    };
    return colors[statut] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (statut: string) => {
    const labels: any = {
      'planifie': 'Planifié',
      'confirme': 'Confirmé',
      'termine': 'Terminé',
      'annule': 'Annulé'
    };
    return labels[statut] || statut;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0C4DA0] px-5 py-3.5 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h2 className="text-base font-bold text-white">
              {paiement ? 'Modifier le paiement' : 'Nouveau paiement'}
            </h2>
            {!paiement && <p className="text-xs text-blue-100 mt-0.5">Étape {step} sur 3</p>}
          </div>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        {!paiement && (
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-[#0C4DA0]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Sélection Client */}
        {step === 1 && (
          <div className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sélectionnez un client</h3>
            
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Tapez au moins 2 caractères..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all"
                autoFocus
              />
            </div>

            {searchingClients && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C4DA0]"></div>
              </div>
            )}

            {!searchingClients && clientResults.length === 0 && clientSearch.length >= 2 && (
              <p className="text-xs text-gray-500 text-center py-8">Aucun client trouvé</p>
            )}

            {clientSearch.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-8">Commencez à taper pour rechercher</p>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clientResults.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  disabled={loadingRdvs}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-[#0C4DA0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[#0C4DA0] font-semibold text-sm">
                        {client.prenom?.[0] || ''}{client.nom?.[0] || ''}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {client.prenom} {client.nom}
                      </p>
                      <p className="text-xs text-gray-600">{client.telephone}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Sélection RDV */}
        {step === 2 && (
          <div className="p-5">
            <button
              onClick={() => setStep(1)}
              disabled={loadingRdvs}
              className="mb-3 text-xs text-[#0C4DA0] hover:text-blue-700 font-medium disabled:opacity-50"
            >
              ← Retour
            </button>

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Choisissez le rendez-vous</h3>

            {loadingRdvs ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0C4DA0] mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Chargement des rendez-vous...</p>
                </div>
              </div>
            ) : clientRdvs.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-700 mb-2">Aucun rendez-vous</p>
                <p className="text-xs text-gray-500">Ce client n'a pas de rendez-vous planifié ou confirmé</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {clientRdvs.map((rdv: any) => (
                  <button
                    key={rdv.id}
                    onClick={() => {
                      setSelectedRdv(rdv);
                      setStep(3);
                    }}
                    className={`w-full text-left p-3 border rounded-lg transition-all ${
                      selectedRdv?.id === rdv.id
                        ? 'border-[#0C4DA0] bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-[#0C4DA0]" />
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(rdv.date_heure).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(rdv.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(rdv.statut)}`}>
                        {getStatusLabel(rdv.statut)}
                      </span>
                    </div>
                    <div className="text-xs">
                      <p className="font-medium text-gray-900">{rdv.pack?.nom || 'Pack non défini'}</p>
                      <p className="text-gray-600 mt-0.5">Séance n° {rdv.numero_seance}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Détails Paiement */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="p-5">
            {!paiement && (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="mb-3 text-xs text-[#0C4DA0] hover:text-blue-700 font-medium disabled:opacity-50"
              >
                ← Retour
              </button>
            )}

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Détails du paiement</h3>

            {/* Résumé */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#0C4DA0] font-semibold text-sm">
                    {selectedClient?.prenom?.[0] || ''}{selectedClient?.nom?.[0] || ''}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedClient?.prenom} {selectedClient?.nom}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedRdv?.pack?.nom || 'Pack'} - Séance {selectedRdv?.numero_seance || ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Montant */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Montant (DH) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  min="0"
                  step="0.01"
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Date et Méthode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date_paiement}
                    onChange={(e) => setFormData({ ...formData, date_paiement: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Méthode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.methode}
                    onChange={(e) => setFormData({ ...formData, methode: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte</option>
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Notes complémentaires..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-3 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                )}
                {loading ? 'En cours...' : paiement ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}