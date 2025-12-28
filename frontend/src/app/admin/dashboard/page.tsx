'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  CalendarIcon, 
  UsersIcon, 
  SparklesIcon, 
  BanknotesIcon,
  ClockIcon,
  PlusIcon,
  UserPlusIcon,
  CubeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  const stats = [
    { 
      title: "RDV Aujourd'hui", 
      value: "12", 
      subtitle: "3 en cours",
      change: "+8%",
      changeText: "vs mois dernier",
      icon: CalendarIcon,
      bgColor: "bg-amber-50"
    },
    { 
      title: "Clients Actifs", 
      value: "847", 
      subtitle: "24 nouveaux ce mois",
      change: "+12%",
      changeText: "vs mois dernier",
      icon: UsersIcon,
      bgColor: "bg-blue-50"
    },
    { 
      title: "Services", 
      value: "28", 
      subtitle: "5 packs premium",
      icon: SparklesIcon,
      bgColor: "bg-purple-50"
    },
    { 
      title: "CA du Mois", 
      value: "DH 42,580", 
      subtitle: "Objectif: DH 50,000",
      change: "+15%",
      changeText: "vs mois dernier",
      icon: BanknotesIcon,
      bgColor: "bg-green-50"
    },
  ];

  const appointments = [
    { id: 1, client: 'Sophie Martin', service: 'Facial Treatment Premium', time: '09:00', duration: '90 min', status: 'Terminé' },
    { id: 2, client: 'Isabelle Dubois', service: 'Anti-Aging Package', time: '10:30', duration: '120 min', status: 'En cours' },
    { id: 3, client: 'Marie Laurent', service: 'Hydrating Facial', time: '14:00', duration: '60 min', status: 'À venir' },
    { id: 4, client: 'Camille Petit', service: 'Luxury Spa Treatment', time: '16:00', duration: '90 min', status: 'À venir' },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Terminé':
        return 'bg-gray-50 text-gray-700 border-l-gray-400';
      case 'En cours':
        return 'bg-amber-50 text-amber-700 border-l-amber-400';
      case 'À venir':
        return 'bg-blue-50 text-blue-700 border-l-blue-400';
      default:
        return 'bg-gray-50 text-gray-700 border-l-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Terminé':
        return 'bg-gray-100 text-gray-700';
      case 'En cours':
        return 'bg-amber-100 text-amber-700';
      case 'À venir':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminLayout>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
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
              {stat.change && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-green-600">{stat.change}</span>
                  <span className="text-xs text-gray-500 ml-1">{stat.changeText}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Planning du Jour</h3>
              <p className="text-xs text-gray-500 mt-0.5">27 Décembre 2024</p>
            </div>
            <button className="px-4 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Voir tout
            </button>
          </div>
          <div className="p-5 space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className={`p-4 rounded-lg border-l-4 ${getStatusStyle(apt.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-medium">
                        {apt.client.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{apt.client}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2 ml-10">{apt.service}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 ml-10">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {apt.time}
                  </span>
                  <span>•</span>
                  <span>{apt.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions Rapides</h3>
            <div className="space-y-2.5">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm font-medium">
                <PlusIcon className="h-5 w-5" />
                Nouveau RDV
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                <UserPlusIcon className="h-5 w-5" />
                Ajouter Client
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                <CubeIcon className="h-5 w-5" />
                Créer Pack
              </button>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-white rounded-lg">
                <ArrowTrendingUpIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Excellent Progrès!</h4>
                <p className="text-xs text-gray-600 mt-1">Vous êtes à 85% de votre objectif mensuel. Continuez!</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-gray-700">MAD42,580</span>
                <span className="text-gray-500">MAD 50,000</span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2.5">
                <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>

          {/* Next Appointment */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="h-5 w-5 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Prochain RDV</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900">Marie Laurent</p>
              <p className="text-xs text-gray-600 mt-1">Hydrating Facial</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>14:00 • 60 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}