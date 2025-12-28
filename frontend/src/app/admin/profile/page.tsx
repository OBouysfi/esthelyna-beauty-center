'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  UserCircleIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const [profileData, setProfileData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/me');
      setUser(data);
      setProfileData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        telephone: data.telephone || ''
      });
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.put('/profile', profileData);
      
      Swal.fire({
        title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: #10b981;">Profil mis à jour!</span>',
        html: '<p style="font-family: Poppins; font-size: 14px; color: #6b7280; margin-top: 8px;">Vos informations ont été modifiées</p>',
        timer: 2000,
        showConfirmButton: false,
        width: '350px',
        padding: '25px',
        customClass: {
          popup: 'rounded-xl shadow-2xl'
        }
      });
      
      loadProfile();
    } catch (error: any) {
      Swal.fire({
        title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: rgb(173, 18, 18);">Erreur</span>',
        html: `<p style="font-family: Poppins; font-size: 14px; color: #6b7280; margin-top: 8px;">${error.response?.data?.message || 'Impossible de mettre à jour'}</p>`,
        confirmButtonText: 'OK',
        buttonsStyling: false,
        width: '350px',
        padding: '25px',
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          confirmButton: 'px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm'
        }
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      Swal.fire({
        title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: rgb(173, 18, 18);">Erreur</span>',
        html: '<p style="font-family: Poppins; font-size: 14px; color: #6b7280; margin-top: 8px;">Les mots de passe ne correspondent pas</p>',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        width: '350px',
        padding: '25px',
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          confirmButton: 'px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm'
        }
      });
      return;
    }

    try {
      await api.put('/profile/password', passwordData);
      
      Swal.fire({
        title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: #10b981;">Mot de passe changé!</span>',
        html: '<p style="font-family: Poppins; font-size: 14px; color: #6b7280; margin-top: 8px;">Votre mot de passe a été modifié</p>',
        timer: 2000,
        showConfirmButton: false,
        width: '350px',
        padding: '25px',
        customClass: {
          popup: 'rounded-xl shadow-2xl'
        }
      });
      
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      Swal.fire({
        title: '<span style="font-family: Poppins; font-size: 18px; font-weight: 600; color: rgb(173, 18, 18);">Erreur</span>',
        html: `<p style="font-family: Poppins; font-size: 14px; color: #6b7280; margin-top: 8px;">${error.response?.data?.message || 'Impossible de changer le mot de passe'}</p>`,
        confirmButtonText: 'OK',
        buttonsStyling: false,
        width: '350px',
        padding: '25px',
        customClass: {
          popup: 'rounded-xl shadow-2xl',
          confirmButton: 'px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm'
        }
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-amber-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>Mon Profil</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Poppins' }}>Gérez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Profil */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                {user?.prenom} {user?.nom}
              </h2>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins' }}>{user?.email}</p>
              <div className="mt-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium" style={{ fontFamily: 'Poppins' }}>
                Administrateur
              </div>
            </div>
          </div>
        </div>

        {/* Formulaires */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins' }}>
              Informations personnelles
            </h3>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins' }}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={profileData.prenom}
                    onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    style={{ fontFamily: 'Poppins' }}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins' }}>
                    Nom
                  </label>
                  <input
                    type="text"
                    value={profileData.nom}
                    onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    style={{ fontFamily: 'Poppins' }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins' }}>
                    <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    style={{ fontFamily: 'Poppins' }}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins' }}>
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={profileData.telephone}
                    onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                    style={{ fontFamily: 'Poppins' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                style={{ fontFamily: 'Poppins' }}
              >
                Mettre à jour le profil
              </button>
            </form>
          </div>

          {/* Changer mot de passe */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                <KeyIcon className="h-5 w-5 inline mr-2" />
                Mot de passe
              </h3>
              
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="px-3 py-1.5 border border-amber-500 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors"
                  style={{ fontFamily: 'Poppins' }}
                >
                  Changer
                </button>
              )}
            </div>

            {showPasswordForm ? (
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins' }}>
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      style={{ fontFamily: 'Poppins' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins' }}>
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      style={{ fontFamily: 'Poppins' }}
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Poppins' }}>
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password_confirmation}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      style={{ fontFamily: 'Poppins' }}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          current_password: '',
                          new_password: '',
                          new_password_confirmation: ''
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Changer le mot de passe
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins' }}>
                ••••••••
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}