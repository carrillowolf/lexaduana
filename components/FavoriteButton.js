'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function FavoriteButton({ hsCode, countryCode, cifValue, calculationData }) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteId, setFavoriteId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const supabase = createClientComponentClient();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (user && hsCode) {
            checkIfFavorite();
        }
    }, [hsCode, countryCode, user]);

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    }

    async function checkIfFavorite() {
        if (!user || !hsCode) return;

        try {
            const response = await fetch('/api/favorites');

            if (!response.ok) {
                console.log('Error al cargar favoritos, usuario no autenticado');
                return;
            }

            if (data.favorites) {
                const existing = data.favorites.find(
                    f => f.hs_code === hsCode && f.country_code === countryCode
                );

                if (existing) {
                    setIsFavorite(true);
                    setFavoriteId(existing.id);
                }
            }
        } catch (error) {
            console.error('Error checking favorite:', error);
        }
    }

    async function toggleFavorite() {
        if (!user) {
            alert('Debes iniciar sesión para guardar favoritos');
            return;
        }

        setLoading(true);

        try {
            if (isFavorite) {
                // Eliminar favorito
                const response = await fetch(`/api/favorites?id=${favoriteId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    setIsFavorite(false);
                    setFavoriteId(null);
                }
            } else {
                // Añadir favorito
                const response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hs_code: hsCode,
                        country_code: countryCode,
                        cif_value: cifValue,
                        nickname: calculationData?.description || null
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setIsFavorite(true);
                    setFavoriteId(data.favorite.id);
                } else if (response.status === 409) {
                    alert('Este producto ya está en favoritos');
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('Error al guardar favorito');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return null;

    return (
        <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${isFavorite
                    ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
      `}
            title={isFavorite ? 'Eliminar de favoritos' : 'Añadir a favoritos'}
        >
            {isFavorite ? '★' : '☆'}
            <span className="hidden sm:inline">
                {isFavorite ? 'En favoritos' : 'Guardar'}
            </span>
        </button>
    );
}