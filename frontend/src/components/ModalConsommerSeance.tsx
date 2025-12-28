'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  clientPack: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalConsommerSeance({ clientPack, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [prestations, setPrestations] = useState([]);
  const [formData, setFormData] = useState({
    date_seance: new Date().toISOString().split('T')[0],
    prestation_id: '',
    notes: '',
  });

  useEffect(() => {
    loadPrestations();
  }, []);

  const loadPrestations = async () => {
    try {
      const { data } = await api.get('/prestations');
      setPrestations(data.filter((p: any) => p.actif));
    } catch (err) {
      console.error('Erreur chargement prestations:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post(`/client-packs/${clientPack.id}/consommer`, {
        date_seance: formData.date_seance,
        prestation_id: formData.prestation_id || null,
        notes: formData.notes || null,
      });

      Swal.fire({
        icon: 'success',
        title: 'Séance consommée!',
        html: `
          <p class="text-sm text-gray-600 mt-2">
            Séances restantes: <strong class="text-amber-600">${clientPack.nombre_seances_restantes - 1}</strong>
          </p>
        `,
        timer: 2000,
        showConfirmButton: false
      });

      onSuccess();
    } catch (err: any) {
      setLoading(false);
      
      let errorMessage = 'Impossible de consommer la séance';
      
      if (err.response?.data?.message) {
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
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-base font-bold text-gray-900">Consommer une séance</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {clientPack.client?.prenom} {clientPack.client?.nom}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Info Pack */}
        <div className="px-5 py-4 bg-gradient-to-br from-amber-50 to-amber-100 border-b border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-amber-700 font-semibold">{clientPack.pack?.nom}</p>
              <p className="text-xl font-bold text-amber-900 mt-1">
                {clientPack.nombre_seances_restantes} séances restantes
              </p>
            </div>
          </div>
          
          <div className="w-full bg-amber-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
              style={{ 
                width: `${(clientPack.nombre_seances_consommees / clientPack.nombre_seances_total) * 100}%` 
              }}
            />
          </div>
          <p className="text-xs text-amber-700 mt-1">
            {clientPack.nombre_seances_consommees} / {clientPack.nombre_seances_total} séances consommées
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">   
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Date de la séance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date_seance}
                onChange={(e) => setFormData({ ...formData, date_seance: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            {/* Prestation */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Prestation (optionnel)
              </label>
              <select
                value={formData.prestation_id}
                onChange={(e) => setFormData({ ...formData, prestation_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Aucune prestation spécifique</option>
                {prestations.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} - {p.duree} min
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Sélectionnez la prestation effectuée lors de cette séance
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Commentaires, observations..."
              />
            </div>

            {/* Warning si dernière séance */}
            {clientPack.nombre_seances_restantes === 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-medium">
                  ⚠️ Attention: C'est la dernière séance de ce pack. Le statut passera automatiquement à "Terminé".
                </p>
              </div>
            )}
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
              disabled={loading || clientPack.nombre_seances_restantes === 0}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-medium text-xs disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Consommer la séance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}