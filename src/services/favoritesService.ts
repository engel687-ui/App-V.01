/**
 * Favorites Service
 * Manages user's favorite POIs with localStorage persistence
 */

const FAVORITES_STORAGE_KEY = 'tour-planner-favorites';

interface FavoritesPOI {
  id: string;
  name: string;
  type: string;
  location: { lat: number; lng: number };
  savedAt: number;
}

class FavoritesService {
  /**
   * Get all favorite POI IDs
   */
  getFavoriteIds(): string[] {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!stored) return [];
      const favorites = JSON.parse(stored) as FavoritesPOI[];
      return favorites.map((f) => f.id);
    } catch (error) {
      console.error('[FavoritesService] Failed to get favorite IDs:', error);
      return [];
    }
  }

  /**
   * Get all favorite POIs with details
   */
  getAllFavorites(): FavoritesPOI[] {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as FavoritesPOI[];
    } catch (error) {
      console.error('[FavoritesService] Failed to get favorites:', error);
      return [];
    }
  }

  /**
   * Check if a POI is favorited
   */
  isFavorite(poiId: string): boolean {
    const favoriteIds = this.getFavoriteIds();
    return favoriteIds.includes(poiId);
  }

  /**
   * Add a POI to favorites
   */
  addFavorite(poi: {
    id: string;
    name: string;
    type: string;
    location: { lat: number; lng: number };
  }): boolean {
    try {
      const favorites = this.getAllFavorites();

      // Check if already favorited
      if (favorites.some((f) => f.id === poi.id)) {
        return false;
      }

      // Add new favorite
      const newFavorite: FavoritesPOI = {
        id: poi.id,
        name: poi.name,
        type: poi.type,
        location: poi.location,
        savedAt: Date.now(),
      };

      favorites.push(newFavorite);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));

      return true;
    } catch (error) {
      console.error('[FavoritesService] Failed to add favorite:', error);
      return false;
    }
  }

  /**
   * Remove a POI from favorites
   */
  removeFavorite(poiId: string): boolean {
    try {
      const favorites = this.getAllFavorites();
      const filtered = favorites.filter((f) => f.id !== poiId);

      if (filtered.length === favorites.length) {
        // POI wasn't in favorites
        return false;
      }

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('[FavoritesService] Failed to remove favorite:', error);
      return false;
    }
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(poi: {
    id: string;
    name: string;
    type: string;
    location: { lat: number; lng: number };
  }): boolean {
    const isFav = this.isFavorite(poi.id);

    if (isFav) {
      return this.removeFavorite(poi.id);
    } else {
      return this.addFavorite(poi);
    }
  }

  /**
   * Get favorites count
   */
  getFavoritesCount(): number {
    return this.getAllFavorites().length;
  }

  /**
   * Clear all favorites
   */
  clearAllFavorites(): void {
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch (error) {
      console.error('[FavoritesService] Failed to clear favorites:', error);
    }
  }

  /**
   * Export favorites as JSON
   */
  exportFavorites(): string {
    const favorites = this.getAllFavorites();
    return JSON.stringify(favorites, null, 2);
  }

  /**
   * Import favorites from JSON
   */
  importFavorites(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString) as FavoritesPOI[];

      // Validate structure
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: expected array');
      }

      // Merge with existing favorites (avoid duplicates)
      const existing = this.getAllFavorites();
      const merged = [...existing];

      imported.forEach((newFav) => {
        if (!merged.some((f) => f.id === newFav.id)) {
          merged.push(newFav);
        }
      });

      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(merged));
      return true;
    } catch (error) {
      console.error('[FavoritesService] Failed to import favorites:', error);
      return false;
    }
  }
}

// Export singleton instance
export const favoritesService = new FavoritesService();
