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
  ChevronRightIcon,
  UserGroupIcon,
  ClockIcon
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
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...clients];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((client: any) =>
        client.nom?.toLowerCase().includes(searchLower) ||
        client.prenom?.toLowerCase().includes(searchLower) ||
        client.telephone?.includes(search) ||
        client.email?.toLowerCase().includes(searchLower)
      );
    }

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

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedClients(filteredClients.slice(startIndex, endIndex));
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const handleDelete = async (client: any) => {
    const result = await Swal.fire({
      title: 'Supprimer ce client?',
      text: `${client.prenom} ${client.nom}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Non',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-4 py-2 bg-red-600 text-white rounded-lg mr-2',
        cancelButton: 'px-4 py-2 bg-gray-200 text-gray-800 rounded-lg'
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/clients/${client.id}`);
        
        const updatedClients = clients.filter((c: any) => c.id !== client.id);
        setClients(updatedClients);
        
        const { data } = await api.get('/clients/stats');
        setStats(data);

        Swal.fire('Supprimé!', '', 'success');
      } catch (error) {
        Swal.fire('Erreur', '', 'error');
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

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-pink-500',
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-red-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <AdminLayout>
      {/* Header Simple */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
            <p className="text-sm text-gray-500 mt-1">{stats.total} client(s) au total</p>
          </div>
          
          <button
            onClick={() => {
              setSelectedClient(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau Client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Nouveaux ce mois</p>
              <p className="text-3xl font-bold text-gray-900">{stats.nouveaux}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <UsersIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border-l-4 border-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Clients Actifs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.actifs}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <ClockIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, téléphone, email..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all"
            />
          </div>
          
          <select
            value={dateType}
            onChange={(e) => {
              setDateType(e.target.value);
              setCustomDate('');
              setCustomMonth('');
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] transition-all"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="customDate">Date exacte</option>
            <option value="customMonth">Mois exact</option>
          </select>

          {dateType === 'customDate' && (
            <div className="md:col-span-3">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0]"
              />
            </div>
          )}

          {dateType === 'customMonth' && (
            <div className="md:col-span-3">
              <input
                type="month"
                value={customMonth}
                onChange={(e) => setCustomMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#0C4DA0] mb-3"></div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      ) : paginatedClients.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            {search || dateType !== 'all' ? 'Aucun résultat' : 'Aucun client'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {search || dateType !== 'all' 
              ? 'Modifiez vos filtres' 
              : 'Ajoutez votre premier client'}
          </p>
          {!search && dateType === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#0C4DA0] text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Ajouter un client
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Inscription
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedClients.map((client: any, index: number) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 ${getAvatarColor(index)} rounded-lg flex items-center justify-center`}>
                            <span className="text-white font-semibold text-sm">
                              {client.prenom?.[0]}{client.nom?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {client.prenom} {client.nom}
                            </p>
                            <p className="text-xs text-gray-500">ID: {client.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{client.telephone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {client.email ? (
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900 truncate max-w-xs">{client.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {new Date(client.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setShowModal(true);
                            }}
                            className="p-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
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
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredClients.length)} sur {filteredClients.length}
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-[#0C4DA0] text-white'
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
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
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