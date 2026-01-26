'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  rdv?: any;
  onClose: () => void;
  onSuccess: (rdv: any) => void;
}

export default function ModalNouveauRDV({ rdv, onClose, onSuccess }: ModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [packs, setPacks] = useState([]);
  const [disponibilites, setDisponibilites] = useState([]);

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heure, setHeure] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPacks();
    
    if (rdv) {
      setSelectedClient(rdv.client);
      if (rdv.pack) {
        setSelectedPack(rdv.pack);
      }
      
      try {
        const rdvDate = new Date(rdv.date_heure);
        setDate(rdvDate.toISOString().split('T')[0]);
        setHeure(rdvDate.toTimeString().substring(0, 5));
      } catch (e) {
        console.error('Erreur:', e);
        setDate(new Date().toISOString().split('T')[0]);
        setHeure('');
      }
      
      setNotes(rdv.notes || '');
      setStep(3);
    }
  }, [rdv]);

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
        console.error('Erreur:', error);
      } finally {
        setSearchingClients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearch]);

  useEffect(() => {
    if (date && selectedPack) {
      loadDisponibilites();
    }
  }, [date, selectedPack]);

  const loadPacks = async () => {
    try {
      const { data } = await api.get('/packs');
      setPacks(data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const loadDisponibilites = async () => {
    try {
      const duree = selectedPack?.duree_seance || 60;
      const { data } = await api.get('/rendez-vous/disponibilites', {
        params: { date, duree }
      });
      setDisponibilites(data);
    } catch (err) {
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
      const payload = {
        client_id: selectedClient.id,
        pack_id: selectedPack.id,
        date_heure: `${date} ${heure}:00`,
        duree: selectedPack.duree_seance || 60,
        notes
      };

      if (rdv) {
        await api.put(`/rendez-vous/${rdv.id}`, payload);
        Swal.fire({
          icon: 'success',
          title: 'Modifié!',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await api.post('/rendez-vous', payload);
        Swal.fire({
          icon: 'success',
          title: 'Créé!',
          timer: 1500,
          showConfirmButton: false
        });
      }

      onSuccess(payload);
    } catch (err: any) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Une erreur est survenue',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {rdv ? 'Modifier RDV' : 'Nouveau RDV'}
            </h2>
            {!rdv && <p className="text-xs text-gray-500 mt-1">Étape {step} sur 3</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Progress */}
        {!rdv && (
          <div className="px-5 py-3 bg-gray-50 border-b">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full ${
                    s <= step ? 'bg-[#0C4DA0]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Client */}
        {step === 1 && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Sélectionnez un client</h3>
              <button
                onClick={() => window.open('/admin/clients', '_blank')}
                className="text-xs text-[#0C4DA0] hover:text-red-600 font-medium flex items-center gap-1"
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
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0]"
                autoFocus
              />
            </div>

            {searchingClients && (
              <p className="text-xs text-center py-4">Recherche...</p>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clientResults.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setStep(2);
                  }}
                  className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-[#0C4DA0] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-[#0C4DA0] font-semibold text-xs">
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

        {/* Step 2: Pack */}
        {step === 2 && (
          <div className="p-5">
            <button
              onClick={() => setStep(1)}
              className="mb-3 text-xs text-[#0C4DA0] hover:text-red-600 font-medium"
            >
              ← Retour
            </button>

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Choisissez le pack</h3>

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
                      ? 'border-[#0C4DA0] bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{pack.nom}</p>
                    <p className="text-sm font-bold text-[#0C4DA0]">{pack.prix} DH</p>
                  </div>
                  <p className="text-xs text-gray-600">{pack.nombre_seances} séances</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date */}
        {step === 3 && (
          <div className="p-5">
            {!rdv && (
              <button
                onClick={() => setStep(2)}
                className="mb-3 text-xs text-[#0C4DA0] hover:text-red-600 font-medium"
              >
                ← Retour
              </button>
            )}

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Date et heure</h3>

            {/* Résumé */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-[#0C4DA0] font-semibold text-xs">
                    {selectedClient?.prenom[0]}{selectedClient?.nom[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedClient?.prenom} {selectedClient?.nom}
                  </p>
                  <p className="text-xs text-gray-600">{selectedPack?.nom}</p>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0]"
              />
            </div>

            {/* Heures */}
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Heure</label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {disponibilites.map((slot: any) => (
                  <button
                    key={slot.heure}
                    onClick={() => setHeure(slot.heure)}
                    disabled={!slot.disponible}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                      heure === slot.heure
                        ? 'bg-[#0C4DA0] text-white'
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0]"
                placeholder="Informations complémentaires..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !heure}
                className="flex-1 px-4 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-red-600 font-medium text-sm disabled:opacity-50"
              >
                {loading ? 'En cours...' : rdv ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}