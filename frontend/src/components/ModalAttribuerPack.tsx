'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalAttribuerPack({ onClose, onSuccess }: ModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [packs, setPacks] = useState([]);
  const [searchClient, setSearchClient] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [dateAchat, setDateAchat] = useState(new Date().toISOString().split('T')[0]);
  const [montantTotal, setMontantTotal] = useState('');
  const [montantPaye, setMontantPaye] = useState('');
  const [methodePaiement, setMethodePaiement] = useState('Espèces');
  
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    loadPacks();
    loadAllClients();
  }, []);

  useEffect(() => {
    if (searchClient.length >= 2) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        filterClients(searchClient);
      }, 300);
    } else {
      setClients([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchClient, allClients]);

  const loadPacks = async () => {
    try {
      const { data } = await api.get('/packs');
      setPacks(data.filter((p: any) => p.actif));
    } catch (err) {
      console.error('Erreur chargement packs:', err);
    }
  };

  const loadAllClients = async () => {
    setLoadingClients(true);
    try {
      const { data } = await api.get('/clients');
      setAllClients(data);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const filterClients = (query: string) => {
    const searchLower = query.toLowerCase();
    const filtered = allClients
      .filter((client: any) =>
        client.nom?.toLowerCase().includes(searchLower) ||
        client.prenom?.toLowerCase().includes(searchLower) ||
        client.telephone?.includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower)
      )
      .slice(0, 10);
    
    setClients(filtered);
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedPack) return;

    setLoading(true);
    try {
      await api.post('/client-packs', {
        client_id: selectedClient.id,
        pack_id: selectedPack.id,
        date_achat: dateAchat,
        montant_total: parseFloat(montantTotal),
        montant_paye: parseFloat(montantPaye),
        methode_paiement: methodePaiement,
      });

      const reste = parseFloat(montantTotal) - parseFloat(montantPaye);

      Swal.fire({
        icon: 'success',
        title: 'Pack attribué!',
        html: `
          <p class="text-sm text-gray-600 mt-2">
            ${reste > 0 
              ? `<strong class="text-red-600">Reste à payer: ${reste.toFixed(2)} DH</strong><br>Paiement créé dans la page Paiements`
              : '<strong class="text-green-600">Pack entièrement payé!</strong>'
            }
          </p>
        `,
        timer: 2500,
        showConfirmButton: false
      });

      onSuccess();
    } catch (err: any) {
      setLoading(false);
      
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Impossible d\'attribuer le pack',
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
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Attribuer un Pack</h2>
            <p className="text-xs text-gray-600 mt-0.5">Étape {step}/3</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="px-5 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-amber-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-amber-600 text-white' : 'bg-gray-200'}`}>1</div>
              <span className="text-xs font-medium">Client</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-amber-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-amber-600 text-white' : 'bg-gray-200'}`}>2</div>
              <span className="text-xs font-medium">Pack</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-amber-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-amber-600 text-white' : 'bg-gray-200'}`}>3</div>
              <span className="text-xs font-medium">Paiement</span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {step === 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Rechercher un client</label>
              <div className="relative mb-3">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  placeholder="Nom, prénom, téléphone..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {loadingClients && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  <p className="text-xs text-gray-600 ml-3">Chargement des clients...</p>
                </div>
              )}

              {!loadingClients && searchClient.length < 2 && (
                <p className="text-xs text-gray-500 text-center py-8">Tapez au moins 2 caractères</p>
              )}

              {!loadingClients && searchClient.length >= 2 && clients.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-8">Aucun client trouvé</p>
              )}

              {!loadingClients && clients.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {clients.map((client: any) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setStep(2);
                      }}
                      className="p-3 border border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-700 font-semibold text-sm">
                            {client.prenom?.[0]}{client.nom?.[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{client.prenom} {client.nom}</p>
                          <p className="text-xs text-gray-600">{client.telephone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800"><strong>Client:</strong> {selectedClient?.prenom} {selectedClient?.nom}</p>
              </div>

              <label className="block text-xs font-semibold text-gray-700 mb-2">Choisir un pack</label>

              {packs.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">Aucun pack disponible</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {packs.map((pack: any) => (
                    <div
                      key={pack.id}
                      onClick={() => {
                        setSelectedPack(pack);
                        setMontantTotal(pack.prix);
                        setMontantPaye(pack.prix);
                        setStep(3);
                      }}
                      className="p-3 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all"
                    >
                      <h3 className="text-sm font-bold text-gray-900 mb-2">{pack.nom}</h3>
                      <div className="space-y-1 text-xs">
                        <p className="text-gray-600">Prix: <span className="font-bold text-amber-600">{pack.prix} DH</span></p>
                        <p className="text-gray-600">Séances: <span className="font-bold">{pack.nombre_seances_total}</span></p>
                        <p className="text-gray-600">Validité: <span className="font-bold">{pack.validite_jours} jours</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(1)} className="mt-4 w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-xs">Retour</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800 mb-1"><strong>Client:</strong> {selectedClient?.prenom} {selectedClient?.nom}</p>
                <p className="text-xs text-amber-800"><strong>Pack:</strong> {selectedPack?.nom}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date d'achat</label>
                  <input type="date" value={dateAchat} onChange={(e) => setDateAchat(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prix total du pack (DH) <span className="text-red-500">*</span></label>
                  <input type="number" value={montantTotal} onChange={(e) => setMontantTotal(e.target.value)} min="0" step="0.01" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" required />
                  <p className="text-xs text-gray-500 mt-1">Prix standard: {selectedPack?.prix} DH</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Montant payé aujourd'hui (DH) <span className="text-red-500">*</span></label>
                  <input type="number" value={montantPaye} onChange={(e) => setMontantPaye(e.target.value)} min="0" max={montantTotal} step="0.01" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" required />
                </div>

                {montantTotal && montantPaye && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">Reste à payer:</span>
                      <span className="text-blue-900 font-bold text-lg">{(parseFloat(montantTotal) - parseFloat(montantPaye)).toFixed(2)} DH</span>
                    </div>
                    {parseFloat(montantPaye) < parseFloat(montantTotal) && <p className="text-xs text-blue-600 mt-2">💡 Le reste peut être payé via Paiements</p>}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Méthode de paiement</label>
                  <select value={methodePaiement} onChange={(e) => setMethodePaiement(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                    <option value="Espèces">Espèces</option>
                    <option value="Carte">Carte</option>
                    <option value="Virement">Virement</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-xs">Retour</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-medium text-xs disabled:opacity-50">
                  {loading ? 'Attribution...' : 'Attribuer le pack'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}