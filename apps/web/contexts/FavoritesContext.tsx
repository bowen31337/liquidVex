'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FavoriteAsset, RecentlyTradedAsset } from '../lib/storage';
import { favorites as favoritesStorage, recentlyTraded as recentlyTradedStorage } from '../lib/storage';

interface FavoritesContextType {
  // Favorites
  favorites: FavoriteAsset[];
  addToFavorites: (coin: string) => void;
  removeFromFavorites: (coin: string) => void;
  isFavorited: (coin: string) => boolean;
  moveFavoriteToTop: (coin: string) => void;

  // Recently Traded
  recentlyTraded: RecentlyTradedAsset[];
  addToRecentlyTraded: (coin: string) => void;
  clearRecentlyTraded: () => void;

  // Combined lists with sorting
  sortedFavorites: FavoriteAsset[];
  sortedRecentlyTraded: RecentlyTradedAsset[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteAsset[]>([]);
  const [recentlyTraded, setRecentlyTraded] = useState<RecentlyTradedAsset[]>([]);

  // Load initial data from localStorage
  useEffect(() => {
    setFavorites(favoritesStorage.get());
    setRecentlyTraded(recentlyTradedStorage.get());
  }, []);

  const addToFavorites = (coin: string) => {
    const newFavorites = favoritesStorage.add(coin);
    setFavorites(newFavorites);
  };

  const removeFromFavorites = (coin: string) => {
    const newFavorites = favoritesStorage.remove(coin);
    setFavorites(newFavorites);
  };

  const isFavorited = (coin: string) => {
    return favoritesStorage.isFavorited(coin);
  };

  const moveFavoriteToTop = (coin: string) => {
    const updatedFavorites = favorites.map(fav => {
      if (fav.coin === coin) {
        return { ...fav, addedAt: Date.now() };
      }
      return fav;
    }).sort((a, b) => b.addedAt - a.addedAt);

    favoritesStorage.save(updatedFavorites);
    setFavorites(updatedFavorites);
  };

  const addToRecentlyTraded = (coin: string) => {
    const newRecentlyTraded = recentlyTradedStorage.add(coin);
    setRecentlyTraded(newRecentlyTraded);
  };

  const clearRecentlyTraded = () => {
    recentlyTradedStorage.save([]);
    setRecentlyTraded([]);
  };

  // Sort favorites by most recently added
  const sortedFavorites = favorites.sort((a, b) => b.addedAt - a.addedAt);

  // Sort recently traded by most recent
  const sortedRecentlyTraded = recentlyTraded.sort((a, b) => b.lastTradedAt - a.lastTradedAt);

  const contextValue: FavoritesContextType = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    moveFavoriteToTop,
    recentlyTraded,
    addToRecentlyTraded,
    clearRecentlyTraded,
    sortedFavorites,
    sortedRecentlyTraded,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

// Export hooks for easier imports
export const useFavoritesState = () => {
  const { favorites, sortedFavorites } = useFavorites();
  return { favorites, sortedFavorites };
};

export const useRecentlyTradedState = () => {
  const { recentlyTraded, sortedRecentlyTraded } = useFavorites();
  return { recentlyTraded, sortedRecentlyTraded };
};

export const useFavoritesActions = () => {
  const {
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    moveFavoriteToTop,
    addToRecentlyTraded,
    clearRecentlyTraded,
  } = useFavorites();

  return {
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    moveFavoriteToTop,
    addToRecentlyTraded,
    clearRecentlyTraded,
  };
};