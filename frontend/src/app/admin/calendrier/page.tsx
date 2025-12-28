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
    let backgroundColor = '#d97706'; // amber-600
    
    switch (rdv?.statut) {
      case 'Planifié':
        backgroundColor = '#3b82f6'; // blue-500
        break;
      case 'Confirmé':
        backgroundColor = '#10b981'; // green-500
        break;
      case 'Terminé':
        backgroundColor = '#6b7280'; // gray-500
        break;
      case 'Annulé':
        backgroundColor = '#ef4444'; // red-500
        break;
      default:
        backgroundColor = '#d97706';
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
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Planifié</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Confirmé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span className="text-xs text-gray-600">Terminé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
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
          padding: 12px 4px;
          font-weight: 600;
          font-size: 13px;
          color: #111827;
          background-color: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .rbc-today {
          background-color: #fef3c7;
        }
        
        .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        
        .rbc-date-cell {
          padding: 4px 8px;
          font-size: 13px;
        }
        
        .rbc-button-link {
          font-size: 13px;
          color: #374151;
        }
        
        .rbc-toolbar {
          padding: 12px 0;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .rbc-toolbar button {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background-color: white;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .rbc-toolbar button:hover {
          background-color: #f3f4f6;
          border-color: #d97706;
        }
        
        .rbc-toolbar button.rbc-active {
          background: linear-gradient(to right, hsl(43, 74%, 49%), hsl(35, 70%, 45%));
          color: white;
          border-color: transparent;
        }
        
        .rbc-event {
          padding: 2px 4px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .rbc-event:hover {
          opacity: 1;
        }
        
        .rbc-show-more {
          background-color: transparent;
          color: #d97706;
          font-weight: 600;
          font-size: 11px;
        }
        
        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .rbc-day-bg {
          border-left: 1px solid #e5e7eb;
        }
        
        .rbc-time-slot {
          min-height: 40px;
        }
      `}</style>
    </AdminLayout>
  );
}