import { useState, useCallback } from 'react';

interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
  boundingbox: string[];
  class: string;
  type: string;
}

interface GeocodeCache {
  [address: string]: {
    result: GeocodeResult | null;
    timestamp: number;
  };
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
const CACHE_KEY = 'visita360_geocode_cache';

export function useGeocode() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar cache do localStorage
  const getCache = useCallback((): GeocodeCache => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }, []);

  // Salvar no cache
  const setCache = useCallback((cache: GeocodeCache) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Não foi possível salvar no cache de geocodificação:', error);
    }
  }, []);

  // Limpar cache expirado
  const cleanExpiredCache = useCallback(() => {
    const cache = getCache();
    const now = Date.now();
    const cleanedCache: GeocodeCache = {};
    
    Object.entries(cache).forEach(([key, value]) => {
      if (now - value.timestamp < CACHE_DURATION) {
        cleanedCache[key] = value;
      }
    });
    
    setCache(cleanedCache);
    return cleanedCache;
  }, [getCache, setCache]);

  // Normalizar endereço para busca
  const normalizeAddress = useCallback((address: string): string => {
    return address
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[,\.]/g, ' ')
      .replace(/\s+/g, ' ');
  }, []);

  // Geocodificar endereço
  const geocode = useCallback(async (address: string): Promise<GeocodeResult | null> => {
    if (!address.trim()) {
      setError('Endereço não pode estar vazio');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedAddress = normalizeAddress(address);
      const cache = cleanExpiredCache();
      
      // Verificar cache primeiro
      if (cache[normalizedAddress]) {
        setIsLoading(false);
        return cache[normalizedAddress].result;
      }

      // Buscar via API Nominatim (OpenStreetMap)
      const encodedAddress = encodeURIComponent(`${address}, Brasil`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodedAddress}`,
        {
          headers: {
            'User-Agent': 'Visita360 App (contact@example.com)' // Requerido pela API
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na geocodificação: ${response.status}`);
      }

      const data = await response.json();
      
      let result: GeocodeResult | null = null;
      
      if (data && data.length > 0) {
        const location = data[0];
        result = {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          display_name: location.display_name,
          boundingbox: location.boundingbox,
          class: location.class,
          type: location.type
        };
      }

      // Salvar no cache
      const updatedCache = {
        ...cache,
        [normalizedAddress]: {
          result,
          timestamp: Date.now()
        }
      };
      setCache(updatedCache);

      setIsLoading(false);
      
      if (!result) {
        setError('Não foi possível encontrar as coordenadas para este endereço');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na geocodificação';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [normalizeAddress, cleanExpiredCache, setCache]);

  // Reverse geocoding (coordenadas para endereço)
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'Visita360 App (contact@example.com)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro no reverse geocoding: ${response.status}`);
      }

      const data = await response.json();
      setIsLoading(false);
      
      return data.display_name || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no reverse geocoding';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  // Validar coordenadas
  const validateCoordinates = useCallback((lat: string | number, lng: string | number): boolean => {
    const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
    const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    return !isNaN(latitude) && 
           !isNaN(longitude) && 
           latitude >= -90 && 
           latitude <= 90 && 
           longitude >= -180 && 
           longitude <= 180;
  }, []);

  // Limpar cache manualmente
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
  }, []);

  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    const cache = getCache();
    const total = Object.keys(cache).length;
    const expired = Object.values(cache).filter(
      entry => Date.now() - entry.timestamp >= CACHE_DURATION
    ).length;
    
    return {
      total,
      active: total - expired,
      expired
    };
  }, [getCache]);

  return {
    geocode,
    reverseGeocode,
    validateCoordinates,
    clearCache,
    getCacheStats,
    isLoading,
    error
  };
}