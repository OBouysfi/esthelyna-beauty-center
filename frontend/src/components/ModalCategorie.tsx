'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  categorie?: any;
  onClose: () => void;
  onSuccess: (categorie: any) => void;
}

export default function ModalCategorie({ categorie, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    actif: true
  });

  useEffect(() => {
    if (categorie) {
      setFormData({
        nom: categorie.nom || '',
        actif: categorie.actif ?? true
      });
    }
  }, [categorie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedCategorie;
      
      if (categorie) {
        const { data } = await api.put(`/categories/${categorie.id}`, formData);
        savedCategorie = data.categorie;
        
        Swal.fire({
          icon: 'success',
          title: 'Modifiée!',
          text: 'Catégorie modifiée avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const { data } = await api.post('/categories', formData);
        savedCategorie = data.categorie;
        
        Swal.fire({
          icon: 'success',
          title: 'Créée!',
          text: 'Catégorie créée avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      }
      
      onSuccess(savedCategorie);
      
    } catch (err: any) {
      setLoading(false);
      
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors)[0][0];
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="text-base font-bold text-gray-900">
            {categorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nom de la catégorie <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ex: Soin du visage"
                required
                autoFocus
              />
            </div>

            {/* Actif */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <label htmlFor="actif" className="text-sm text-gray-700 font-medium">
                Catégorie active
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-medium text-xs disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : categorie ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}