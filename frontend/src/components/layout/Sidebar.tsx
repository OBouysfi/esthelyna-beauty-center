'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { 
  Squares2X2Icon,
  CalendarDaysIcon,
  UsersIcon,
  CalendarIcon,
  CubeIcon,
  CreditCardIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Squares2X2Icon },
  { name: 'Calendrier', href: '/admin/calendrier', icon: CalendarDaysIcon },
  { name: 'Clients', href: '/admin/clients', icon: UsersIcon },
  { name: 'RDV', href: '/admin/rendez-vous', icon: CalendarIcon },
  { name: 'Packs', href: '/admin/packs', icon: CubeIcon },
  { name: 'Suivi Client', href: '/admin/suivi', icon: ClipboardDocumentListIcon },
  { name: 'Paiements', href: '/admin/paiements', icon: CreditCardIcon },
  { name: 'Statistiques', href: '/admin/statistiques', icon: ChartBarIcon },
];

export default function Sidebar({ collapsed, setCollapsed }: any) {
  const pathname = usePathname();

  return (
    <div className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} z-50`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Epiloria" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Epiloria</p>
                <p className="text-xs text-gray-500">BEAUTY CENTER</p>
              </div>
            </div>
          ) : (
            <div className="h-12 w-12 bg-gradient-to-br from-[#0C4DA0] to-[#083a7a] rounded-xl flex items-center justify-center mx-auto shadow-md">
              <span className="text-white font-black text-xl">E</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#0C4DA0] text-white shadow-md'
                      : 'text-gray-600 hover:text-white hover:bg-red-600'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-all shadow-md"
        >
          <ChevronLeftIcon className={`h-4 w-4 text-gray-600 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
