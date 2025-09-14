import { jest } from '@jest/globals';
import { z } from 'zod';

describe('types.ts - 100% Coverage Tests', () => {
  let ItemSchema: z.ZodSchema<any>;
  let AnalysisSchema: z.ZodSchema<any>;
  let Item: any;
  let Analysis: any;

  beforeEach(async () => {
    // Clear module cache to ensure fresh imports
    delete require.cache[require.resolve('@/types')];
    
    const typesModule = await import('@/types');
    ItemSchema = typesModule.ItemSchema;
    AnalysisSchema = typesModule.AnalysisSchema;
    Item = typesModule.Item;
    Analysis = typesModule.Analysis;
  });

  describe('ItemSchema validation', () => {
    it('should validate valid item data', () => {
      const validItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        },
        notes: 'Test notes',
        tags: ['furniture', 'wood'],
        roomName: 'Living Room'
      };

      const result = ItemSchema.parse(validItem);
      expect(result).toEqual(validItem);
    });

    it('should validate item with null dimensions', () => {
      const itemWithNullDimensions = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: null,
          width: null,
          height: null
        },
        notes: 'Test notes',
        tags: ['furniture'],
        roomName: 'Kitchen'
      };

      const result = ItemSchema.parse(itemWithNullDimensions);
      expect(result).toEqual(itemWithNullDimensions);
    });

    it('should validate item with mixed null and number dimensions', () => {
      const itemWithMixedDimensions = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: null,
          height: 5
        },
        notes: 'Test notes',
        tags: ['electronics'],
        roomName: 'Office'
      };

      const result = ItemSchema.parse(itemWithMixedDimensions);
      expect(result).toEqual(itemWithMixedDimensions);
    });

    it('should provide default values for optional fields', () => {
      const minimalItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        }
      };

      const result = ItemSchema.parse(minimalItem);
      expect(result.notes).toBe('');
      expect(result.tags).toEqual([]);
      expect(result.roomName).toBeUndefined();
    });

    it('should handle empty string values', () => {
      const itemWithEmptyStrings = {
        shortName: '',
        description: '',
        estimatedDimensionsInches: {
          length: null,
          width: null,
          height: null
        },
        notes: '',
        tags: [],
        roomName: null
      };

      const result = ItemSchema.parse(itemWithEmptyStrings);
      expect(result).toEqual(itemWithEmptyStrings);
    });

    it('should handle null roomName', () => {
      const itemWithNullRoom = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        },
        roomName: null
      };

      const result = ItemSchema.parse(itemWithNullRoom);
      expect(result.roomName).toBe(null);
    });

    it('should handle undefined roomName', () => {
      const itemWithUndefinedRoom = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        }
      };

      const result = ItemSchema.parse(itemWithUndefinedRoom);
      expect(result.roomName).toBeUndefined();
    });

    it('should reject invalid shortName', () => {
      const invalidItem = {
        shortName: 123, // Should be string
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        }
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should reject invalid description', () => {
      const invalidItem = {
        shortName: 'Test Item',
        description: null, // Should be string
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        }
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should reject missing required fields', () => {
      const incompleteItem = {
        shortName: 'Test Item'
        // Missing description and estimatedDimensionsInches
      };

      expect(() => ItemSchema.parse(incompleteItem)).toThrow();
    });

    it('should reject invalid dimensions structure', () => {
      const invalidItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5
          // Missing height
        }
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should reject negative dimensions', () => {
      const invalidItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: -10, // Should be positive
          width: 5,
          height: 3
        }
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should accept zero dimensions', () => {
      const validItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 0, // Zero is allowed by schema
          width: 5,
          height: 3
        }
      };

      expect(() => ItemSchema.parse(validItem)).not.toThrow();
    });

    it('should reject non-finite dimensions', () => {
      const invalidItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: Infinity, // Should be finite
          width: 5,
          height: 3
        }
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should reject NaN dimensions', () => {
      const invalidItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: NaN, // Should be finite
          width: 5,
          height: 3
        }
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should reject non-string tags', () => {
      const invalidItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        },
        tags: [123, 'valid', null] // Should be array of strings
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should reject non-string notes', () => {
      const invalidItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        },
        notes: 123 // Should be string
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should reject non-string roomName', () => {
      const invalidItem = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        },
        roomName: 123 // Should be string or null
      };

      expect(() => ItemSchema.parse(invalidItem)).toThrow();
    });

    it('should handle extra fields in dimensions (strict mode)', () => {
      const itemWithExtraFields = {
        shortName: 'Test Item',
        description: 'A test item description',
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3,
          depth: 2, // Extra field should be rejected in strict mode
          weight: 50
        }
      };

      expect(() => ItemSchema.parse(itemWithExtraFields)).toThrow();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const itemWithLongStrings = {
        shortName: longString,
        description: longString,
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        },
        notes: longString,
        tags: [longString],
        roomName: longString
      };

      const result = ItemSchema.parse(itemWithLongStrings);
      expect(result.shortName).toBe(longString);
      expect(result.description).toBe(longString);
      expect(result.notes).toBe(longString);
      expect(result.tags).toEqual([longString]);
      expect(result.roomName).toBe(longString);
    });

    it('should handle special characters in strings', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const itemWithSpecialChars = {
        shortName: `Item ${specialChars}`,
        description: `Description ${specialChars}`,
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        },
        notes: `Notes ${specialChars}`,
        tags: [`tag_${specialChars}`],
        roomName: `Room ${specialChars}`
      };

      const result = ItemSchema.parse(itemWithSpecialChars);
      expect(result.shortName).toBe(`Item ${specialChars}`);
      expect(result.description).toBe(`Description ${specialChars}`);
    });

    it('should handle unicode characters', () => {
      const unicodeChars = '🚪🪑🛏️📱💻';
      const itemWithUnicode = {
        shortName: `Item ${unicodeChars}`,
        description: `Description ${unicodeChars}`,
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        },
        notes: `Notes ${unicodeChars}`,
        tags: [`tag_${unicodeChars}`],
        roomName: `Room ${unicodeChars}`
      };

      const result = ItemSchema.parse(itemWithUnicode);
      expect(result.shortName).toBe(`Item ${unicodeChars}`);
      expect(result.description).toBe(`Description ${unicodeChars}`);
    });
  });

  describe('AnalysisSchema validation', () => {
    it('should validate valid analysis data', () => {
      const validAnalysis = {
        items: [
          {
            shortName: 'Test Item 1',
            description: 'First test item',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            },
            notes: '',
            tags: []
          },
          {
            shortName: 'Test Item 2',
            description: 'Second test item',
            estimatedDimensionsInches: {
              length: 15,
              width: 8,
              height: 4
            },
            notes: '',
            tags: []
          }
        ],
        confidenceNote: 'Analysis completed with high confidence'
      };

      const result = AnalysisSchema.parse(validAnalysis);
      expect(result).toEqual(validAnalysis);
    });

    it('should validate analysis with maximum items (50)', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        shortName: `Item ${i + 1}`,
        description: `Description for item ${i + 1}`,
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        }
      }));

      const validAnalysis = {
        items,
        confidenceNote: 'Analysis with maximum items'
      };

      const result = AnalysisSchema.parse(validAnalysis);
      expect(result.items).toHaveLength(50);
      expect(result.confidenceNote).toBe('Analysis with maximum items');
    });

    it('should reject analysis with too many items (>50)', () => {
      const items = Array.from({ length: 51 }, (_, i) => ({
        shortName: `Item ${i + 1}`,
        description: `Description for item ${i + 1}`,
        estimatedDimensionsInches: {
          length: 10,
          width: 5,
          height: 3
        }
      }));

      const invalidAnalysis = {
        items,
        confidenceNote: 'Analysis with too many items'
      };

      expect(() => AnalysisSchema.parse(invalidAnalysis)).toThrow();
    });

    it('should validate analysis with empty items array', () => {
      const emptyAnalysis = {
        items: [],
        confidenceNote: 'No items found'
      };

      const result = AnalysisSchema.parse(emptyAnalysis);
      expect(result.items).toEqual([]);
      expect(result.confidenceNote).toBe('No items found');
    });

    it('should reject analysis with missing items', () => {
      const invalidAnalysis = {
        confidenceNote: 'Missing items array'
      };

      expect(() => AnalysisSchema.parse(invalidAnalysis)).toThrow();
    });

    it('should reject analysis with missing confidenceNote', () => {
      const invalidAnalysis = {
        items: [
          {
            shortName: 'Test Item',
            description: 'Test description',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          }
        ]
      };

      expect(() => AnalysisSchema.parse(invalidAnalysis)).toThrow();
    });

    it('should reject analysis with non-string confidenceNote', () => {
      const invalidAnalysis = {
        items: [
          {
            shortName: 'Test Item',
            description: 'Test description',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          }
        ],
        confidenceNote: 123 // Should be string
      };

      expect(() => AnalysisSchema.parse(invalidAnalysis)).toThrow();
    });

    it('should reject analysis with non-array items', () => {
      const invalidAnalysis = {
        items: 'not an array', // Should be array
        confidenceNote: 'Invalid items'
      };

      expect(() => AnalysisSchema.parse(invalidAnalysis)).toThrow();
    });

    it('should reject analysis with invalid items', () => {
      const invalidAnalysis = {
        items: [
          {
            shortName: 'Valid Item',
            description: 'Valid description',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          },
          {
            shortName: 123, // Invalid item
            description: 'Invalid item',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          }
        ],
        confidenceNote: 'Mixed valid and invalid items'
      };

      expect(() => AnalysisSchema.parse(invalidAnalysis)).toThrow();
    });

    it('should handle empty confidenceNote', () => {
      const analysisWithEmptyNote = {
        items: [
          {
            shortName: 'Test Item',
            description: 'Test description',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          }
        ],
        confidenceNote: ''
      };

      const result = AnalysisSchema.parse(analysisWithEmptyNote);
      expect(result.confidenceNote).toBe('');
    });

    it('should handle very long confidenceNote', () => {
      const longNote = 'a'.repeat(10000);
      const analysisWithLongNote = {
        items: [
          {
            shortName: 'Test Item',
            description: 'Test description',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          }
        ],
        confidenceNote: longNote
      };

      const result = AnalysisSchema.parse(analysisWithLongNote);
      expect(result.confidenceNote).toBe(longNote);
    });
  });

  describe('Type exports', () => {
    it('should export ItemSchema', () => {
      expect(ItemSchema).toBeDefined();
      expect(ItemSchema).toBeInstanceOf(z.ZodObject);
    });

    it('should export AnalysisSchema', () => {
      expect(AnalysisSchema).toBeDefined();
      expect(AnalysisSchema).toBeInstanceOf(z.ZodObject);
    });
  });

  describe('Schema composition and inheritance', () => {
    it('should ensure AnalysisSchema uses ItemSchema for items', () => {
      // Test that AnalysisSchema properly validates items using ItemSchema
      const analysisWithInvalidItem = {
        items: [
          {
            shortName: 'Valid Item',
            description: 'Valid description',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          },
          {
            shortName: 123, // Invalid - should be string
            description: 'Invalid description',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          }
        ],
        confidenceNote: 'Test analysis'
      };

      expect(() => AnalysisSchema.parse(analysisWithInvalidItem)).toThrow();
    });

    it('should handle nested validation correctly', () => {
      const complexAnalysis = {
        items: [
          {
            shortName: 'Complex Item',
            description: 'Item with all optional fields',
            estimatedDimensionsInches: {
              length: 12.5,
              width: 7.25,
              height: 3.75
            },
            notes: 'Detailed notes about this item',
            tags: ['furniture', 'wood', 'antique'],
            roomName: 'Living Room'
          },
          {
            shortName: 'Simple Item',
            description: 'Item with minimal fields',
            estimatedDimensionsInches: {
              length: 8,
              width: 4,
              height: 2
            }
          }
        ],
        confidenceNote: 'Complex analysis with mixed item types'
      };

      const result = AnalysisSchema.parse(complexAnalysis);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].tags).toEqual(['furniture', 'wood', 'antique']);
      expect(result.items[1].notes).toBe('');
      expect(result.items[1].tags).toEqual([]);
    });
  });

  describe('Edge cases and error messages', () => {
    it('should provide meaningful error messages for invalid data', () => {
      const invalidItem = {
        shortName: 123,
        description: null,
        estimatedDimensionsInches: {
          length: -5,
          width: 'invalid',
          height: Infinity
        }
      };

      try {
        ItemSchema.parse(invalidItem);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(z.ZodError);
        expect(error.errors).toBeDefined();
        expect(error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle deeply nested validation errors', () => {
      const invalidAnalysis = {
        items: [
          {
            shortName: 'Valid Item',
            description: 'Valid description',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            }
          },
          {
            shortName: 'Invalid Item',
            description: 'Invalid description',
            estimatedDimensionsInches: {
              length: -10, // Invalid
              width: 5,
              height: 3
            }
          }
        ],
        confidenceNote: 'Analysis with nested validation errors'
      };

      try {
        AnalysisSchema.parse(invalidAnalysis);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(z.ZodError);
        expect(error.errors).toBeDefined();
      }
    });
  });
});
