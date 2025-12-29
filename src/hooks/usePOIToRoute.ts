/**
 * usePOIToRoute Hook
 * Handles adding POIs to the route planner
 */

import { useNavigate } from 'react-router-dom';
import type { POI } from '@/types';

const POI_TO_ROUTE_KEY = 'pending-poi-to-route';

export function usePOIToRoute() {
  const navigate = useNavigate();

  /**
   * Add a POI to route planner
   * Stores POI in sessionStorage and navigates to route planner
   */
  const addPOIToRoute = (poi: POI) => {
    try {
      // Store POI data in sessionStorage (cleared on page close)
      sessionStorage.setItem(
        POI_TO_ROUTE_KEY,
        JSON.stringify({
          name: poi.name,
          lat: poi.location.lat.toString(),
          lng: poi.location.lng.toString(),
          type: poi.type,
        })
      );

      // Navigate to route planner
      navigate('/route-planner');
    } catch (error) {
      console.error('[usePOIToRoute] Failed to add POI to route:', error);
    }
  };

  /**
   * Get pending POI to add to route (called by route planner)
   */
  const getPendingPOI = ():
    | { name: string; lat: string; lng: string; type: string }
    | null => {
    try {
      const stored = sessionStorage.getItem(POI_TO_ROUTE_KEY);
      if (!stored) return null;

      // Clear after reading
      sessionStorage.removeItem(POI_TO_ROUTE_KEY);

      return JSON.parse(stored);
    } catch (error) {
      console.error('[usePOIToRoute] Failed to get pending POI:', error);
      return null;
    }
  };

  return {
    addPOIToRoute,
    getPendingPOI,
  };
}
