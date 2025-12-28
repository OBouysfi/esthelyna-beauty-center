'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  paiement?: any;
  onClose: () => void;
  onSuccess: (paiement: any) => void;
}

export default function ModalPaiement({ paiement, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Data
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [prestations, setPrestations] = useState([]);
  const [packs, setPacks] = useState([]);

  // Cache pour les recherches
  const searchCache = useRef<{[key: string]: any[]}>({});

  // Form
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [serviceType, setServiceType] = useState<'prestation' | 'pack'>('prestation');
  const [selectedPrestation, setSelectedPrestation] = useState<any>(null);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [formData, setFormData] = useState({
    montant_total: '',
    montant_paye: '',
    date_paiement: new Date().toISOString().split('T')[0],
    methode_paiement: 'Espèces',
    notes: ''
  });

  useEffect(() => {
    loadPrestations();
    loadPacks();
    
    if (paiement) {
      setSelectedClient(paiement.client);
      if (paiement.prestation) {
        setServiceType('prestation');
        setSelectedPrestation(paiement.prestation);
      } else if (paiement.pack) {
        setServiceType('pack');
        setSelectedPack(paiement.pack);
      }
      setFormData({
        montant_total: paiement.montant_total?.toString() || '',
        montant_paye: paiement.montant_paye?.toString() || '',
        date_paiement: paiement.date_paiement || new Date().toISOString().split('T')[0],
        methode_paiement: paiement.methode_paiement || 'Espèces',
        notes: paiement.notes || ''
      });
      setStep(3);
    }
  }, [paiement]);

  // Recherche clients OPTIMISÉE avec cache et debounce
  useEffect(() => {
    if (clientSearch.length < 2) {
      setClientResults([]);
      return;
    }

    // Vérifier le cache d'abord
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
        
        // Sauvegarder dans le cache
        searchCache.current[clientSearch] = data;
        setClientResults(data);
      } catch (error) {
        console.error('Erreur recherche clients:', error);
        setClientResults([]);
      } finally {
        setSearchingClients(false);
      }
    }, 600); // Debounce 600ms

    return () => clearTimeout(timer);
  }, [clientSearch]);

  const loadPrestations = async () => {
    try {
      const { data } = await api.get('/prestations');
      setPrestations(data.filter((p: any) => p.actif));
    } catch (err) {
      console.error('Erreur chargement prestations:', err);
    }
  };

  const loadPacks = async () => {
    try {
      const { data } = await api.get('/packs');
      setPacks(data);
    } catch (err) {
      console.error('Erreur chargement packs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        client_id: selectedClient.id,
        prestation_id: serviceType === 'prestation' ? selectedPrestation?.id : null,
        pack_id: serviceType === 'pack' ? selectedPack?.id : null,
        montant_total: parseFloat(formData.montant_total),
        montant_paye: parseFloat(formData.montant_paye),
        date_paiement: formData.date_paiement,
        methode_paiement: formData.methode_paiement,
        notes: formData.notes
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
        errorMessage = Object.values(errors)[0][0];
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
          confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
        }
      });
    }
  };

  // Auto-fill montant_total
  useEffect(() => {
    if (serviceType === 'prestation' && selectedPrestation) {
      setFormData(prev => ({ ...prev, montant_total: selectedPrestation.prix.toString() }));
    } else if (serviceType === 'pack' && selectedPack) {
      setFormData(prev => ({ ...prev, montant_total: selectedPack.prix.toString() }));
    }
  }, [selectedPrestation, selectedPack, serviceType]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {paiement ? 'Modifier Paiement' : 'Nouveau Paiement'}
            </h2>
            {!paiement && <p className="text-xs text-gray-500 mt-0.5">Étape {step} sur 3</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        {!paiement && (
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    s <= step ? 'bg-amber-500' : 'bg-gray-200'
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
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {searchingClients && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
              </div>
            )}

            {!searchingClients && clientResults.length === 0 && clientSearch.length >= 2 && (
              <p className="text-xs text-gray-500 text-center py-4">Aucun client trouvé</p>
            )}

            {clientSearch.length < 2 && clientSearch.length > 0 && (
              <p className="text-xs text-gray-500 text-center py-4">Tapez au moins 2 caractères</p>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clientResults.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setStep(2);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-700 font-semibold text-xs">
                        {client.prenom[0]}{client.nom[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.prenom} {client.nom}</p>
                      <p className="text-xs text-gray-600">{client.telephone}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Sélection Service */}
        {step === 2 && (
          <div className="p-5">
            <button
              onClick={() => setStep(1)}
              className="mb-3 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              ← Retour
            </button>

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Choisissez le service</h3>

            {/* Type Selection */}
            <div className="flex gap-2 mb-3 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setServiceType('prestation')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  serviceType === 'prestation'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Prestation
              </button>
              <button
                onClick={() => setServiceType('pack')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  serviceType === 'pack'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pack
              </button>
            </div>

            {/* Prestations */}
            {serviceType === 'prestation' && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {prestations.map((prestation: any) => (
                  <button
                    key={prestation.id}
                    onClick={() => {
                      setSelectedPrestation(prestation);
                      setStep(3);
                    }}
                    className={`w-full text-left p-3 border rounded-lg transition-colors ${
                      selectedPrestation?.id === prestation.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{prestation.nom}</p>
                        <p className="text-xs text-gray-600">{prestation.duree} min • {prestation.categorie}</p>
                      </div>
                      <p className="text-sm font-bold text-amber-600">{prestation.prix} DH</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Packs */}
            {serviceType === 'pack' && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {packs.map((pack: any) => (
                  <button
                    key={pack.id}
                    onClick={() => {
                      setSelectedPack(pack);
                      setStep(3);
                    }}
                    className={`w-full text-left p-3 border rounded-lg transition-colors ${
                      selectedPack?.id === pack.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{pack.nom}</p>
                      <p className="text-sm font-bold text-amber-600">{pack.prix} DH</p>
                    </div>
                    <p className="text-xs text-gray-600">{pack.nombre_seances_total} séances</p>
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
                className="mb-3 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                ← Retour
              </button>
            )}

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Détails du paiement</h3>

            {/* Résumé */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-700 font-semibold text-xs">
                    {selectedClient?.prenom[0]}{selectedClient?.nom[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedClient?.prenom} {selectedClient?.nom}
                  </p>
                  <p className="text-xs text-gray-600">
                    {serviceType === 'prestation' ? selectedPrestation?.nom : selectedPack?.nom}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Montants */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Montant Total (DH) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.montant_total}
                    onChange={(e) => setFormData({ ...formData, montant_total: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Montant Payé (DH) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.montant_paye}
                    onChange={(e) => setFormData({ ...formData, montant_paye: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Reste à payer */}
              {formData.montant_total && formData.montant_paye && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs text-blue-700">
                    Reste à payer: <span className="font-bold">
                      {(parseFloat(formData.montant_total) - parseFloat(formData.montant_paye)).toFixed(2)} DH
                    </span>
                  </p>
                </div>
              )}

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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Méthode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.methode_paiement}
                    onChange={(e) => setFormData({ ...formData, methode_paiement: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Carte">Carte</option>
                    <option value="Virement">Virement</option>
                    <option value="Chèque">Chèque</option>
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Notes complémentaires..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-medium text-xs disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : paiement ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}