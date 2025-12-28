'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Header collapsed={collapsed} />
      
      <main className={`transition-all duration-300 pt-16 ${collapsed ? 'pl-20' : 'pl-64'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}