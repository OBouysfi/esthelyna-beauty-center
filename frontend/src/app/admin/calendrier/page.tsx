'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalNouveauRDV from '@/components/ModalNouveauRDV';
import api from '@/lib/api';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  PlusIcon,
  ClockIcon,
  CalendarDaysIcon,
  TableCellsIcon,
  UserCircleIcon,
  PhoneIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const locales = { 'fr': fr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  allDay: 'Toute la journée',
  previous: 'Précédent',
  next: 'Suivant',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun rendez-vous',
  showMore: (total: number) => `+${total} voir plus`,
};

// Palette de couleurs pour différencier les RDV
const colorPalette = [
  { bg: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.3)' },  // violet
  { bg: '#EC4899', shadow: 'rgba(236, 72, 153, 0.3)' },  // rose
  { bg: '#10B981', shadow: 'rgba(16, 185, 129, 0.3)' },  // vert
  { bg: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.3)' },  // orange
  { bg: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.3)' },  // bleu
  { bg: '#EF4444', shadow: 'rgba(239, 68, 68, 0.3)' },   // rouge
  { bg: '#6366F1', shadow: 'rgba(99, 102, 241, 0.3)' },  // indigo
  { bg: '#14B8A6', shadow: 'rgba(20, 184, 166, 0.3)' },  // teal
  { bg: '#F97316', shadow: 'rgba(249, 115, 22, 0.3)' },  // orange foncé
  { bg: '#06B6D4', shadow: 'rgba(6, 182, 212, 0.3)' },   // cyan
];

