import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'assistante';
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
      },
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'auth-storage',
    }
  )
);