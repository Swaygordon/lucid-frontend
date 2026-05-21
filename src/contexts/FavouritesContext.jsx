import React, { createContext, useContext, useState, useCallback } from 'react';

// [API] POST /users/:id/favourites   { providerId }  → { saved: true }
// [API] DELETE /users/:id/favourites/:providerId      → { removed: true }
// [API] GET /users/:id/favourites                     → [{ id, name, role, location, rating, image }]
// Replace sessionStorage persistence below with those calls once auth is available.

const FavouritesContext = createContext();

export const useFavourites = () => {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used within FavouritesProvider');
  return ctx;
};

export const FavouritesProvider = ({ children }) => {
  const [favouriteProviders, setFavouriteProviders] = useState(() => {
    try {
      const saved = sessionStorage.getItem('lucid_favourites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isFavourite = useCallback(
    (id) => favouriteProviders.some(p => p.id === id),
    [favouriteProviders]
  );

  // provider snapshot: { id, name, role, location, rating, image }
  const toggleFavourite = useCallback((provider) => {
    setFavouriteProviders(prev => {
      const exists = prev.some(p => p.id === provider.id);
      const next = exists
        ? prev.filter(p => p.id !== provider.id)
        : [...prev, provider];
      try {
        sessionStorage.setItem('lucid_favourites', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return (
    <FavouritesContext.Provider value={{ favouriteProviders, isFavourite, toggleFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
};
