'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useShop } from './ShopContext';

export interface ShopifyLocation {
  id: string;
  name: string;
  address1?: string;
  city?: string;
  country?: string;
  active: boolean;
}

interface LocationContextType {
  currentLocation: ShopifyLocation | null;
  locations: ShopifyLocation[];
  loading: boolean;
  setCurrentLocation: (location: ShopifyLocation) => void;
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  currentLocation: null,
  locations: [],
  loading: true,
  setCurrentLocation: () => {},
  refreshLocations: async () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { currentShop } = useShop();
  const [currentLocation, setCurrentLocationState] = useState<ShopifyLocation | null>(null);
  const [locations, setLocations] = useState<ShopifyLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLocations = useCallback(async () => {
    if (!currentShop) {
      setLocations([]);
      setCurrentLocationState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/locations?shopId=${currentShop.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      const activeLocations = data.locations.filter((loc: ShopifyLocation) => loc.active);
      
      setLocations(activeLocations);

      // Définir l'emplacement par défaut
      if (activeLocations.length > 0) {
        // Essayer de récupérer l'emplacement sauvegardé dans localStorage
        const savedLocationId = localStorage.getItem(`ivy_location_${currentShop.id}`);
        const savedLocation = activeLocations.find((loc: ShopifyLocation) => loc.id === savedLocationId);
        
        if (savedLocation) {
          setCurrentLocationState(savedLocation);
        } else {
          // Sinon prendre le premier emplacement
          setCurrentLocationState(activeLocations[0]);
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop]);

  useEffect(() => {
    refreshLocations();
  }, [refreshLocations]);

  const setCurrentLocation = useCallback((location: ShopifyLocation) => {
    setCurrentLocationState(location);
    
    // Sauvegarder dans localStorage
    if (currentShop) {
      localStorage.setItem(`ivy_location_${currentShop.id}`, location.id);
    }
  }, [currentShop]);

  return (
    <LocationContext.Provider value={{ 
      currentLocation, 
      locations, 
      loading, 
      setCurrentLocation, 
      refreshLocations,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
