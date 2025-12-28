'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ModalCategorie from '@/components/ModalCategorie';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { 
  RectangleStackIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActif, setFilterActif] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories/all');
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtres locaux
  useEffect(() => {
    let filtered = [...categories];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((c: any) =>
        c.nom?.toLowerCase().includes(searchLower)
      );
    }

    if (filterActif !== 'all') {
      filtered = filtered.filter((c: any) => 
        c.actif === (filterActif === '1')
      );
    }

    setFilteredCategories(filtered);
  }, [search, filterActif, categories]);

  const toggleActif = async (categorie: any) => {
    // Mise à jour optimiste (instantanée)
    const newActif = !categorie.actif;
    
    setCategories(categories.map((c: any) =>
      c.id === categorie.id ? { ...c, actif: newActif } : c
    ));

    try {
      await api.patch(`/categories/${categorie.id}/toggle`);
      
      // Pas besoin de re-fetch, déjà mis à jour
    } catch (error) {
      // Rollback en cas d'erreur
      setCategories(categories.map((c: any) =>
        c.id === categorie.id ? { ...c, actif: !newActif } : c
      ));
      
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de modifier le statut',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm'
        }
      });
    }
  };

  const handleDelete = async (categorie: any) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      html: `Voulez-vous supprimer <strong>${categorie.nom}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm mr-2',
        cancelButton: 'px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm'
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/categories/${categorie.id}`);
        
        setCategories(categories.filter((c: any) => c.id !== categorie.id));

        Swal.fire({
          icon: 'success',
          title: 'Supprimée!',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Impossible de supprimer la catégorie';
        
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
    }
  };

  const handleCategorieSaved = (savedCategorie: any) => {
    if (selectedCategorie) {
      setCategories(categories.map((c: any) => 
        c.id === savedCategorie.id ? savedCategorie : c
      ));
    } else {
      setCategories([...categories, savedCategorie]);
    }

    setShowModal(false);
    setSelectedCategorie(null);
  };

  const totalActives = categories.filter((c: any) => c.actif).length;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catégories</h1>
          <p className="text-xs text-gray-600 mt-0.5">Gérez les catégories de prestations</p>
        </div>
        
        <button
          onClick={() => {
            setSelectedCategorie(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-xs font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Nouvelle Catégorie
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Total Catégories
              </p>
              <p className="text-xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <RectangleStackIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Actives
              </p>
              <p className="text-xl font-bold text-gray-900">{totalActives}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une catégorie..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterActif}
            onChange={(e) => setFilterActif(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="1">Actives</option>
            <option value="0">Inactives</option>
          </select>
        </div>
      </div>

      {/* Categories Grid - Design épuré */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <RectangleStackIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">Aucune catégorie trouvée</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg text-xs font-medium"
          >
            Créer une catégorie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((categorie: any) => (
            <div 
              key={categorie.id} 
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">{categorie.nom}</h3>
                
                <div 
                    onClick={() => toggleActif(categorie)}
                    className="flex items-center gap-1.5 cursor-pointer"
                    title={categorie.actif ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}
                    >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        categorie.actif 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                        {categorie.actif && (
                        <CheckCircleIcon className="h-3 w-3 text-white" />
                        )}
                    </div>
                    <span className="text-xs text-dark-600">
                        {categorie.actif ? 'Active' : 'Inactive'}
                    </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                    categorie.actif 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-white-600'
                }`}>
                    {categorie.actif ? 'Active' : 'Inactive'}
                </span>
                
                <div className="flex-1"></div>

                <button
                    onClick={() => {
                    setSelectedCategorie(categorie);
                    setShowModal(true);
                    }}
                    className="p-1 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all"
                    title="Modifier"
                >
                    <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={() => handleDelete(categorie)}
                    className="p-1 bg-gradient-to-r from-[hsl(43,74%,49%)] to-[hsl(35,70%,45%)] text-white rounded-lg hover:shadow-md transition-all"
                    title="Supprimer"
                >
                    <TrashIcon className="h-3.5 w-3.5" />
                </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ModalCategorie
          categorie={selectedCategorie}
          onClose={() => {
            setShowModal(false);
            setSelectedCategorie(null);
          }}
          onSuccess={handleCategorieSaved}
        />
      )}
    </AdminLayout>
  );
}