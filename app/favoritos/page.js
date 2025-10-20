'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function FavoritosPage() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const supabase = createClientComponentClient();
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/auth/login');
            return;
        }

        setUser(user);
        loadFavorites();
    }

    async function loadFavorites() {
        try {
            const response = await fetch('/api/favorites');
            const data = await response.json();

            if (data.favorites) {
                setFavorites(data.favorites);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteFavorite(id) {
        if (!confirm('¿Eliminar este favorito?')) return;

        try {
            const response = await fetch(`/api/favorites?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setFavorites(favorites.filter(f => f.id !== id));
            }
        } catch (error) {
            console.error('Error deleting favorite:', error);
        }
    }

    function recalculate(favorite) {
        router.push(`/?hs=${favorite.hs_code}&country=${favorite.country_code}&cif=${favorite.cif_value || 1000}`);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando favoritos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mis Productos Favoritos</h1>
                    <p className="mt-2 text-gray-600">
                        Productos guardados para consulta rápida
                    </p>
                </div>

                {/* Lista de favoritos */}
                {favorites.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay favoritos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Empieza guardando productos desde la calculadora
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => router.push('/')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Ir a la calculadora
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <ul className="divide-y divide-gray-200">
                            {favorites.map((favorite) => (
                                <li key={favorite.id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">★</span>
                                                <div>
                                                    <p className="text-sm font-medium text-blue-600">
                                                        HS {favorite.hs_code}
                                                    </p>
                                                    {favorite.nickname && (
                                                        <p className="text-sm text-gray-900 font-medium mt-1">
                                                            {favorite.nickname}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        País: {favorite.country_code || 'No especificado'}
                                                        {favorite.cif_value && ` • Valor CIF: €${favorite.cif_value.toLocaleString()}`}
                                                    </p>
                                                    {favorite.notes && (
                                                        <p className="text-sm text-gray-600 mt-1 italic">
                                                            {favorite.notes}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Guardado: {new Date(favorite.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => recalculate(favorite)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                            >
                                                Calcular
                                            </button>
                                            <button
                                                onClick={() => deleteFavorite(favorite.id)}
                                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}