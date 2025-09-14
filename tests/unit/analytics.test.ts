// Mock Prisma before importing
const mockPrismaClient = {
  analysisSession: {
    create: jest.fn(),
    update: jest.fn()
  },
  itemAnalytics: {
    createMany: jest.fn()
  },
  feedbackSession: {
    create: jest.fn()
  }
}

jest.mock('../../src/lib/db', () => ({
  prisma: mockPrismaClient
}))

// Import after mocking
const {
  createAnalysisSession,
  updateAnalysisSession,
  addItemAnalytics,
  createFeedbackSession
} = require('../../src/lib/analytics')

describe('Analytics Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createAnalysisSession', () => {
    it('should create analysis session successfully', async () => {
      const mockSession = {
        sessionId: 'test-session-id',
        userId: 'test-user-id',
        totalItemsFound: 5
      }

      mockPrismaClient.analysisSession.create.mockResolvedValue(mockSession)

      const result = await createAnalysisSession('test-session-id', {
        totalImages: 3,
        totalVideos: 0,
        totalFiles: 3,
        analysisDuration: 30,
        aiModel: 'gpt-4-vision',
        confidenceScore: 0.85,
        totalItemsFound: 5,
        itemsEdited: 0,
        significantEdits: 0,
        feedbackSent: false,
        errorOccurred: false
      }, 'test-user-id')

      expect(result).toEqual(mockSession)
      expect(mockPrismaClient.analysisSession.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'test-session-id',
          userId: 'test-user-id',
          totalImages: 3,
          totalVideos: 0,
          totalFiles: 3,
          analysisDuration: 30,
          aiModel: 'gpt-4-vision',
          confidenceScore: 0.85,
          totalItemsFound: 5,
          itemsEdited: 0,
          significantEdits: 0,
          feedbackSent: false,
          errorOccurred: false
        }
      })
    })

    it('should handle create analysis session errors', async () => {
      mockPrismaClient.analysisSession.create.mockRejectedValue(new Error('Database error'))

      await expect(createAnalysisSession('test-session-id', {
        totalImages: 3,
        totalVideos: 0,
        totalFiles: 3,
        totalItemsFound: 5
      }, 'test-user-id')).rejects.toThrow('Database error')
    })
  })

  describe('updateAnalysisSession', () => {
    it('should update analysis session successfully', async () => {
      const mockSession = {
        sessionId: 'test-session-id',
        totalItemsFound: 5,
        itemsEdited: 2
      }

      mockPrismaClient.analysisSession.update.mockResolvedValue(mockSession)

      const result = await updateAnalysisSession('test-session-id', {
        itemsEdited: 2,
        feedbackSent: true
      })

      expect(result).toEqual(mockSession)
      expect(mockPrismaClient.analysisSession.update).toHaveBeenCalledWith({
        where: { sessionId: 'test-session-id' },
        data: {
          itemsEdited: 2,
          feedbackSent: true
        }
      })
    })
  })

  describe('addItemAnalytics', () => {
    it('should add item analytics successfully', async () => {
      const mockResult = { count: 2 }

      mockPrismaClient.itemAnalytics.createMany.mockResolvedValue(mockResult)

      const result = await addItemAnalytics('test-session-id', [
        {
          shortName: 'Test Item 1',
          description: 'Test description 1',
          roomName: 'Living Room',
          tags: ['furniture'],
          aiLength: 100,
          aiWidth: 50,
          aiHeight: 75,
          aiConfidence: 0.85,
          wasEdited: false
        },
        {
          shortName: 'Test Item 2',
          description: 'Test description 2',
          roomName: 'Kitchen',
          tags: ['appliance'],
          aiLength: 60,
          aiWidth: 40,
          aiHeight: 85,
          aiConfidence: 0.92,
          wasEdited: true
        }
      ])

      expect(result).toEqual(mockResult)
      expect(mockPrismaClient.itemAnalytics.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            sessionId: 'test-session-id',
            shortName: 'Test Item 1',
            description: 'Test description 1'
          }),
          expect.objectContaining({
            sessionId: 'test-session-id',
            shortName: 'Test Item 2',
            description: 'Test description 2'
          })
        ])
      })
    })
  })

  describe('createFeedbackSession', () => {
    it('should create feedback session successfully', async () => {
      const mockSession = {
        sessionId: 'test-session-id',
        correctedItems: 2,
        totalDifferences: 5
      }

      mockPrismaClient.feedbackSession.create.mockResolvedValue(mockSession)

      const result = await createFeedbackSession('test-session-id', {
        correctedItems: 2,
        totalDifferences: 5,
        averageDifference: 15.5,
        maxDifference: 25,
        aiFeedback: 'Good accuracy overall',
        learningInsights: 'Items with complex shapes need improvement',
        suggestedImprovements: 'Increase training data for furniture items',
        processingTime: 45,
        errorOccurred: false
      })

      expect(result).toEqual(mockSession)
      expect(mockPrismaClient.feedbackSession.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'test-session-id',
          correctedItems: 2,
          totalDifferences: 5,
          averageDifference: 15.5,
          maxDifference: 25,
          aiFeedback: 'Good accuracy overall',
          learningInsights: 'Items with complex shapes need improvement',
          suggestedImprovements: 'Increase training data for furniture items',
          processingTime: 45,
          errorOccurred: false,
          feedbackProcessed: true
        }
      })
    })

    it('should handle create feedback session errors', async () => {
      mockPrismaClient.feedbackSession.create.mockRejectedValue(new Error('Database error'))

      await expect(createFeedbackSession('test-session-id', {
        correctedItems: 2,
        totalDifferences: 5,
        averageDifference: 15.5,
        maxDifference: 25
      })).rejects.toThrow('Database error')
    })
  })
})