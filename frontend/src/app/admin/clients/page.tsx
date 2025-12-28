'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalClient from '@/components/ModalClient';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  UsersIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [paginatedClients, setPaginatedClients] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    nouveaux: 0,
    actifs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateType, setDateType] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [customMonth, setCustomMonth] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  
  // Pagination
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
      const [clientsRes, statsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/clients/stats')
      ]);
      
      const clientsData = clientsRes.data.data || clientsRes.data;
      setClients(clientsData);
      setFilteredClients(clientsData);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtres
  useEffect(() => {
    let filtered = [...clients];

    // Filtre par recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((client: any) =>
        client.nom?.toLowerCase().includes(searchLower) ||
        client.prenom?.toLowerCase().includes(searchLower) ||
        client.telephone?.includes(search) ||
        client.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par date
    if (dateType !== 'all') {
      filtered = filtered.filter((client: any) => {
        const createdAt = new Date(client.created_at);
        const now = new Date();
        
        switch (dateType) {
          case 'today':
            return createdAt.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createdAt >= weekAgo;
          case 'month':
            return createdAt.getMonth() === now.getMonth() && 
                   createdAt.getFullYear() === now.getFullYear();
          case 'customDate':
            if (customDate) {
              return createdAt.toISOString().split('T')[0] === customDate;
            }
            return true;
          case 'customMonth':
            if (customMonth) {
              const [year, month] = customMonth.split('-');
              return createdAt.getFullYear() === parseInt(year) &&
                     createdAt.getMonth() === parseInt(month) - 1;
            }
            return true;
          default:
            return true;
        }
      });
    }

    setFilteredClients(filtered);
    setCurrentPage(1);
  }, [search, dateType, customDate, customMonth, clients]);

  // Pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedClients(filteredClients.slice(startIndex, endIndex));
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const handleDelete = async (client: any) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      html: `Voulez-vous supprimer <strong>${client.prenom} ${client.nom}</strong>?`,
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
        await api.delete(`/clients/${client.id}`);
        
        const updatedClients = clients.filter((c: any) => c.id !== client.id);
        setClients(updatedClients);
        
        const { data } = await api.get('/clients/stats');
        setStats(data);

        await Swal.fire({
          icon: 'success',
          title: 'Supprimé!',
          text: 'Le client a été supprimé avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de supprimer le client',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
          }
        });
      }
    }
  };

  const handleClientSaved = async (savedClient: any) => {
    if (selectedClient) {
      setClients(clients.map((c: any) => 
        c.id === savedClient.id ? savedClient : c
      ));
    } else {
      setClients([savedClient, ...clients]);
    }

    const { data } = await api.get('/clients/stats');
    setStats(data);

    setShowModal(false);
    setSelectedClient(null);
  };

  const statsCards = [
    {
      title: 'Total Clients',
      value: stats.total,
      icon: UsersIcon,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Nouveaux ce mois',
      value: stats.nouveaux,
      icon: CalendarIcon,
      color: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Clients Actifs',
      value: stats.actifs,
      icon: UsersIcon,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-xs text-gray-600 mt-0.5">Gérez votre base de clients</p>
        </div>
        
        <button
          onClick={() => {
            setSelectedClient(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Nouveau Client
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 ${stat.color} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Recherche */}
          <div className="md:col-span-2 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom, téléphone..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          
          {/* Filtre date */}
          <select
            value={dateType}
            onChange={(e) => {
              setDateType(e.target.value);
              setCustomDate('');
              setCustomMonth('');
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="customDate">Date exacte</option>
            <option value="customMonth">Mois exact</option>
          </select>

          {/* Date exacte */}
          {dateType === 'customDate' && (
            <div className="md:col-span-3">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Mois exact */}
          {dateType === 'customMonth' && (
            <div className="md:col-span-3">
              <input
                type="month"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : paginatedClients.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">
            {search || dateType !== 'all' ? 'Aucun client trouvé pour ces filtres' : 'Aucun client'}
          </p>
          {!search && dateType === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg text-xs font-medium"
            >
              Ajouter votre premier client
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Inscrit le
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedClients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-700 font-semibold text-xs">
                              {client.prenom?.[0]}{client.nom?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {client.prenom} {client.nom}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                          {client.telephone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {client.email ? (
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <EnvelopeIcon className="h-3.5 w-3.5 text-gray-400" />
                            <span className="truncate max-w-xs">{client.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-900">
                          {new Date(client.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setShowModal(true);
                            }}
                            className="p-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all"
                            title="Modifier"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="p-1.5 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all"
                            title="Supprimer"
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
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredClients.length)} sur {filteredClients.length} clients
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white'
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
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <ModalClient
          client={selectedClient}
          onClose={() => {
            setShowModal(false);
            setSelectedClient(null);
          }}
          onSuccess={handleClientSaved}
        />
      )}
    </AdminLayout>
  );
}