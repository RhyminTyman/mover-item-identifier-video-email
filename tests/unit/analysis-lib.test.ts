import { analyzeImages, AnalysisRequest } from '@/lib/analysis';
import { AnalysisSchema } from '@/types';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

jest.mock('@/lib/openai', () => ({
  openai: mockOpenAI,
  VISION_MODEL: 'gpt-4o-mini'
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.OPENAI_API_KEY = 'test-api-key';
  process.env.OPENAI_VISION_MODEL = 'gpt-4o-mini';
});

describe('analyzeImages', () => {
  const mockValidResponse = {
    choices: [{
      message: {
        content: JSON.stringify({
          items: [
            {
              shortName: 'Test Item',
              description: 'A test item for analysis',
              estimatedDimensionsInches: {
                length: 10,
                width: 5,
                height: 3
              },
              notes: 'Test notes',
              tags: ['test', 'furniture'],
              roomName: 'Living Room'
            }
          ],
          confidenceNote: 'High confidence in the analysis'
        })
      }
    }]
  };

  describe('Input validation', () => {
    it('should throw error when both imageUrls and base64Images are empty', async () => {
      const request: AnalysisRequest = {
        imageUrls: [],
        base64Images: []
      };

      await expect(analyzeImages(request)).rejects.toThrow('Provide either imageUrls or base64Images');
    });

    it('should throw error when no images are provided', async () => {
      const request: AnalysisRequest = {};

      await expect(analyzeImages(request)).rejects.toThrow('Provide either imageUrls or base64Images');
    });

    it('should throw error when OpenAI API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;
      
      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow('OpenAI API key is not set');
    });

    it('should throw error when OpenAI client is not initialized', async () => {
      // @ts-ignore
      mockOpenAI.chat = null;
      
      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow('OpenAI client is not initialized');
    });
  });

  describe('Image URL processing', () => {
    it('should process image URLs correctly', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      };

      const result = await analyzeImages(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: expect.stringContaining('Please analyze these room photos')
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'https://example.com/image1.jpg',
                  detail: 'high'
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'https://example.com/image2.jpg',
                  detail: 'high'
                }
              }
            ]
          }
        ],
        response_format: {
          type: 'json_object'
        },
        max_tokens: 4000
      });

      expect(result).toEqual({
        items: [
          {
            shortName: 'Test Item',
            description: 'A test item for analysis',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            },
            notes: 'Test notes',
            tags: ['test', 'furniture'],
            roomName: 'Living Room'
          }
        ],
        confidenceNote: 'High confidence in the analysis'
      });
    });
  });

  describe('Base64 image processing', () => {
    it('should process base64 images correctly', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      const request: AnalysisRequest = {
        base64Images: [
          {
            name: 'room1.jpg',
            dataUrl: 'data:image/jpeg;base64,test1',
            roomName: 'Living Room'
          },
          {
            name: 'room2.jpg',
            dataUrl: 'data:image/jpeg;base64,test2',
            roomName: 'Kitchen'
          }
        ]
      };

      const result = await analyzeImages(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: expect.stringContaining('Room Information: Image "room1.jpg" is from the Living Room. Image "room2.jpg" is from the Kitchen')
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'data:image/jpeg;base64,test1',
                  detail: 'high'
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'data:image/jpeg;base64,test2',
                  detail: 'high'
                }
              }
            ]
          }
        ],
        response_format: {
          type: 'json_object'
        },
        max_tokens: 4000
      });

      expect(result).toEqual({
        items: [
          {
            shortName: 'Test Item',
            description: 'A test item for analysis',
            estimatedDimensionsInches: {
              length: 10,
              width: 5,
              height: 3
            },
            notes: 'Test notes',
            tags: ['test', 'furniture'],
            roomName: 'Living Room'
          }
        ],
        confidenceNote: 'High confidence in the analysis'
      });
    });

    it('should handle base64 images without room names', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      const request: AnalysisRequest = {
        base64Images: [
          {
            name: 'room1.jpg',
            dataUrl: 'data:image/jpeg;base64,test1'
          }
        ]
      };

      await analyzeImages(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: expect.not.stringContaining('Room Information:')
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'data:image/jpeg;base64,test1',
                  detail: 'high'
                }
              }
            ]
          }
        ],
        response_format: {
          type: 'json_object'
        },
        max_tokens: 4000
      });
    });
  });

  describe('OpenAI API error handling', () => {
    it('should handle OpenAI API errors', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow('OpenAI API error: API rate limit exceeded');
    });

    it('should handle non-Error objects in API errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue('String error');

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow('OpenAI API error: Unknown error');
    });
  });

  describe('Response processing', () => {
    it('should handle empty response content', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: ''
          }
        }]
      });

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow('No response content from OpenAI');
    });

    it('should handle missing response choices', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: []
      });

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow('No response content from OpenAI');
    });

    it('should handle invalid JSON response', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      });

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow();
    });

    it('should handle response that fails schema validation', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              invalid: 'structure'
            })
          }
        }]
      });

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow('Model returned unexpected shape:');
    });
  });

  describe('Environment variables', () => {
    it('should use custom vision model from environment', async () => {
      process.env.OPENAI_VISION_MODEL = 'gpt-4o';
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await analyzeImages(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o'
        })
      );
    });

    it('should default to gpt-4o when no vision model is set', async () => {
      delete process.env.OPENAI_VISION_MODEL;
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await analyzeImages(request);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o'
        })
      );
    });
  });

  describe('Logging', () => {
    it('should log analysis start', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await analyzeImages(request);

      expect(console.log).toHaveBeenCalledWith('🔍 [ANALYSIS] Starting image analysis...');
      expect(console.log).toHaveBeenCalledWith('🔍 [ANALYSIS] OpenAI API key:', 'Set');
      expect(console.log).toHaveBeenCalledWith('🔍 [ANALYSIS] Vision model:', 'gpt-4o-mini');
    });

    it('should log when API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image.jpg']
      };

      await expect(analyzeImages(request)).rejects.toThrow();

      expect(console.log).toHaveBeenCalledWith('🔍 [ANALYSIS] OpenAI API key:', 'Not set');
    });
  });

  describe('Edge cases', () => {
    it('should handle mixed image types', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      const request: AnalysisRequest = {
        imageUrls: ['https://example.com/image1.jpg'],
        base64Images: [
          {
            name: 'room1.jpg',
            dataUrl: 'data:image/jpeg;base64,test1',
            roomName: 'Living Room'
          }
        ]
      };

      const result = await analyzeImages(request);

      expect(result).toBeDefined();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image_url',
                  image_url: {
                    url: 'https://example.com/image1.jpg',
                    detail: 'high'
                  }
                }),
                expect.objectContaining({
                  type: 'image_url',
                  image_url: {
                    url: 'data:image/jpeg;base64,test1',
                    detail: 'high'
                  }
                })
              ])
            })
          ]
        })
      );
    });

    it('should handle large number of images', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      const imageUrls = Array.from({ length: 10 }, (_, i) => `https://example.com/image${i}.jpg`);
      const request: AnalysisRequest = { imageUrls };

      const result = await analyzeImages(request);

      expect(result).toBeDefined();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.arrayContaining(
                imageUrls.map(url => ({
                  type: 'image_url',
                  image_url: {
                    url,
                    detail: 'high'
                  }
                }))
              )
            })
          ]
        })
      );
    });
  });
});
