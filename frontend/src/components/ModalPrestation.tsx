'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  prestation?: any;
  onClose: () => void;
  onSuccess: (prestation: any) => void;
}

export default function ModalPrestation({ prestation, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    prix: '',
    duree: '',
    description: '',
    actif: true
  });

  useEffect(() => {
    loadCategories();
    
    if (prestation) {
      setFormData({
        nom: prestation.nom || '',
        categorie: prestation.categorie || '',
        prix: prestation.prix?.toString() || '',
        duree: prestation.duree?.toString() || '',
        description: prestation.description || '',
        actif: prestation.actif ?? true
      });
    }
  }, [prestation]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
      
      // Si pas de prestation (mode création), sélectionner la première catégorie
      if (!prestation && data.length > 0) {
        setFormData(prev => ({ ...prev, categorie: data[0].nom }));
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      // Fallback
      const fallback = [{ nom: 'Soin' }, { nom: 'Épilation' }, { nom: 'Massage' }];
      setCategories(fallback);
      if (!prestation) {
        setFormData(prev => ({ ...prev, categorie: 'Soin' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        prix: parseFloat(formData.prix),
        duree: parseInt(formData.duree)
      };

      let savedPrestation;
      
      if (prestation) {
        const { data } = await api.put(`/prestations/${prestation.id}`, payload);
        savedPrestation = data.prestation;
        
        Swal.fire({
          icon: 'success',
          title: 'Modifiée!',
          text: 'Prestation modifiée avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const { data } = await api.post('/prestations', payload);
        savedPrestation = data.prestation;
        
        Swal.fire({
          icon: 'success',
          title: 'Créée!',
          text: 'Prestation créée avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      }
      
      onSuccess(savedPrestation);
      
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
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            {prestation ? 'Modifier la prestation' : 'Nouvelle prestation'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-3">
            {/* Nom */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nom de la prestation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.nom}>{cat.nom}</option>
                ))}
              </select>
            </div>

            {/* Prix et Durée */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Prix (DH) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Durée (min) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Description de la prestation..."
              />
            </div>

            {/* Actif */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <label htmlFor="actif" className="text-sm text-gray-700">
                Prestation active
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
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
              {loading ? 'Enregistrement...' : prestation ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}