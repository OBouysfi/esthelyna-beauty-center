'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  pack?: any;
  onClose: () => void;
  onSuccess: (pack: any) => void;
}

export default function ModalPack({ pack, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [prestations, setPrestations] = useState([]);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    nombre_seances_total: '',
    validite_jours: '90',
    actif: true,
  });
  const [selectedPrestations, setSelectedPrestations] = useState<any[]>([]);

  useEffect(() => {
    loadPrestations();
    
    if (pack) {
      setFormData({
        nom: pack.nom || '',
        description: pack.description || '',
        prix: pack.prix?.toString() || '',
        nombre_seances_total: pack.nombre_seances_total?.toString() || '',
        validite_jours: pack.validite_jours?.toString() || '90',
        actif: pack.actif ?? true,
      });

      if (pack.prestations && pack.prestations.length > 0) {
        setSelectedPrestations(pack.prestations.map((p: any) => ({
          prestation_id: p.id,
          nom: p.nom,
          nombre_seances: p.pivot.nombre_seances
        })));
      }
    }
  }, [pack]);

  const loadPrestations = async () => {
    try {
      const { data } = await api.get('/prestations');
      setPrestations(data.filter((p: any) => p.actif));
    } catch (err) {
      console.error('Erreur chargement prestations:', err);
    }
  };

  const addPrestation = () => {
    setSelectedPrestations([...selectedPrestations, {
      prestation_id: '',
      nom: '',
      nombre_seances: 1
    }]);
  };

  const removePrestation = (index: number) => {
    setSelectedPrestations(selectedPrestations.filter((_, i) => i !== index));
  };

  const updatePrestation = (index: number, field: string, value: any) => {
    const updated = [...selectedPrestations];
    
    if (field === 'prestation_id') {
      const prestation = prestations.find((p: any) => p.id === parseInt(value));
      updated[index] = {
        ...updated[index],
        prestation_id: value,
        nom: prestation?.nom || ''
      };
    } else {
      updated[index][field] = value;
    }
    
    setSelectedPrestations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nom: formData.nom,
        description: formData.description,
        prix: parseFloat(formData.prix),
        nombre_seances_total: parseInt(formData.nombre_seances_total),
        validite_jours: parseInt(formData.validite_jours),
        actif: formData.actif,
        prestations: selectedPrestations.filter(p => p.prestation_id).map(p => ({
          prestation_id: parseInt(p.prestation_id),
          nombre_seances: parseInt(p.nombre_seances)
        }))
      };

      let savedPack;
      
      if (pack) {
        const { data } = await api.put(`/packs/${pack.id}`, payload);
        savedPack = data.pack;
        
        Swal.fire({
          icon: 'success',
          title: 'Modifié!',
          text: 'Pack modifié avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const { data } = await api.post('/packs', payload);
        savedPack = data.pack;
        
        Swal.fire({
          icon: 'success',
          title: 'Créé!',
          text: 'Pack créé avec succès',
          timer: 1500,
          showConfirmButton: false
        });
      }
      
      onSuccess(savedPack);
      
    } catch (err: any) {
      setLoading(false);
      
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
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
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {pack ? 'Modifier Pack' : 'Nouveau Pack'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nom du Pack <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ex: Forfait Beauté 10 séances"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Décrivez le pack..."
              />
            </div>

            {/* Prix, Séances, Validité */}
            <div className="grid grid-cols-3 gap-3">
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
                  Séances <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.nombre_seances_total}
                  onChange={(e) => setFormData({ ...formData, nombre_seances_total: e.target.value })}
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Validité (jours) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.validite_jours}
                  onChange={(e) => setFormData({ ...formData, validite_jours: e.target.value })}
                  min="1"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Actif */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label htmlFor="actif" className="text-sm text-gray-700">
                Pack actif
              </label>
            </div>

            {/* Prestations incluses */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-gray-700">
                  Prestations incluses (optionnel)
                </label>
                <button
                  type="button"
                  onClick={addPrestation}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Ajouter
                </button>
              </div>

              {selectedPrestations.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                  Aucune prestation ajoutée
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedPrestations.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={item.prestation_id}
                        onChange={(e) => updatePrestation(index, 'prestation_id', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                      >
                        <option value="">Choisir une prestation</option>
                        {prestations.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.nom}</option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        value={item.nombre_seances}
                        onChange={(e) => updatePrestation(index, 'nombre_seances', e.target.value)}
                        min="1"
                        placeholder="Nb"
                        className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                      />
                      
                      <button
                        type="button"
                        onClick={() => removePrestation(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
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
              {loading ? 'Enregistrement...' : pack ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}