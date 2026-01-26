'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import { 
  MagnifyingGlassIcon,
  UserCircleIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  CubeIcon,
  ChevronRightIcon,
  XCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function SuiviPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data } = await api.get('/clients');
      const clientsData = data.data || data;
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadClientDetails = async (clientId: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/clients/${clientId}/suivi`);
      setClientDetails(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      client.nom?.toLowerCase().includes(searchLower) ||
      client.prenom?.toLowerCase().includes(searchLower) ||
      client.telephone?.includes(search)
    );
  });

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    loadClientDetails(client.id);
  };

  const getStatusColor = (statut: string) => {
    const colors: any = {
      'planifie': 'bg-blue-100 text-blue-700',
      'confirme': 'bg-green-100 text-green-700',
      'termine': 'bg-gray-100 text-gray-700',
      'annule': 'bg-red-100 text-red-700',
      'actif': 'bg-green-100 text-green-700',
      'expire': 'bg-red-100 text-red-700',
      'suspendu': 'bg-orange-100 text-orange-700'
    };
    return colors[statut] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (statut: string) => {
    const labels: any = {
      'planifie': 'Planifié',
      'confirme': 'Confirmé',
      'termine': 'Terminé',
      'annule': 'Annulé',
      'actif': 'Actif',
      'expire': 'Expiré',
      'suspendu': 'Suspendu'
    };
    return labels[statut] || statut;
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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Suivi Client</h1>
        <p className="text-sm text-gray-600">Consultez l'historique et les packs actifs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste Clients */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] text-sm"
                />
              </div>
            </div>

            <div className="divide-y max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredClients.map((client: any, index: number) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className={`w-full text-left p-4 hover:bg-blue-50 transition-colors ${
                    selectedClient?.id === client.id ? 'bg-blue-50 border-l-4 border-[#0C4DA0]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br ${
                      ['from-blue-400 to-cyan-400', 'from-purple-400 to-pink-400', 'from-green-400 to-emerald-400', 'from-orange-400 to-red-400'][index % 4]
                    }`}>
                      <span className="text-white font-bold text-sm">
                        {client.prenom?.[0]}{client.nom?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">
                        {client.prenom} {client.nom}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <PhoneIcon className="h-3 w-3" />
                        {client.telephone}
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Détails Client */}
        <div className="lg:col-span-2">
          {!selectedClient ? (
            <div className="bg-white rounded-lg border p-12 text-center">
              <UserCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Sélectionnez un client pour voir son suivi</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-lg border p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C4DA0] mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Client */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg border p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-[#0C4DA0] to-[#083a7a] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-2xl">
                      {selectedClient.prenom?.[0]}{selectedClient.nom?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedClient.prenom} {selectedClient.nom}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4" />
                        {selectedClient.telephone}
                      </div>
                      {selectedClient.email && (
                        <div className="flex items-center gap-1">
                          <span>📧</span>
                          {selectedClient.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats globales */}
                {clientDetails?.stats && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-blue-200">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Total payé</p>
                      <p className="text-xl font-bold text-[#0C4DA0]">{clientDetails.stats.total_paye} DH</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600">Séances effectuées</p>
                      <p className="text-xl font-bold text-green-600">{clientDetails.stats.total_seances}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pack Actif */}
              {clientDetails?.packActif ? (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-2">
                      <CubeIcon className="h-5 w-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">Pack en cours</h3>
                      <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Actif
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        {clientDetails.packActif.pack?.nom}
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">Total séances</p>
                          <p className="text-2xl font-bold text-[#0C4DA0]">
                            {clientDetails.packActif.nombre_seances_total}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">Effectuées</p>
                          <p className="text-2xl font-bold text-green-600">
                            {clientDetails.packActif.seances_effectuees}
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">Restantes</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {clientDetails.packActif.seances_restantes}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Tous les Rendez-vous */}
              {clientDetails?.rendezVous && clientDetails.rendezVous.length > 0 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold text-gray-900">Historique des rendez-vous</h3>
                      <span className="ml-auto text-xs font-semibold text-blue-700">
                        {clientDetails.rendezVous.length} RDV
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
                    {clientDetails.rendezVous.map((rdv: any) => (
                      <div key={rdv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-[#0C4DA0] flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {rdv.pack?.nom || 'Pack non défini'} - Séance {rdv.numero_seance}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(rdv.date_heure).toLocaleDateString('fr-FR')} à {new Date(rdv.date_heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(rdv.statut)}`}>
                          {getStatusLabel(rdv.statut)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tous les Paiements */}
              {clientDetails?.paiements && clientDetails.paiements.length > 0 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="h-5 w-5 text-purple-600" />
                        <h3 className="font-bold text-gray-900">Historique des paiements</h3>
                      </div>
                      <p className="text-sm font-semibold text-purple-700">
                        Total: {clientDetails.stats?.total_paye || 0} DH
                      </p>
                    </div>
                  </div>
                  <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
                    {clientDetails.paiements.map((paiement: any) => (
                      <div key={paiement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <CreditCardIcon className="h-5 w-5 text-[#0C4DA0] flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {paiement.montant} DH
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')} - {paiement.rendez_vous?.pack?.nom || paiement.client_pack?.pack?.nom || 'Pack'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 uppercase">
                          {getMethodeLabel(paiement.methode)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique Packs */}
              {clientDetails?.historique && clientDetails.historique.length > 0 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b">
                    <h3 className="font-bold text-gray-900">Historique des packs</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {clientDetails.historique.map((pack: any) => (
                      <div key={pack.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{pack.pack?.nom}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {pack.seances_effectuees}/{pack.nombre_seances_total} séances
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(pack.statut)}`}>
                            {getStatusLabel(pack.statut)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucune donnée */}
              {!clientDetails?.packActif && 
               (!clientDetails?.rendezVous || clientDetails.rendezVous.length === 0) &&
               (!clientDetails?.paiements || clientDetails.paiements.length === 0) &&
               (!clientDetails?.historique || clientDetails.historique.length === 0) && (
                <div className="bg-white rounded-lg border p-12 text-center">
                  <XCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">Aucun historique</p>
                  <p className="text-sm text-gray-500">Ce client n'a pas encore de pack, rendez-vous ou paiement</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}