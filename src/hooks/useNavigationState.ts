/**
 * useNavigationState Hook
 *
 * Manages navigation state for trip planning and active navigation.
 * Handles data passing between QuickPlanDialog, My Trips, Dashboard, and Route Planner.
 *
 * Usage:
 *   const { startNavigation, resumeNavigation, clearNavigation, navigationData } = useNavigationState();
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export type NavigationMode = 'start' | 'resume' | null;

export interface NavigationData {
  tripId?: string;
  mode: NavigationMode;
  waypoints?: Array<{
    name: string;
    lat: string;
    lng: string;
  }>;
  routeName?: string;
  timestamp: number;
}

const NAVIGATION_STATE_KEY = 'active-navigation-state';

export function useNavigationState() {
  const navigate = useNavigate();
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);

  /**
   * Load navigation state from sessionStorage on mount
   */
  useEffect(() => {
    const stored = sessionStorage.getItem(NAVIGATION_STATE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setNavigationData(data);
      } catch (error) {
        console.error('[useNavigationState] Failed to parse stored state:', error);
        sessionStorage.removeItem(NAVIGATION_STATE_KEY);
      }
    }
  }, []);

  /**
   * Save navigation state to sessionStorage whenever it changes
   */
  useEffect(() => {
    if (navigationData) {
      sessionStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(navigationData));
    } else {
      sessionStorage.removeItem(NAVIGATION_STATE_KEY);
    }
  }, [navigationData]);

  /**
   * Start new navigation from QuickPlanDialog
   * Saves route name and initial waypoints, then navigates to Route Planner
   */
  const startNavigation = useCallback(
    (routeName: string, waypoints: Array<{ name: string; lat: string; lng: string }>) => {
      const data: NavigationData = {
        mode: 'start',
        routeName,
        waypoints,
        timestamp: Date.now(),
      };

      setNavigationData(data);

      // Navigate to route planner
      navigate('/plan', { state: data });
    },
    [navigate]
  );

  /**
   * Resume existing trip navigation from My Trips or Dashboard
   * Loads trip by ID and navigates to Route Planner
   */
  const resumeNavigation = useCallback(
    (tripId: string) => {
      const data: NavigationData = {
        mode: 'resume',
        tripId,
        timestamp: Date.now(),
      };

      setNavigationData(data);

      // Navigate to route planner with trip ID
      navigate('/plan', { state: data });
    },
    [navigate]
  );

  /**
   * Clear navigation state
   * Called when user exits navigation or completes trip
   */
  const clearNavigation = useCallback(() => {
    setNavigationData(null);
    sessionStorage.removeItem(NAVIGATION_STATE_KEY);
  }, []);

  /**
   * Get pending navigation data for Route Planner
   * Returns data and clears it from storage (one-time read)
   */
  const getPendingNavigation = useCallback((): NavigationData | null => {
    const stored = sessionStorage.getItem(NAVIGATION_STATE_KEY);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored);
      // Don't clear yet - Route Planner will clear when ready
      return data;
    } catch (error) {
      console.error('[useNavigationState] Failed to get pending navigation:', error);
      return null;
    }
  }, []);

  /**
   * Check if there's an active navigation session
   */
  const hasActiveNavigation = useCallback((): boolean => {
    return navigationData !== null;
  }, [navigationData]);

  return {
    navigationData,
    startNavigation,
    resumeNavigation,
    clearNavigation,
    getPendingNavigation,
    hasActiveNavigation,
  };
}
