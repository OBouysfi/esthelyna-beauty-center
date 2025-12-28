'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function StatistiquesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('mois');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const params: any = { periode };
      if (periode === 'personnalise' && dateDebut && dateFin) {
        params.date_debut = dateDebut;
        params.date_fin = dateFin;
      }

      const { data } = await api.get('/statistiques/dashboard', { params });
      setStats(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppliquerFiltre = () => {
    loadStats();
  };

  const handleExport = async () => {
    try {
      const params: any = { periode };
      if (periode === 'personnalise' && dateDebut && dateFin) {
        params.date_debut = dateDebut;
        params.date_fin = dateFin;
      }

      const response = await api.get('/statistiques/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statistiques_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const chartOptionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        titleFont: { size: 12, family: 'Poppins', weight: 'bold' as const },
        bodyFont: { size: 11, family: 'Poppins' },
        callbacks: {
          label: function (context: any) {
            return context.parsed.y.toLocaleString() + ' DH';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { size: 10, family: 'Poppins' },
          callback: function (value: any) {
            return value.toLocaleString() + ' DH';
          },
        },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { font: { size: 10, family: 'Poppins' } },
      },
    },
  };

  const chartOptionsBar = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        titleFont: { size: 12, family: 'Poppins', weight: 'bold' as const },
        bodyFont: { size: 11, family: 'Poppins' },
        callbacks: {
          label: function (context: any) {
            return context.parsed.x.toLocaleString() + ' DH';
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { size: 10, family: 'Poppins' },
          callback: function (value: any) {
            return value.toLocaleString();
          },
        },
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Poppins' } },
      },
    },
  };

  if (loading || !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  const revenusChartData = {
    labels: stats.graphique_revenus.labels,
    datasets: [
      {
        data: stats.graphique_revenus.data,
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.05)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const prestationsChartData = {
    labels: stats.top_prestations.map((p: any) => p.nom),
    datasets: [
      {
        data: stats.top_prestations.map((p: any) => p.revenu),
        backgroundColor: '#d97706',
        borderRadius: 4,
      },
    ],
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>Statistiques</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Poppins' }}>{stats.periode.label}</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            style={{ fontFamily: 'Poppins' }}
          >
            <option value="semaine">Cette semaine</option>
            <option value="mois">Ce mois</option>
            <option value="trimestre">Ce trimestre</option>
            <option value="annee">Cette année</option>
            <option value="personnalise">Période personnalisée</option>
          </select>

          {periode === 'personnalise' && (
            <>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                style={{ fontFamily: 'Poppins' }}
              />
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                style={{ fontFamily: 'Poppins' }}
              />
            </>
          )}

          <button
            onClick={handleAppliquerFiltre}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            style={{ fontFamily: 'Poppins' }}
          >
            Appliquer
          </button>

          <button
            onClick={handleExport}
            className="ml-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            style={{ fontFamily: 'Poppins' }}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'Poppins' }}>Revenus totaux</p>
          <p className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins' }}>{stats.revenus.total.toLocaleString()} DH</p>
          <div className="flex items-center gap-1.5">
            {stats.revenus.en_hausse ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${stats.revenus.en_hausse ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Poppins' }}>
              {stats.revenus.evolution > 0 ? '+' : ''}{stats.revenus.evolution}%
            </span>
            <span className="text-sm text-gray-500" style={{ fontFamily: 'Poppins' }}>vs période précédente</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'Poppins' }}>Clients</p>
          <p className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins' }}>{stats.clients.total}</p>
          <div className="flex items-center gap-3 text-sm" style={{ fontFamily: 'Poppins' }}>
            <span className="text-gray-700"><strong className="text-gray-900">{stats.clients.nouveaux}</strong> nouveaux</span>
            <span className="text-gray-700"><strong className="text-gray-900">{stats.clients.actifs}</strong> actifs</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'Poppins' }}>Rendez-vous</p>
          <p className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins' }}>{stats.rendez_vous.total}</p>
          <div className="flex items-center gap-3 text-sm" style={{ fontFamily: 'Poppins' }}>
            <span className="text-gray-700"><strong className="text-gray-900">{stats.rendez_vous.termines}</strong> terminés</span>
            <span className="text-red-600"><strong>{stats.rendez_vous.taux_annulation}%</strong> annulés</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: 'Poppins' }}>Taux de conversion</p>
          <p className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins' }}>{stats.taux_conversion.taux}%</p>
          <p className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
            <strong className="text-gray-900">{stats.taux_conversion.rdv_payes}</strong> sur {stats.taux_conversion.total_rdv} payés
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins' }}>Évolution des revenus</h2>
          <div className="h-80">
            <Line data={revenusChartData} options={chartOptionsLine} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins' }}>Top 5 Prestations</h2>
          {stats.top_prestations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-20" style={{ fontFamily: 'Poppins' }}>Aucune prestation</p>
          ) : (
            <div className="h-80">
              <Bar data={prestationsChartData} options={chartOptionsBar} />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}