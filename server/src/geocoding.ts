import { logError } from './logger';
import { loadConfig } from './config.js';

interface GeocodeResult {
  zipCode: string | null;
  city: string | null;
  state: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Geocodes an address using Google Maps Geocoding API
 * @param address - The address to geocode
 * @returns Geocoded address information including ZIP code
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    logError('GOOGLE_MAPS_API_KEY not configured', new Error('Missing API Key'));
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
      logError('Geocoding API error:', { status: data.status, error: data.error_message });
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
    const addressComponents = result.address_components || [];

    // Extract ZIP code, city, and state from address components
    let zipCode: string | null = null;
    let city: string | null = null;
    let state: string | null = null;

    for (const component of addressComponents) {
      if (component.types.includes('postal_code')) {
        zipCode = component.long_name;
      } else if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
    }

    const location = result.geometry?.location;

    return {
      zipCode,
      city,
      state,
      formattedAddress: result.formatted_address || null,
      latitude: location?.lat || null,
      longitude: location?.lng || null,
    };
  } catch (error) {
    logError('Error geocoding address:', error);
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
 * Checks if an address is within the service area
 * @param address - The address to check
 * @returns Object with inServiceArea status and additional info
 */
export async function checkServiceArea(address: string): Promise<{
  inServiceArea: boolean;
  message: string;
  zipCode: string | null;
  tier?: string;
}> {
  const geocodeResult = await geocodeAddress(address);

  if (!geocodeResult.zipCode) {
    return {
      inServiceArea: false,
      message: "We couldn't verify your address. Please ensure you've entered a valid address.",
      zipCode: null,
    };
  }

  // Get service area ZIP codes from capacity config
  const config = loadConfig();
  const allZipCodes = config.geos || [];
  const tier1Zips = config.express_zones?.tier1 || [];
  const tier2Zips = config.express_zones?.tier2 || [];
  const tier3Zips = config.express_zones?.tier3 || [];

  const zipCode = geocodeResult.zipCode;

  // Check if ZIP code is in service area
  if (allZipCodes.includes(zipCode)) {
    let tier: string | undefined;

    if (tier1Zips.includes(zipCode)) {
      tier = 'tier1';
    } else if (tier2Zips.includes(zipCode)) {
      tier = 'tier2';
    } else if (tier3Zips.includes(zipCode)) {
      tier = 'tier3';
    }

    return {
      inServiceArea: true,
      message: "Great! We provide service to your area.",
      zipCode,
      tier,
    };
  }

  return {
    inServiceArea: false,
    message: "Sorry, we don't currently service this area. Please call us at (617) 479-9911 to discuss options.",
    zipCode,
  };
}
