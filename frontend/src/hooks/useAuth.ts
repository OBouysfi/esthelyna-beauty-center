import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, LoginCredentials } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { AxiosError } from 'axios';

interface UseAuthReturn {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setAuth, logout: clearAuth } = useAuthStore();

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const { user, token } = await AuthService.login(credentials);
      setAuth(user, token);

      const redirectPath = user.role === 'admin' 
        ? '/admin/dashboard' 
        : '/assistante/dashboard';
      
      router.push(redirectPath);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      
      if (!axiosError.response) {
        setError('Impossible de se connecter au serveur');
        throw err;
      }

      switch (axiosError.response.status) {
        case 401:
          setError('Email ou mot de passe incorrect');
          break;
        case 403:
          setError('Votre compte est désactivé');
          break;
        case 422:
          setError('Veuillez vérifier vos informations');
          break;
        case 429:
          setError('Trop de tentatives. Réessayez dans quelques minutes.');
          break;
        case 500:
          setError('Erreur serveur. Réessayez plus tard.');
          break;
        default:
          setError(axiosError.response.data?.message || 'Une erreur est survenue');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      clearAuth();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      clearAuth();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return { login, logout, loading, error };
}