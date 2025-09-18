// Simple address autocomplete that works without Google Maps API
import { useState, useCallback } from 'react';

export interface SimpleAddressSuggestion {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

// Mock address suggestions for common patterns
const MOCK_SUGGESTIONS: SimpleAddressSuggestion[] = [
  {
    formatted_address: "123 Main St, New York, NY 10001, USA",
    place_id: "mock_1",
    geometry: { location: { lat: 40.7128, lng: -74.0060 } },
    address_components: [
      { long_name: "123", short_name: "123", types: ["street_number"] },
      { long_name: "Main Street", short_name: "Main St", types: ["route"] },
      { long_name: "New York", short_name: "NYC", types: ["locality", "political"] },
      { long_name: "New York", short_name: "NY", types: ["administrative_area_level_1", "political"] },
      { long_name: "United States", short_name: "US", types: ["country", "political"] },
      { long_name: "10001", short_name: "10001", types: ["postal_code"] }
    ]
  },
  {
    formatted_address: "456 Oak Ave, Los Angeles, CA 90210, USA",
    place_id: "mock_2",
    geometry: { location: { lat: 34.0522, lng: -118.2437 } },
    address_components: [
      { long_name: "456", short_name: "456", types: ["street_number"] },
      { long_name: "Oak Avenue", short_name: "Oak Ave", types: ["route"] },
      { long_name: "Los Angeles", short_name: "LA", types: ["locality", "political"] },
      { long_name: "California", short_name: "CA", types: ["administrative_area_level_1", "political"] },
      { long_name: "United States", short_name: "US", types: ["country", "political"] },
      { long_name: "90210", short_name: "90210", types: ["postal_code"] }
    ]
  },
  {
    formatted_address: "789 Pine St, Chicago, IL 60601, USA",
    place_id: "mock_3",
    geometry: { location: { lat: 41.8781, lng: -87.6298 } },
    address_components: [
      { long_name: "789", short_name: "789", types: ["street_number"] },
      { long_name: "Pine Street", short_name: "Pine St", types: ["route"] },
      { long_name: "Chicago", short_name: "Chicago", types: ["locality", "political"] },
      { long_name: "Illinois", short_name: "IL", types: ["administrative_area_level_1", "political"] },
      { long_name: "United States", short_name: "US", types: ["country", "political"] },
      { long_name: "60601", short_name: "60601", types: ["postal_code"] }
    ]
  }
];

// Generate mock suggestions based on input
function generateMockSuggestions(input: string): SimpleAddressSuggestion[] {
  if (!input || input.length < 3) return [];

  const lowerInput = input.toLowerCase();
  
  return MOCK_SUGGESTIONS
    .filter(suggestion => 
      suggestion.formatted_address.toLowerCase().includes(lowerInput)
    )
    .slice(0, 5); // Limit to 5 suggestions
}

// React hook for simple address autocomplete
export function useSimpleAddressAutocomplete() {
  const [suggestions, setSuggestions] = useState<SimpleAddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = useCallback(
    async (input: string) => {
      if (!input.trim() || input.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        const mockSuggestions = generateMockSuggestions(input);
        setSuggestions(mockSuggestions);
        setLoading(false);
      }, 300);
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