export default function CalendrierPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<View>('week'); // Vue semaine par défaut
  const [date, setDate] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<'calendar' | 'table'>('calendar');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rendez-vous');
      const rdvData = data.data || data;
      
      const formattedEvents = rdvData.map((rdv: any, index: number) => {
        let start;
        if (rdv.date_heure.includes('T')) {
          start = new Date(rdv.date_heure);
        } else {
          start = new Date(rdv.date_heure.replace(' ', 'T'));
        }
        
        const end = new Date(start.getTime() + (rdv.duree || 60) * 60000);
        
        return {
          id: rdv.id,
          title: `${rdv.client?.prenom || ''} ${rdv.client?.nom || ''}`.trim() || 'Sans nom',
          start,
          end,
          resource: rdv,
          colorIndex: index % colorPalette.length,
        };
      });
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedDate(slotInfo.start);
    setSelectedEvent(null);
    setShowModal(true);
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event.resource);
    setShowModal(true);
  }, []);

  const eventStyleGetter = (event: any) => {
    const color = colorPalette[event.colorIndex];

    return {
      style: {
        backgroundColor: color.bg,
        borderRadius: '4px',
        opacity: 1,
        color: 'white',
        border: 'none',
        fontSize: '12px',
        padding: '3px 6px',
        boxShadow: 'none',
        fontWeight: '500',
      },
    };
  };

  const CustomEvent = ({ event }: any) => {
    return (
      <div className="truncate">
        <span className="font-medium text-[11px]">
          {format(event.start, 'HH:mm')} {event.title}
        </span>
      </div>
    );
  };

  // En-tête personnalisé pour afficher "26 Lundi"
  const CustomWeekHeader = ({ date }: any) => {
    return (
      <div className="text-center py-2">
        <div className="text-xs font-medium text-gray-500 uppercase mb-1">
          {format(date, 'EEE', { locale: fr })}
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {format(date, 'd')}
        </div>
      </div>
    );
  };

  const getStatutLabel = (statut: string) => {
    const labels: any = {
      'planifie': 'Planifié',
      'confirme': 'Confirmé',
      'termine': 'Terminé',
      'annule': 'Annulé'
    };
    return labels[statut] || statut;
  };

  const getStatutBadge = (statut: string) => {
    const styles: any = {
      'planifie': 'bg-blue-100 text-blue-700',
      'confirme': 'bg-green-100 text-green-700',
      'termine': 'bg-gray-100 text-gray-700',
      'annule': 'bg-red-100 text-red-700',
    };
    return styles[statut] || styles['planifie'];
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Calendrier
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {events.length} rendez-vous planifiés
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle View */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDisplayMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                displayMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4" />
              Calendrier
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                displayMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
              Liste
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedEvent(null);
              setSelectedDate(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0C4DA0] text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 text-sm font-semibold"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau RDV
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-white rounded-xl border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C4DA0] mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Chargement...</p>
          </div>
        </div>
      ) : displayMode === 'calendar' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm" style={{ height: '750px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            messages={messages}
            culture="fr"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent,
              week: {
                header: CustomWeekHeader,
              },
              day: {
                header: CustomWeekHeader,
              }
            }}
            style={{ height: '100%' }}
            popup
            popupOffset={{ x: 0, y: 10 }}
            showMultiDayTimes
            step={30}
            timeslots={2}
            views={['month', 'week', 'day', 'agenda']}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pack</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date & Heure</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Durée</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events
                  .sort((a: any, b: any) => b.start.getTime() - a.start.getTime())
                  .map((event: any) => {
                    const rdv = event.resource;
                    const color = colorPalette[event.colorIndex];
                    return (
                      <tr 
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                              style={{ backgroundColor: color.bg }}
                            >
                              {rdv.client?.prenom?.[0]}{rdv.client?.nom?.[0]}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {rdv.client?.prenom} {rdv.client?.nom}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {rdv.client?.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {rdv.pack?.nom || 'Pack non défini'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Séance {rdv.numero_seance}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {format(event.start, 'dd MMM yyyy', { locale: fr })}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {format(event.start, 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {rdv.duree || 60} min
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatutBadge(rdv.statut)}`}>
                            {getStatutLabel(rdv.statut)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4" />
                            {rdv.client?.telephone || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ModalNouveauRDV
          rdv={selectedEvent}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
            loadEvents();
          }}
        />
      )}

      <style jsx global>{`
        .rbc-calendar {
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        .rbc-header {
          padding: 0;
          font-weight: 500;
          font-size: 13px;
          color: #374151;
          background: #ffffff;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 50px;
        }
        
        .rbc-today {
          background-color: #eff6ff;
        }
        
        .rbc-off-range-bg {
          background-color: #fafafa;
        }
        
        .rbc-date-cell {
          padding: 4px;
          text-align: right;
        }
        
        .rbc-date-cell.rbc-now {
          font-weight: bold;
        }
        
        .rbc-date-cell > a {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        
        .rbc-toolbar {
          padding: 0;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
        
        .rbc-toolbar button {
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .rbc-toolbar button:hover {
          background: #f9fafb;
          border-color: #0C4DA0;
        }
        
        .rbc-toolbar button.rbc-active {
          background: #0C4DA0;
          color: white;
          border-color: #0C4DA0;
        }
        
        .rbc-toolbar-label {
          font-weight: 700;
          font-size: 18px;
          color: #111827;
          text-transform: capitalize;
        }
        
        .rbc-event {
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          padding: 2px 4px;
        }
        
        .rbc-event:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        
        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }
        
        .rbc-day-bg {
          border-left: 1px solid #f3f4f6;
        }
        
        .rbc-current-time-indicator {
          background-color: #0C4DA0;
          height: 2px;
        }
        
        .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        
        .rbc-timeslot-group {
          border-left: 1px solid #e5e7eb;
          min-height: 60px;
        }
        
        .rbc-time-content {
          border-top: 1px solid #e5e7eb;
        }
        
        .rbc-time-header-content {
          border-left: 1px solid #e5e7eb;
        }
        
        .rbc-time-column {
          min-width: 50px;
        }
        
        .rbc-time-gutter {
          font-size: 11px;
          color: #6b7280;
        }
        
        .rbc-agenda-view {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .rbc-agenda-table {
          border: 1px solid #e5e7eb;
        }
        
        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          padding: 12px;
          font-weight: 600;
          color: #374151;
        }
        
        .rbc-agenda-event-cell {
          padding: 12px;
        }
        
        .rbc-show-more {
          background-color: #0C4DA0;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .rbc-show-more:hover {
          background-color: #083a7a;
        }
        
        .rbc-overlay {
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          max-width: 300px;
        }
        
        .rbc-overlay-header {
          border-bottom: 1px solid #e5e7eb;
          padding: 12px;
          font-weight: 600;
          background: #f9fafb;
          font-size: 14px;
        }
        
        .rbc-event-content {
          font-size: 12px;
        }
      `}</style>
    </AdminLayout>
  );
}