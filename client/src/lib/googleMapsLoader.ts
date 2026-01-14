import { Loader } from "@googlemaps/js-api-loader";

const googleMapsLibraries = ["places", "visualization", "geometry", "marker"] as const;

let loaderInstance: Loader | null = null;

export const getGoogleMapsLoader = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey,
      version: "weekly",
      libraries: [...googleMapsLibraries],
    });
  }

  return loaderInstance;
};
