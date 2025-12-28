'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Header({ collapsed }: any) {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <header className={`fixed top-0 right-0 bg-white border-b border-gray-200 transition-all duration-300 ${collapsed ? 'left-20' : 'left-64'} z-40`}>
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
            Bonjour, {user?.prenom}
          </h1>
          <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
            Bienvenue dans votre espace
          </p>
        </div>

        {/* Right - Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins' }}>
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-gray-500 capitalize" style={{ fontFamily: 'Poppins' }}>
                {user?.role}
              </p>
            </div>
            <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-700 font-semibold text-sm" style={{ fontFamily: 'Poppins' }}>
                {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
              </span>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-gray-600 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/admin/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'Poppins' }}
                >
                  <UserIcon className="h-5 w-5" />
                  Mon Profil
                </button>
                {/* <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Poppins' }}>
                  <Cog6ToothIcon className="h-5 w-5" />
                  Paramètres
                </button> */}
                <div className="my-1 border-t border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  style={{ fontFamily: 'Poppins' }}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}