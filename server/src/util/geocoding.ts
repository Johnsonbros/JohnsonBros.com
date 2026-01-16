import { Logger } from '../logger';

interface GeocodeResult {
  zipCode: string | null;
  city: string | null;
  state: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address The address to geocode
 * @returns Geocode result with ZIP code, city, state, and coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    Logger.warn('[Geocoding] GOOGLE_MAPS_API_KEY not configured, geocoding unavailable');
    return {
      zipCode: null,
      city: null,
      state: null,
      formattedAddress: null,
      latitude: null,
      longitude: null,
    };
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      Logger.warn('[Geocoding] Failed to geocode address', {
        address,
        status: data.status,
        error: data.error_message
      });
      return {
        zipCode: null,
        city: null,
        state: null,
        formattedAddress: null,
        latitude: null,
        longitude: null,
      };
    }

    const result = data.results[0];
    const addressComponents = result.address_components;
    const geometry = result.geometry;

    // Extract components
    let zipCode: string | null = null;
    let city: string | null = null;
    let state: string | null = null;

    for (const component of addressComponents) {
      if (component.types.includes('postal_code')) {
        zipCode = component.short_name;
      }
      if (component.types.includes('locality')) {
        city = component.short_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
    }

    return {
      zipCode,
      city,
      state,
      formattedAddress: result.formatted_address,
      latitude: geometry?.location?.lat || null,
      longitude: geometry?.location?.lng || null,
    };
  } catch (error) {
    Logger.error('[Geocoding] Error geocoding address', { error });
    return {
      zipCode: null,
      city: null,
      state: null,
      formattedAddress: null,
      latitude: null,
      longitude: null,
    };
  }
}

/**
 * Check if a ZIP code is in the service area
 * @param zipCode The ZIP code to check
 * @param config The capacity configuration
 * @returns Whether the ZIP code is in the service area
 */
export function isZipInServiceArea(
  zipCode: string | null,
  geos: string[],
  expressZones?: {
    tier1?: string[];
    tier2?: string[];
    tier3?: string[];
  }
): boolean {
  if (!zipCode) {
    return false;
  }

  // Check against legacy geos list
  if (geos.includes(zipCode)) {
    return true;
  }

  // Check against express zones if available
  if (expressZones) {
    const allZones = [
      ...(expressZones.tier1 || []),
      ...(expressZones.tier2 || []),
      ...(expressZones.tier3 || []),
    ];

    if (allZones.includes(zipCode)) {
      return true;
    }
  }

  return false;
}
