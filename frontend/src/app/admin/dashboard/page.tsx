'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import { 
  CalendarIcon, 
  UsersIcon, 
  SparklesIcon, 
  BanknotesIcon,
  ClockIcon,
  PlusIcon,
  UserPlusIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    rdv_aujourdhui: 0,
    rdv_en_cours: 0,
    clients_total: 0,
    clients_nouveaux: 0,
    prestations_total: 0,
    packs_total: 0,
    ca_mois: 0,
    ca_objectif: 50000,
  });
  const [rdvAujourdhui, setRdvAujourdhui] = useState<any[]>([]);
  const [prochainRdv, setProchainRdv] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    loadDashboard();
  }, []);

const loadDashboard = async () => {
  setLoading(true);
  try {
    const [rdvRes, paiementsRes] = await Promise.all([
      api.get('/rendez-vous'),
      api.get('/paiements/stats'),
    ]);

    // DEBUG - Regarde la structure
    console.log('RDV Response:', rdvRes.data);
    console.log('Paiements Response:', paiementsRes.data);

    const clientsRes = await api.get('/clients').catch(() => ({ data: [] }));
    const prestationsRes = await api.get('/prestations').catch(() => ({ data: [] }));
    const packsRes = await api.get('/packs').catch(() => ({ data: [] }));

    console.log('Clients:', clientsRes.data);
    console.log('Prestations:', prestationsRes.data);

    // CORRIGE - rdvRes.data peut être un objet avec une propriété 'data'
    const rdvList = Array.isArray(rdvRes.data) ? rdvRes.data : (rdvRes.data.data || []);
    const clientsList = Array.isArray(clientsRes.data) ? clientsRes.data : (clientsRes.data.data || []);
    const prestationsList = Array.isArray(prestationsRes.data) ? prestationsRes.data : (prestationsRes.data.data || []);
    const packsList = Array.isArray(packsRes.data) ? packsRes.data : (packsRes.data.data || []);

    const today = new Date();
    const todayStr = today.toLocaleDateString('fr-CA');

    const rdvToday = rdvList.filter((rdv: any) => {
      const rdvDate = new Date(rdv.date_heure);
      const rdvDateStr = rdvDate.toLocaleDateString('fr-CA');
      console.log('Comparaison:', rdvDateStr, 'vs', todayStr);
      return rdvDateStr === todayStr;
    });

    console.log('RDV Today:', rdvToday);

    const rdvEnCours = rdvToday.filter((rdv: any) => 
      rdv.statut === 'Confirmé' || rdv.statut === 'En cours'
    );

    const rdvFuturs = rdvList
      .filter((rdv: any) => {
        const rdvDate = new Date(rdv.date_heure);
        return rdvDate > today && (rdv.statut === 'Confirmé' || rdv.statut === 'En attente');
      })
      .sort((a: any, b: any) => 
        new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime()
      );

    const debutMois = new Date(today.getFullYear(), today.getMonth(), 1);
    const nouveauxClients = clientsList.filter((c: any) => 
      new Date(c.created_at) >= debutMois
    ).length;

    setStats({
      rdv_aujourdhui: rdvToday.length,
      rdv_en_cours: rdvEnCours.length,
      clients_total: clientsList.length || 0,
      clients_nouveaux: nouveauxClients,
      prestations_total: prestationsList.length || 0,
      packs_total: packsList.length || 0,
      ca_mois: paiementsRes.data.paiements_mois || 0,
    });

    setRdvAujourdhui(rdvToday.slice(0, 4));
    setProchainRdv(rdvFuturs[0] || null);
  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
  } finally {
    setLoading(false);
  }
};

  const getStatusStyle = (statut: string) => {
    switch (statut) {
      case 'Terminé':
        return 'bg-gray-50 text-gray-700 border-l-gray-400';
      case 'En cours':
        return 'bg-amber-50 text-amber-700 border-l-amber-400';
      case 'Confirmé':
      case 'En attente':
        return 'bg-blue-50 text-blue-700 border-l-blue-400';
      case 'Annulé':
        return 'bg-red-50 text-red-700 border-l-red-400';
      default:
        return 'bg-gray-50 text-gray-700 border-l-gray-400';
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Terminé':
        return 'bg-gray-100 text-gray-700';
      case 'En cours':
        return 'bg-amber-100 text-amber-700';
      case 'Confirmé':
      case 'En attente':
        return 'bg-blue-100 text-blue-700';
      case 'Annulé':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const statsCards = [
    { 
      title: "RDV Aujourd'hui", 
      value: stats.rdv_aujourdhui.toString(), 
      subtitle: `${stats.rdv_en_cours} en cours`,
      icon: CalendarIcon,
      bgColor: "bg-amber-50"
    },
    { 
      title: "Clients Actifs", 
      value: stats.clients_total.toString(), 
      subtitle: `${stats.clients_nouveaux} nouveaux ce mois`,
      icon: UsersIcon,
      bgColor: "bg-blue-50"
    },
    { 
      title: "Services", 
      value: stats.prestations_total.toString(), 
      subtitle: `${stats.packs_total} packs disponibles`,
      icon: SparklesIcon,
      bgColor: "bg-purple-50"
    },
    { 
      title: "CA du Mois", 
      value: `${stats.ca_mois.toLocaleString()} DH`, 
      subtitle: `Chiffre d'Affaires`,
      icon: BanknotesIcon,
      bgColor: "bg-green-50"
    },
  ];

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <Icon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Planning du Jour</h3>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(new Date().toISOString())}</p>
            </div>
            <button 
              onClick={() => router.push('/admin/rendez-vous')}
              className="px-4 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Voir tout
            </button>
          </div>
          <div className="p-5 space-y-3">
            {rdvAujourdhui.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucun rendez-vous aujourd'hui</p>
              </div>
            ) : (
              rdvAujourdhui.map((rdv) => (
                <div
                  key={rdv.id}
                  className={`p-4 rounded-lg border-l-4 ${getStatusStyle(rdv.statut)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-xs font-medium">
                          {rdv.client?.prenom?.[0]}{rdv.client?.nom?.[0]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {rdv.client?.prenom} {rdv.client?.nom}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(rdv.statut)}`}>
                      {rdv.statut}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 ml-10">{rdv.prestation?.nom || 'Service non spécifié'}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 ml-10">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {formatTime(rdv.date_heure)}
                    </span>
                    {rdv.duree && (
                      <>
                        <span>•</span>
                        <span>{rdv.duree} min</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions Rapides</h3>
            <div className="space-y-2.5">
              <button 
                onClick={() => router.push('/admin/rendez-vous')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                Nouveau RDV
              </button>
              <button 
                onClick={() => router.push('/admin/clients')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                <UserPlusIcon className="h-5 w-5" />
                Ajouter Client
              </button>
              <button 
                onClick={() => router.push('/admin/packs')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                <CubeIcon className="h-5 w-5" />
                Créer Pack
              </button>
            </div>
          </div>

          {prochainRdv && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="h-5 w-5 text-gray-600" />
                <h4 className="text-sm font-semibold text-gray-900">Prochain RDV</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {prochainRdv.client?.prenom} {prochainRdv.client?.nom}
                </p>
                <p className="text-xs text-gray-600 mt-1">{prochainRdv.prestation?.nom || 'Service non spécifié'}</p>
                <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                  <p className="mb-1">{formatDate(prochainRdv.date_heure)}</p>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>{formatTime(prochainRdv.date_heure)}</span>
                    {prochainRdv.duree && <span>• {prochainRdv.duree} min</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}