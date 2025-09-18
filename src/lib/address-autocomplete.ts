// Address autocomplete service using browser geolocation and geocoding

// Google Maps type declarations
declare global {
  interface Window {
    google?: {
      maps: {
        Geocoder: new () => any;
        GeocoderStatus: {
          OK: string;
        };
        GeocoderRequest: {
          address?: string;
          location?: { lat: number; lng: number };
          radius?: number;
        };
        GeocoderResult: {
          formatted_address: string;
          place_id: string;
          geometry: {
            location: {
              lat(): number;
              lng(): number;
            };
          };
          address_components: Array<{
            long_name: string;
            short_name: string;
            types: string[];
          }>;
        };
        places: {
          AutocompleteService: new () => any;
          PlacesService: new (element: HTMLElement) => any;
          PlacesServiceStatus: {
            OK: string;
          };
          AutocompleteRequest: {
            input: string;
            types?: string[];
            location?: { lat: number; lng: number };
            radius?: number;
          };
          PlaceDetailsRequest: {
            placeId: string;
            fields: string[];
          };
          AutocompletePrediction: {
            description: string;
            place_id: string;
          };
          PlaceResult: {
            formatted_address?: string;
            geometry?: {
              location: {
                lat: number;
                lng: number;
              };
            };
            address_components?: Array<{
              long_name: string;
              short_name: string;
              types: string[];
            }>;
          };
        };
      };
    };
  }
}

export interface AddressSuggestion {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface AddressAutocompleteOptions {
  input: string;
  location?: { lat: number; lng: number };
  radius?: number;
  types?: string[];
}

class AddressAutocompleteService {
  private geocoder: any = null;
  private placesService: any = null;
  private userLocation: { lat: number; lng: number } | null = null;

  constructor() {
    this.initializeGoogleMaps();
  }

  private async initializeGoogleMaps() {
    if (typeof window !== 'undefined' && window.google?.maps) {
      this.geocoder = new (window as any).google.maps.Geocoder();
      this.placesService = new (window as any).google.maps.places.PlacesService(
        document.createElement('div')
      );
    }
  }

  private async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    if (this.userLocation) {
      return this.userLocation;
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(this.userLocation);
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  async getAddressSuggestions(
    input: string,
    options: Partial<AddressAutocompleteOptions> = {}
  ): Promise<AddressSuggestion[]> {
    if (!input.trim() || input.length < 3) {
      return [];
    }

    try {
      // Get user location for better suggestions
      const userLocation = await this.getUserLocation();

        // Use Google Places Autocomplete API
        const request: any = {
          input: input.trim(),
          types: options.types || ['address'],
          location: userLocation || options.location,
          radius: options.radius || 50000, // 50km radius
        };

      return new Promise((resolve) => {
        if (!this.placesService) {
          // Fallback to geocoding if Places API is not available
          this.getGeocodingSuggestions(input, userLocation).then(resolve);
          return;
        }

        const autocompleteService = new (window as any).google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(request, (predictions: any, status: any) => {
          if (status === 'OK' && predictions) {
            const suggestions = predictions.map((prediction: any) => ({
              formatted_address: prediction.description,
              place_id: prediction.place_id,
              geometry: {
                location: { lat: 0, lng: 0 }, // Will be filled by getPlaceDetails
              },
              address_components: [],
            }));

            // Get detailed information for each suggestion
            this.getPlaceDetails(suggestions).then(resolve);
          } else {
            // Fallback to geocoding
            this.getGeocodingSuggestions(input, userLocation).then(resolve);
          }
        });
      });
    } catch (error) {
      console.error('Address autocomplete error:', error);
      return [];
    }
  }

  private async getPlaceDetails(
    suggestions: AddressSuggestion[]
  ): Promise<AddressSuggestion[]> {
    if (!this.placesService) {
      return suggestions;
    }

    const detailedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        return new Promise<AddressSuggestion>((resolve) => {
        const request: any = {
          placeId: suggestion.place_id,
          fields: ['formatted_address', 'geometry', 'address_components'],
        };

          this.placesService!.getDetails(request, (place: any, status: any) => {
            if (status === 'OK' && place) {
              resolve({
                ...suggestion,
                formatted_address: place.formatted_address || suggestion.formatted_address,
                geometry: place.geometry || suggestion.geometry,
                address_components: place.address_components || [],
              });
            } else {
              resolve(suggestion);
            }
          });
        });
      })
    );

    return detailedSuggestions;
  }

  private async getGeocodingSuggestions(
    input: string,
    userLocation: { lat: number; lng: number } | null
  ): Promise<AddressSuggestion[]> {
    if (!this.geocoder) {
      return [];
    }

    return new Promise((resolve) => {
      const request: any = {
        address: input,
        location: userLocation,
        radius: 50000,
      };

      this.geocoder.geocode(request, (results: any, status: any) => {
        if (status === 'OK' && results) {
          const suggestions = results.slice(0, 5).map((result: any) => ({
            formatted_address: result.formatted_address,
            place_id: result.place_id,
            geometry: {
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              },
            },
            address_components: result.address_components || [],
          }));
          resolve(suggestions);
        } else {
          resolve([]);
        }
      });
    });
  }

  // Extract address components for form filling
  extractAddressComponents(suggestion: AddressSuggestion) {
    const components = suggestion.address_components;
    const address: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    } = {};

    components.forEach((component) => {
      const types = component.types;
      if (types.includes('street_number') || types.includes('route')) {
        address.street = (address.street || '') + component.long_name + ' ';
      } else if (types.includes('locality')) {
        address.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        address.state = component.short_name;
      } else if (types.includes('postal_code')) {
        address.zipCode = component.long_name;
      } else if (types.includes('country')) {
        address.country = component.long_name;
      }
    });

    if (address.street) {
      address.street = address.street.trim();
    }

    return address;
  }
}

// Export singleton instance
export const addressAutocompleteService = new AddressAutocompleteService();

// React hook for address autocomplete
export function useAddressAutocomplete() {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = useCallback(
    async (input: string, options?: Partial<AddressAutocompleteOptions>) => {
      if (!input.trim() || input.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await addressAutocompleteService.getAddressSuggestions(
          input,
          options
        );
        setSuggestions(results);
      } catch (error) {
        console.error('Address autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    loading,
    getSuggestions,
    clearSuggestions,
  };
}

// Import React hooks
import { useState, useCallback } from 'react';
