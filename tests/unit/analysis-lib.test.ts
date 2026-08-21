// jest.setup.js globally mocks '@/lib/analysis' so that route/action suites get
// a canned analyzeImages. This suite tests the real implementation, so opt out.
// jest hoists unmock above the imports, same as jest.mock.
jest.unmock('@/lib/analysis');

import { analyzeImages, AnalysisRequest } from '@/lib/analysis';
import { AnalysisSchema } from '@/types';

// The factory is hoisted above these statements, so it must not close over a
// `const` declared here (temporal dead zone). Build the mock inside the factory
// and pull the reference back out with requireMock.
jest.mock('@/lib/openai', () => ({
  openai: { chat: { completions: { create: jest.fn() } } },
  VISION_MODEL: 'gpt-4o-mini'
}));

const mockOpenAI = (jest.requireMock('@/lib/openai') as {
  openai: { chat: { completions: { create: jest.Mock } } };
}).openai;

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
  // Rebuild rather than just clear: tests must not inherit mutations made to
  // the shared mock object by an earlier test.
  mockOpenAI.chat = { completions: { create: jest.fn() } };
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
                text: expect.stringContaining('create a detailed inventory of ALL movable items')
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

      expect(result).toMatchObject({
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

      expect(result).toMatchObject({
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

  describe('Model selection', () => {
    it('forwards VISION_MODEL from @/lib/openai to the API call', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue(mockValidResponse);

      await analyzeImages({ imageUrls: ['https://example.com/image.jpg'] });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o-mini' })
      );
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
