/**
 * Local Storage Management Utilities
 * Handles persistence of user preferences and favorites
 */

export interface FavoriteAsset {
  coin: string;
  addedAt: number;
}

export interface RecentlyTradedAsset {
  coin: string;
  lastTradedAt: number;
}

export interface LayoutPreferences {
  panelSizes: {
    chart: number;
    orderBook: number;
    orderEntry: number;
  };
  activeTab: string;
  tradeHistoryFilters: {
    asset: string;
    timeRange: string;
    orderType: string;
  };
}

class StorageManager {
  private readonly STORAGE_KEYS = {
    FAVORITES: 'liquidvex_favorites',
    RECENTLY_TRADED: 'liquidvex_recently_traded',
    LAYOUT_PREFERENCES: 'liquidvex_layout_preferences',
    ASSET_SELECTOR_STATE: 'liquidvex_asset_selector_state',
  };

  /**
   * Check if localStorage is available (SSR-safe)
   */
  private isLocalStorageAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  /**
   * Get favorites from localStorage
   * SSR-safe: returns empty array if localStorage is not available
   */
  getFavorites(): FavoriteAsset[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.FAVORITES);
      if (!stored) return [];

      const favorites = JSON.parse(stored);
      return Array.isArray(favorites) ? favorites : [];
    } catch (error) {
      console.warn('Failed to parse favorites from localStorage:', error);
      return [];
    }
  }

  /**
   * Save favorites to localStorage
   * SSR-safe: does nothing if localStorage is not available
   */
  saveFavorites(favorites: FavoriteAsset[]): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }

  /**
   * Add asset to favorites
   */
  addToFavorites(coin: string): FavoriteAsset[] {
    const favorites = this.getFavorites();
    const existingIndex = favorites.findIndex(f => f.coin === coin);

    if (existingIndex > -1) {
      // Move to top if already exists
      const [existing] = favorites.splice(existingIndex, 1);
      existing.addedAt = Date.now();
      favorites.unshift(existing);
    } else {
      // Add new favorite
      favorites.unshift({
        coin,
        addedAt: Date.now(),
      });
    }

    // Limit to 20 favorites
    const limitedFavorites = favorites.slice(0, 20);
    this.saveFavorites(limitedFavorites);
    return limitedFavorites;
  }

  /**
   * Remove asset from favorites
   */
  removeFromFavorites(coin: string): FavoriteAsset[] {
    const favorites = this.getFavorites().filter(f => f.coin !== coin);
    this.saveFavorites(favorites);
    return favorites;
  }

  /**
   * Check if asset is favorited
   */
  isFavorited(coin: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some(f => f.coin === coin);
  }

  /**
   * Get recently traded assets
   * SSR-safe: returns empty array if localStorage is not available
   */
  getRecentlyTraded(): RecentlyTradedAsset[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.RECENTLY_TRADED);
      if (!stored) return [];

      const recentlyTraded = JSON.parse(stored);
      return Array.isArray(recentlyTraded) ? recentlyTraded : [];
    } catch (error) {
      console.warn('Failed to parse recently traded from localStorage:', error);
      return [];
    }
  }

  /**
   * Add asset to recently traded
   */
  addToRecentlyTraded(coin: string): RecentlyTradedAsset[] {
    const recentlyTraded = this.getRecentlyTraded();
    const existingIndex = recentlyTraded.findIndex(r => r.coin === coin);

    if (existingIndex > -1) {
      // Move to top and update timestamp
      const [existing] = recentlyTraded.splice(existingIndex, 1);
      existing.lastTradedAt = Date.now();
      recentlyTraded.unshift(existing);
    } else {
      // Add new recently traded
      recentlyTraded.unshift({
        coin,
        lastTradedAt: Date.now(),
      });
    }

    // Limit to 10 recently traded
    const limitedRecentlyTraded = recentlyTraded.slice(0, 10);
    this.saveRecentlyTraded(limitedRecentlyTraded);
    return limitedRecentlyTraded;
  }

  /**
   * Save recently traded assets
   * SSR-safe: does nothing if localStorage is not available
   */
  saveRecentlyTraded(recentlyTraded: RecentlyTradedAsset[]): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEYS.RECENTLY_TRADED, JSON.stringify(recentlyTraded));
    } catch (error) {
      console.error('Failed to save recently traded to localStorage:', error);
    }
  }

  /**
   * Get layout preferences
   * SSR-safe: returns null if localStorage is not available
   */
  getLayoutPreferences(): LayoutPreferences | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.LAYOUT_PREFERENCES);
      if (!stored) return null;

      const preferences = JSON.parse(stored);
      return this.validateLayoutPreferences(preferences);
    } catch (error) {
      console.warn('Failed to parse layout preferences from localStorage:', error);
      return null;
    }
  }

  /**
   * Save layout preferences
   * SSR-safe: does nothing if localStorage is not available
   */
  saveLayoutPreferences(preferences: LayoutPreferences): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEYS.LAYOUT_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save layout preferences to localStorage:', error);
    }
  }

  /**
   * Get asset selector state
   * SSR-safe: returns empty state if localStorage is not available
   */
  getAssetSelectorState(): { searchHistory: string[] } {
    if (!this.isLocalStorageAvailable()) {
      return { searchHistory: [] };
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.ASSET_SELECTOR_STATE);
      if (!stored) return { searchHistory: [] };

      const state = JSON.parse(stored);
      return {
        searchHistory: Array.isArray(state.searchHistory) ? state.searchHistory : [],
      };
    } catch (error) {
      console.warn('Failed to parse asset selector state from localStorage:', error);
      return { searchHistory: [] };
    }
  }

  /**
   * Save asset selector state
   * SSR-safe: does nothing if localStorage is not available
   */
  saveAssetSelectorState(state: { searchHistory: string[] }): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEYS.ASSET_SELECTOR_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save asset selector state to localStorage:', error);
    }
  }

  /**
   * Add search term to history
   */
  addToSearchHistory(term: string): string[] {
    const state = this.getAssetSelectorState();
    const normalizedTerm = term.trim().toLowerCase();

    if (!normalizedTerm) return state.searchHistory;

    const filteredHistory = state.searchHistory.filter(t => t.toLowerCase() !== normalizedTerm);
    const newHistory = [normalizedTerm, ...filteredHistory].slice(0, 10);

    this.saveAssetSelectorState({ searchHistory: newHistory });
    return newHistory;
  }

  /**
   * Clear all persistent data
   * SSR-safe: does nothing if localStorage is not available
   */
  clearAll(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.STORAGE_KEYS.FAVORITES);
      localStorage.removeItem(this.STORAGE_KEYS.RECENTLY_TRADED);
      localStorage.removeItem(this.STORAGE_KEYS.LAYOUT_PREFERENCES);
      localStorage.removeItem(this.STORAGE_KEYS.ASSET_SELECTOR_STATE);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Validate layout preferences structure
   */
  private validateLayoutPreferences(preferences: any): LayoutPreferences | null {
    if (!preferences || typeof preferences !== 'object') return null;

    const { panelSizes, activeTab, tradeHistoryFilters } = preferences;

    // Validate panel sizes
    if (!panelSizes || typeof panelSizes !== 'object') return null;
    if (typeof panelSizes.chart !== 'number' || typeof panelSizes.orderBook !== 'number' || typeof panelSizes.orderEntry !== 'number') {
      return null;
    }

    // Validate active tab
    if (typeof activeTab !== 'string') return null;

    // Validate trade history filters
    if (!tradeHistoryFilters || typeof tradeHistoryFilters !== 'object') return null;
    if (typeof tradeHistoryFilters.asset !== 'string' || typeof tradeHistoryFilters.timeRange !== 'string' || typeof tradeHistoryFilters.orderType !== 'string') {
      return null;
    }

    return preferences as LayoutPreferences;
  }
}

// Create singleton instance
export const storageManager = new StorageManager();

// Utility functions for easier access
export const favorites = {
  get: () => storageManager.getFavorites(),
  add: (coin: string) => storageManager.addToFavorites(coin),
  remove: (coin: string) => storageManager.removeFromFavorites(coin),
  isFavorited: (coin: string) => storageManager.isFavorited(coin),
  save: (favorites: FavoriteAsset[]) => storageManager.saveFavorites(favorites),
};

export const recentlyTraded = {
  get: () => storageManager.getRecentlyTraded(),
  add: (coin: string) => storageManager.addToRecentlyTraded(coin),
  save: (recentlyTraded: RecentlyTradedAsset[]) => storageManager.saveRecentlyTraded(recentlyTraded),
};

export const layoutPreferences = {
  get: () => storageManager.getLayoutPreferences(),
  save: (preferences: LayoutPreferences) => storageManager.saveLayoutPreferences(preferences),
};

export const searchHistory = {
  get: () => storageManager.getAssetSelectorState().searchHistory,
  add: (term: string) => storageManager.addToSearchHistory(term),
  save: (searchHistory: string[]) => storageManager.saveAssetSelectorState({ searchHistory }),
};