'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalNouveauRDV from '@/components/ModalNouveauRDV';
import api from '@/lib/api';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  PlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const locales = {
  'fr': fr,
};

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
  showMore: (total: number) => `+ ${total} rendez-vous`,
};

export default function CalendrierPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

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
      
      console.log('RDV reçus:', rdvData); // DEBUG
      
      const formattedEvents = rdvData.map((rdv: any) => {
        // Parser la date correctement
        let start;
        if (rdv.date_heure.includes('T')) {
          // Format ISO
          start = new Date(rdv.date_heure);
        } else {
          // Format SQL "2025-12-28 14:30:00"
          start = new Date(rdv.date_heure.replace(' ', 'T'));
        }
        
        const end = new Date(start.getTime() + (rdv.duree || 60) * 60000);
        
        console.log('Event créé:', {
          title: `${rdv.client?.prenom} ${rdv.client?.nom}`,
          start,
          end,
          statut: rdv.statut
        }); // DEBUG
        
        return {
          id: rdv.id,
          title: `${rdv.client?.prenom || ''} ${rdv.client?.nom || ''}`.trim() || 'Sans nom',
          start,
          end,
          resource: rdv,
        };
      });
      
      console.log('Events formatés:', formattedEvents); // DEBUG
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erreur chargement:', error);
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
    const rdv = event.resource;
    let backgroundColor = '#d97706'; // Couleur par défaut
    
    switch (rdv?.statut) {
      case 'Planifié':
      case 'En attente':
        backgroundColor = 'rgb(10, 49, 135)'; // Bleu foncé
        break;
      case 'Confirmé':
        backgroundColor = 'rgb(13, 69, 18)'; // Vert foncé
        break;
      case 'Terminé':
        backgroundColor = 'rgb(0, 0, 0)'; // Noir
        break;
      case 'Annulé':
        backgroundColor = 'rgb(188, 0, 0)'; // Rouge foncé
        break;
      default:
        backgroundColor = 'rgb(10, 49, 135)'; // Bleu par défaut
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  const CustomEvent = ({ event }: any) => {
    return (
      <div className="text-xs">
        <div className="font-medium truncate">{event.title}</div>
        <div className="flex items-center gap-1 text-white/90">
          <ClockIcon className="h-3 w-3" />
          {format(event.start, 'HH:mm')}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Vue d'ensemble de vos rendez-vous ({events.length} RDV)
          </p>
        </div>
        
        <button
          onClick={() => {
            setSelectedEvent(null);
            setSelectedDate(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Nouveau RDV
        </button>
      </div>

      {/* Légende */}
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <p className="text-xs font-semibold text-gray-700 mb-2">Légende:</p>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(10, 49, 135)' }}></div>
          <span className="text-xs text-gray-600">Planifié</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(13, 69, 18)' }}></div>
          <span className="text-xs text-gray-600">Confirmé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(0, 0, 0)' }}></div>
          <span className="text-xs text-gray-600">Terminé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgb(188, 0, 0)' }}></div>
          <span className="text-xs text-gray-600">Annulé</span>
        </div>
      </div>
    </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ height: '700px' }}>
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
            }}
            style={{ height: '100%' }}
          />
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
          font-family: 'Poppins', sans-serif;
        }
        
        .rbc-header {
          padding: 14px 8px;
          font-weight: 600;
          font-size: 11px;
          color: #6b7280;
          background-color: #ffffff;
          border-bottom: 1px solid #f3f4f6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .rbc-today {
          background-color: #fffbeb;
        }
        
        .rbc-off-range-bg {
          background-color: #fafafa;
        }
        
        .rbc-date-cell {
          padding: 6px 10px;
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }
        
        .rbc-button-link {
          font-size: 13px;
          color: #1f2937;
          font-weight: 500;
        }
        
        .rbc-toolbar {
          padding: 0;
          margin-bottom: 20px;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
        }
        
        .rbc-toolbar button {
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #ffffff;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .rbc-toolbar button:hover {
          background-color: #f9fafb;
          border-color: #d97706;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          border-color: #f59e0b;
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);
        }
        
        .rbc-event {
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: none;
        }
        
        .rbc-event:hover {
          opacity: 1;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        
        .rbc-show-more {
          background-color: transparent;
          color: #f59e0b;
          font-weight: 600;
          font-size: 11px;
          font-family: 'Poppins', sans-serif;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .rbc-show-more:hover {
          background-color: #fef3c7;
        }
        
        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }
        
        .rbc-day-bg {
          border-left: 1px solid #f3f4f6;
          transition: background-color 0.15s ease;
        }
        
        .rbc-day-bg:hover {
          background-color: #fafafa;
        }
        
        .rbc-time-slot {
          min-height: 50px;
          border-top: 1px solid #f9fafb;
        }
        
        .rbc-time-view {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .rbc-time-header {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-time-content {
          border-top: 1px solid #f3f4f6;
        }
        
        .rbc-current-time-indicator {
          background-color: #f59e0b;
          height: 2px;
        }
        
        .rbc-label {
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
        }
        
        .rbc-month-row {
          border-top: 1px solid #f3f4f6;
        }
        
        .rbc-selected {
          background-color: #fef3c7 !important;
        }
      `}</style>
    </AdminLayout>
  );
}