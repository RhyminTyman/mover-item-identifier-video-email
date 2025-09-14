import {
  updateAppState,
  setError,
  updateProgress,
  setAnalysisResult,
  startAnalysis,
  getAppState,
  clearError,
  updateTitle,
  updateNote,
  setCustomerId,
  setTheme,
  setActiveTab,
  addFiles,
  removeFile,
  updateFileRoom,
} from '../../src/app/actions/state-actions'

// Mock Next.js dependencies
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

describe('State Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('updateAppState', () => {
    it('updates app state successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ files: [], progress: 0 }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      const { revalidatePath } = require('next/cache')
      cookies.mockReturnValue(mockCookies)

      await updateAppState({ progress: 50 })

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"progress":50'),
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/')
    })

    it('handles missing state cookie', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await updateAppState({ progress: 50 })

      expect(mockCookies.set).toHaveBeenCalled()
    })

    it('handles invalid JSON in cookie', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'invalid-json' }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await updateAppState({ progress: 50 })

      expect(mockCookies.set).toHaveBeenCalled()
    })
  })

  describe('setError', () => {
    it('sets error state successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ error: null }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await setError('Test error')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"error":"Test error"'),
        expect.any(Object)
      )
    })
  })

  describe('updateProgress', () => {
    it('updates progress successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ progress: 0, phase: 'upload' }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await updateProgress(75, 'analyzing')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"progress":75'),
        expect.any(Object)
      )
    })
  })

  describe('setAnalysisResult', () => {
    it('sets analysis result successfully', async () => {
      const mockAnalysisResult = {
        items: [
          {
            shortName: 'Sofa',
            description: 'Large sofa',
            estimatedDimensionsInches: { length: 84, width: 36, height: 30 },
            notes: 'Brown leather',
            tags: ['furniture'],
            roomName: 'Living Room',
          },
        ],
        confidenceNote: 'High confidence',
      }

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ result: null }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await setAnalysisResult(mockAnalysisResult)

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"result":'),
        expect.any(Object)
      )
    })
  })

  describe('startAnalysis', () => {
    it('starts analysis successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ phase: 'upload' }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await startAnalysis()

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"phase":"uploading"'),
        expect.any(Object)
      )
    })
  })

  describe('getAppState', () => {
    it('retrieves app state successfully', async () => {
      const mockState = {
        files: [],
        result: null,
        phase: 'upload',
        progress: 0,
        saving: false,
        error: null,
        title: '',
        note: '',
        s3UploadFailed: false,
        activeTab: 'analyze' as const,
        theme: 'light' as const,
        customerId: null,
      }

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify(mockState) }),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      const result = await getAppState()

      expect(result).toEqual(mockState)
    })

    it('returns default state when no cookie exists', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      const result = await getAppState()

      expect(result).toEqual({
        files: [],
        result: null,
        phase: 'idle',
        progress: 0,
        saving: false,
        error: null,
        title: 'My Move',
        note: '',
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
      })
    })
  })

  describe('clearError', () => {
    it('clears error successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ error: 'Some error' }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await clearError()

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"error":null'),
        expect.any(Object)
      )
    })
  })

  describe('updateTitle', () => {
    it('sets title successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ title: '' }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await updateTitle('New Title')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"title":"New Title"'),
        expect.any(Object)
      )
    })
  })

  describe('updateNote', () => {
    it('sets note successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ note: '' }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await updateNote('New Note')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"note":"New Note"'),
        expect.any(Object)
      )
    })
  })

  describe('setCustomerId', () => {
    it('sets customer ID successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ customerId: null }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await setCustomerId('customer-123')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"customerId":"customer-123"'),
        expect.any(Object)
      )
    })
  })

  describe('setTheme', () => {
    it('sets theme successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ theme: 'light' }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await setTheme('dark')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"theme":"dark"'),
        expect.any(Object)
      )
    })
  })

  describe('setActiveTab', () => {
    it('sets active tab successfully', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ activeTab: 'analyze' }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await setActiveTab('inventories')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"activeTab":"inventories"'),
        expect.any(Object)
      )
    })
  })

  describe('addFiles', () => {
    it('adds files successfully', async () => {
      const mockFiles = [
        {
          name: 'test.jpg',
          size: 1024,
          type: 'image/jpeg',
          preview: 'blob:data',
          roomName: 'Living Room',
          kind: 'image' as const,
          tags: ['furniture'],
        },
      ]

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ files: [] }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await addFiles(mockFiles)

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"files":'),
        expect.any(Object)
      )
    })
  })

  describe('removeFile', () => {
    it('removes file successfully', async () => {
      const mockFiles = [
        { id: 'file-123', name: 'test.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:data', roomName: 'Living Room', kind: 'image' as const, tags: [] },
        { id: 'file-456', name: 'test2.jpg', size: 2048, type: 'image/jpeg', preview: 'blob:data', roomName: 'Kitchen', kind: 'image' as const, tags: [] },
      ]

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ files: mockFiles }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await removeFile('file-123')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"files":'),
        expect.any(Object)
      )
    })
  })

  describe('updateFileRoom', () => {
    it('updates file room successfully', async () => {
      const mockFiles = [
        { id: 'file-123', name: 'test.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:data', roomName: 'Living Room', kind: 'image' as const, tags: [] },
      ]

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: JSON.stringify({ files: mockFiles }) }),
        set: jest.fn(),
      }

      const { cookies } = require('next/headers')
      cookies.mockReturnValue(mockCookies)

      await updateFileRoom('file-123', 'Bedroom')

      expect(mockCookies.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"files":'),
        expect.any(Object)
      )
    })
  })
})