'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  pack?: any;
  categories: any[];
  onClose: () => void;
  onSuccess: (pack: any) => void;
}

export default function ModalPack({ pack, categories, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    zones: '',
    prix: '',
    nombre_seances: '',
    duree_seance: '60',
    description: '',
  });

  useEffect(() => {
    if (pack) {
      setFormData({
        nom: pack.nom || '',
        categorie: pack.categorie || '',
        zones: pack.zones || '',
        prix: pack.prix || '',
        nombre_seances: pack.nombre_seances || '',
        duree_seance: pack.duree_seance || '60',
        description: pack.description || '',
      });
    }
  }, [pack]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (pack) {
        await api.put(`/packs/${pack.id}`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Modifié!',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await api.post('/packs', formData);
        Swal.fire({
          icon: 'success',
          title: 'Créé!',
          timer: 1500,
          showConfirmButton: false
        });
      }
      
      onSuccess(formData);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Une erreur est survenue',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {pack ? 'Modifier le pack' : 'Nouveau pack'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du pack *
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] text-sm"
                required
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] text-sm"
                required
              >
                <option value="">Sélectionner</option>
                {categories.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
            </div>

            {/* Prix */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prix (DH) *
              </label>
              <input
                type="number"
                value={formData.prix}
                onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] text-sm"
                required
              />
            </div>

            {/* Séances */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de séances *
              </label>
              <input
                type="number"
                value={formData.nombre_seances}
                onChange={(e) => setFormData({ ...formData, nombre_seances: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] text-sm"
                required
              />
            </div>

            {/* Zones */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zones
              </label>
              <input
                type="number"
                value={formData.zones}
                onChange={(e) => setFormData({ ...formData, zones: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] text-sm"
                placeholder="Ex: 3"
              />
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Durée/séance (min)
              </label>
              <input
                type="number"
                value={formData.duree_seance}
                onChange={(e) => setFormData({ ...formData, duree_seance: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] text-sm"
              />
            </div>

            {/* Description - pleine largeur */}
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C4DA0] focus:border-[#0C4DA0] text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#0C4DA0] text-white rounded-lg hover:bg-red-600 font-medium text-sm"
            >
              {loading ? 'En cours...' : pack ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}