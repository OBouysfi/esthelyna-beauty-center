'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon, MagnifyingGlassIcon,PlusIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  rdv?: any;
  onClose: () => void;
  onSuccess: (rdv: any) => void;
}

export default function ModalNouveauRDV({ rdv, onClose, onSuccess }: ModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Data
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [prestations, setPrestations] = useState([]);
  const [packs, setPacks] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);

  // Form
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [serviceType, setServiceType] = useState<'prestation' | 'pack'>('prestation');
  const [selectedPrestation, setSelectedPrestation] = useState<any>(null);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heure, setHeure] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
  loadPrestations();
  loadPacks();
  
  // Si mode édition
  if (rdv) {
    setSelectedClient(rdv.client);
    if (rdv.prestation) {
      setServiceType('prestation');
      setSelectedPrestation(rdv.prestation);
    } else if (rdv.pack) {
      setServiceType('pack');
      setSelectedPack(rdv.pack);
    }
    
    // Parser la date de manière sûre
    try {
      const rdvDate = new Date(rdv.date_heure);
      setDate(rdvDate.toISOString().split('T')[0]);
      setHeure(rdvDate.toTimeString().substring(0, 5));
    } catch (e) {
      console.error('Erreur parsing date:', e);
      setDate(new Date().toISOString().split('T')[0]);
      setHeure('');
    }
    
    setNotes(rdv.notes || '');
    setStep(3);
  }
}, [rdv]);
  // Recherche clients avec debounce
  useEffect(() => {
    if (clientSearch.length < 2) {
      setClientResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingClients(true);
      try {
        const { data } = await api.get('/clients/search', {
          params: { q: clientSearch }
        });
        setClientResults(data);
      } catch (error) {
        console.error('Erreur recherche clients:', error);
      } finally {
        setSearchingClients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearch]);

  useEffect(() => {
    if (date && (selectedPrestation || selectedPack)) {
      loadDisponibilites();
    }
  }, [date, selectedPrestation, selectedPack]);

  const loadPrestations = async () => {
    try {
      const { data } = await api.get('/prestations');
      setPrestations(data);
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

  const loadDisponibilites = async () => {
    try {
      const duree = serviceType === 'prestation' 
        ? selectedPrestation?.duree 
        : selectedPack?.prestations?.[0]?.pivot?.duree || 60;

      const { data } = await api.get('/rendez-vous/disponibilites', {
        params: { date, duree }
      });
      setDisponibilites(data);
    } catch (err) {
      console.error('Erreur chargement disponibilités:', err);
      // Générer créneaux par défaut en cas d'erreur
      const heures = [];
      for (let h = 9; h < 19; h++) {
        for (let m = 0; m < 60; m += 30) {
          heures.push({
            heure: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
            disponible: true
          });
        }
      }
      setDisponibilites(heures);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const duree = serviceType === 'prestation' 
        ? selectedPrestation.duree 
        : selectedPack.prestations[0]?.pivot?.duree || 60;

      const payload = {
        client_id: selectedClient.id,
        prestation_id: serviceType === 'prestation' ? selectedPrestation.id : null,
        pack_id: serviceType === 'pack' ? selectedPack.id : null,
        date_heure: `${date} ${heure}:00`,
        duree,
        notes
      };

      let savedRDV;
      if (rdv) {
        const { data } = await api.put(`/rendez-vous/${rdv.id}`, payload);
        savedRDV = data.rendez_vous;
        
        Swal.fire({
          icon: 'success',
          title: 'Modifié!',
          text: 'RDV modifié avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const { data } = await api.post('/rendez-vous', payload);
        savedRDV = data.rendez_vous;
        
        Swal.fire({
          icon: 'success',
          title: 'Créé!',
          text: 'RDV créé avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      }

      onSuccess(savedRDV);
    } catch (err: any) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Erreur lors de l\'enregistrement',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
        }
      });
    }
  };

  return (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            {rdv ? 'Modifier RDV' : 'Nouveau RDV'}
          </h2>
          {!rdv && <p className="text-xs text-gray-500 mt-0.5">Étape {step} sur 3</p>}
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <XMarkIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Progress Bar */}
      {!rdv && (
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Sélectionnez un client</h3>
            <button
              type="button"
              onClick={() => {
                window.open('/admin/clients', '_blank');
              }}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
            >
              <PlusIcon className="h-3 w-3" />
              Nouveau client
            </button>
          </div>
          
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Rechercher par nom, téléphone..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {searchingClients && (
            <p className="text-xs text-gray-500 text-center py-4">Recherche...</p>
          )}

          {!searchingClients && clientResults.length === 0 && clientSearch.length >= 2 && (
            <p className="text-xs text-gray-500 text-center py-4">Aucun client trouvé</p>
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

        {/* Step 3: Date et Heure */}
        {step === 3 && (
          <div className="p-5">
            {!rdv && (
              <button
                onClick={() => setStep(2)}
                className="mb-3 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                ← Retour
              </button>
            )}

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Date et heure</h3>

            {/* Résumé */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
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

            {/* Date */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Heures disponibles */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Heure disponible</label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {disponibilites.map((slot: any) => (
                  <button
                    key={slot.heure}
                    onClick={() => setHeure(slot.heure)}
                    disabled={!slot.disponible}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      heure === slot.heure
                        ? 'bg-amber-500 text-white'
                        : slot.disponible
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.heure}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Informations complémentaires..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !heure}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enregistrement...' : rdv ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}