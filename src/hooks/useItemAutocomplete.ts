import { useState, useCallback } from 'react';

export interface ItemSuggestion {
  id: string;
  name: string;
  cubicFeet: number;
  handlingCharge: number | null;
}

export function useItemAutocomplete() {
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/items/autocomplete?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const items = await response.json();
        setSuggestions(items);
        console.log('🔍 Item suggestions found:', items.length);
      } else {
        console.error('Failed to fetch item suggestions:', response.status);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching item suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, loading, getSuggestions, clearSuggestions };
}
