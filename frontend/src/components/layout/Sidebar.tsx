'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/solid';
import { 
  Squares2X2Icon,
  CalendarIcon,
  UsersIcon,
  SparklesIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  RectangleStackIcon,
  CalendarDaysIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const mainNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: Squares2X2Icon },
  { name: 'Calendrier', href: '/admin/calendrier', icon: CalendarDaysIcon },
  { name: 'Clients', href: '/admin/clients', icon: UsersIcon },
  { name: 'Rendez-vous', href: '/admin/rendez-vous', icon: CalendarIcon },
  { name: 'Prestations', href: '/admin/prestations', icon: SparklesIcon },
  { name: 'Packs', href: '/admin/packs', icon: CubeIcon },
  { name: 'Packs Clients', href: '/admin/packs-clients', icon: ClipboardDocumentListIcon },
];

const adminNavigation = [
  { name: 'Catégories', href: '/admin/categories', icon: RectangleStackIcon },
  { name: 'Paiements', href: '/admin/paiements', icon: CreditCardIcon },
  { name: 'Statistiques', href: '/admin/statistiques', icon: ChartBarIcon },
];

export default function Sidebar({ collapsed, setCollapsed }: any) {
  const pathname = usePathname();

  return (
    <div className={`fixed inset-y-0 left-0 bg-[#FCFAF8] border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} z-50`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Esthelyna" className="h-9" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Esthelyna</p>
                <p className="text-xs text-amber-600">BEAUTY CENTER</p>
              </div>
            </div>
          ) : (
            <img src="/logo.png" alt="Esthelyna" className="h-9 mx-auto" />
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* MAIN Section */}
          {!collapsed && (
            <div className="px-4 mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MAIN</p>
            </div>
          )}
          <nav className="px-3 space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-amber-100 text-amber-600'
                      : 'text-gray-900 hover:bg-gray-100'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* ADMIN Section */}
          {!collapsed && (
            <div className="px-4 mb-2 mt-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ADMIN</p>
            </div>
          )}
          <nav className="px-3 space-y-1">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-amber-100 text-amber-600'
                      : 'text-gray-900 hover:bg-gray-100'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3">
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-900 hover:bg-gray-100 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Paramètres</span>}
          </Link>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 shadow-md"
        >
          <ChevronLeftIcon className={`h-4 w-4 text-gray-600 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}