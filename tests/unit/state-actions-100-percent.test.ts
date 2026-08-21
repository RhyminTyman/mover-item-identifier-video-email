import { jest } from '@jest/globals';

// Mock Next.js modules
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}));

describe('state-actions.ts - 100% Coverage Tests', () => {
  let mockCookieStore: any;
  let mockRevalidatePath: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    };

    mockRevalidatePath = require('next/cache').revalidatePath;
    require('next/headers').cookies.mockResolvedValue(mockCookieStore);
  });

  it('should export all functions', async () => {
    const stateActions = await import('@/app/actions/state-actions');
    
    expect(stateActions.getAppState).toBeDefined();
    expect(stateActions.updateAppState).toBeDefined();
    expect(stateActions.addFiles).toBeDefined();
    expect(stateActions.removeFile).toBeDefined();
    expect(stateActions.updateFileRoom).toBeDefined();
    expect(stateActions.updateFileTags).toBeDefined();
    expect(stateActions.startAnalysis).toBeDefined();
    expect(stateActions.updateProgress).toBeDefined();
    expect(stateActions.setAnalysisResult).toBeDefined();
    expect(stateActions.setError).toBeDefined();
    expect(stateActions.clearError).toBeDefined();
    expect(stateActions.updateTitle).toBeDefined();
    expect(stateActions.updateNote).toBeDefined();
    expect(stateActions.setActiveTab).toBeDefined();
    expect(stateActions.setTheme).toBeDefined();
    expect(stateActions.toggleTheme).toBeDefined();
    expect(stateActions.setCustomerId).toBeDefined();
    expect(stateActions.resetAnalysis).toBeDefined();
    expect(stateActions.resetApp).toBeDefined();
  });

  describe('getAppState', () => {
    it('should return default state when no cookie exists', async () => {
      mockCookieStore.get.mockReturnValue(null);
      
      const { getAppState } = await import('@/app/actions/state-actions');
      const state = await getAppState();
      
      expect(state).toEqual({
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      });
    });

    it('should return parsed state when valid cookie exists', async () => {
      const mockState = {
        files: [{ id: '1', name: 'test.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:test', roomName: 'Kitchen', kind: 'image', tags: [] }],
        result: { items: [], confidenceNote: 'Test' },
        phase: "complete",
        progress: 100,
        saving: false,
        error: null,
        title: "Test Move",
        note: "Test note",
        s3UploadFailed: false,
        activeTab: 'inventories',
        theme: 'dark',
        customerId: 'customer-123'
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(mockState) });
      
      const { getAppState } = await import('@/app/actions/state-actions');
      const state = await getAppState();
      
      expect(state).toEqual(mockState);
    });

    it('should return default state when JSON parsing fails', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid json' });
      
      const { getAppState } = await import('@/app/actions/state-actions');
      const state = await getAppState();
      
      expect(state).toEqual({
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      });
    });
  });

  describe('updateAppState', () => {
    it('should update state with partial updates', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateAppState } = await import('@/app/actions/state-actions');
      await updateAppState({ phase: "uploading", progress: 50 });
      
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"phase":"uploading"'),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24
        }
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('should handle production environment for secure cookies', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateAppState } = await import('@/app/actions/state-actions');
      await updateAppState({ theme: 'dark' });
      
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"theme":"dark"'),
        {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24
        }
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('addFiles', () => {
    it('should add files with generated IDs', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { addFiles } = await import('@/app/actions/state-actions');
      const newFiles = [
        {
          name: 'test1.jpg',
          size: 1024,
          type: 'image/jpeg',
          preview: 'blob:test1',
          roomName: 'Kitchen',
          kind: 'image' as const
        },
        {
          name: 'test2.jpg',
          size: 2048,
          type: 'image/jpeg',
          preview: 'blob:test2',
          roomName: 'Living Room',
          kind: 'image' as const,
          tags: ['furniture']
        }
      ];
      
      await addFiles(newFiles);
      
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'app-state',
        expect.stringContaining('"files":['),
        expect.any(Object)
      );
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files).toHaveLength(2);
      expect(updatedState.files[0]).toMatchObject({
        name: 'test1.jpg',
        size: 1024,
        type: 'image/jpeg',
        preview: 'blob:test1',
        roomName: 'Kitchen',
        kind: 'image',
        tags: []
      });
      expect(updatedState.files[1]).toMatchObject({
        name: 'test2.jpg',
        tags: ['furniture']
      });
      expect(updatedState.files[0].id).toBeDefined();
      expect(updatedState.files[1].id).toBeDefined();
    });

    it('should handle files with existing tags', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { addFiles } = await import('@/app/actions/state-actions');
      const newFiles = [
        {
          name: 'test.jpg',
          size: 1024,
          type: 'image/jpeg',
          preview: 'blob:test',
          roomName: 'Kitchen',
          kind: 'image' as const,
          tags: ['existing', 'tags']
        }
      ];
      
      await addFiles(newFiles);
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files[0].tags).toEqual(['existing', 'tags']);
    });
  });

  describe('removeFile', () => {
    it('should remove file by ID', async () => {
      const currentState = {
        files: [
          { id: '1', name: 'test1.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:test1', roomName: 'Kitchen', kind: 'image', tags: [] },
          { id: '2', name: 'test2.jpg', size: 2048, type: 'image/jpeg', preview: 'blob:test2', roomName: 'Living Room', kind: 'image', tags: [] }
        ],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { removeFile } = await import('@/app/actions/state-actions');
      await removeFile('1');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files).toHaveLength(1);
      expect(updatedState.files[0].id).toBe('2');
    });

    it('should handle removing non-existent file', async () => {
      const currentState = {
        files: [
          { id: '1', name: 'test1.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:test1', roomName: 'Kitchen', kind: 'image', tags: [] }
        ],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { removeFile } = await import('@/app/actions/state-actions');
      await removeFile('non-existent');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files).toHaveLength(1);
    });
  });

  describe('updateFileRoom', () => {
    it('should update room name for specific file', async () => {
      const currentState = {
        files: [
          { id: '1', name: 'test1.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:test1', roomName: 'Kitchen', kind: 'image', tags: [] },
          { id: '2', name: 'test2.jpg', size: 2048, type: 'image/jpeg', preview: 'blob:test2', roomName: 'Living Room', kind: 'image', tags: [] }
        ],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateFileRoom } = await import('@/app/actions/state-actions');
      await updateFileRoom('1', 'Bedroom');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files[0].roomName).toBe('Bedroom');
      expect(updatedState.files[1].roomName).toBe('Living Room');
    });

    it('should handle updating room to null', async () => {
      const currentState = {
        files: [
          { id: '1', name: 'test1.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:test1', roomName: 'Kitchen', kind: 'image', tags: [] }
        ],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateFileRoom } = await import('@/app/actions/state-actions');
      await updateFileRoom('1', null);
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files[0].roomName).toBe(null);
    });
  });

  describe('updateFileTags', () => {
    it('should update tags for specific file', async () => {
      const currentState = {
        files: [
          { id: '1', name: 'test1.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:test1', roomName: 'Kitchen', kind: 'image', tags: ['old'] },
          { id: '2', name: 'test2.jpg', size: 2048, type: 'image/jpeg', preview: 'blob:test2', roomName: 'Living Room', kind: 'image', tags: ['existing'] }
        ],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateFileTags } = await import('@/app/actions/state-actions');
      await updateFileTags('1', ['new', 'tags']);
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files[0].tags).toEqual(['new', 'tags']);
      expect(updatedState.files[1].tags).toEqual(['existing']);
    });
  });

  describe('Analysis actions', () => {
    it('should start analysis', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { startAnalysis } = await import('@/app/actions/state-actions');
      await startAnalysis();
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.phase).toBe("uploading");
      expect(updatedState.progress).toBe(0);
      expect(updatedState.error).toBe(null);
    });

    it('should update progress', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "uploading",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateProgress } = await import('@/app/actions/state-actions');
      await updateProgress(75, "processing");
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.progress).toBe(75);
      expect(updatedState.phase).toBe("processing");
    });

    it('should set analysis result', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "uploading",
        progress: 50,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { setAnalysisResult } = await import('@/app/actions/state-actions');
      const result = {
        items: [
          {
            shortName: 'Test Item',
            description: 'A test item',
            estimatedDimensionsInches: { length: 10, width: 5, height: 3 },
            notes: 'Test notes',
            tags: ['test'],
            roomName: 'Kitchen'
          }
        ],
        confidenceNote: 'Analysis complete'
      };
      
      await setAnalysisResult(result);
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.result).toEqual(result);
      expect(updatedState.phase).toBe("complete");
      expect(updatedState.progress).toBe(100);
    });

    it('should set error', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "uploading",
        progress: 50,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { setError } = await import('@/app/actions/state-actions');
      await setError('Test error message');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.error).toBe('Test error message');
      expect(updatedState.phase).toBe("error");
    });

    it('should clear error', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "error",
        progress: 0,
        saving: false,
        error: 'Previous error',
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { clearError } = await import('@/app/actions/state-actions');
      await clearError();
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.error).toBe(null);
    });
  });

  describe('Form actions', () => {
    it('should update title', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateTitle } = await import('@/app/actions/state-actions');
      await updateTitle('New Title');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.title).toBe('New Title');
    });

    it('should update note', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateNote } = await import('@/app/actions/state-actions');
      await updateNote('New note content');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.note).toBe('New note content');
    });
  });

  describe('Tab management', () => {
    it('should set active tab to analyze', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'inventories' as const,
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { setActiveTab } = await import('@/app/actions/state-actions');
      await setActiveTab('analyze');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.activeTab).toBe('analyze');
    });

    it('should set active tab to inventories', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze' as const,
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { setActiveTab } = await import('@/app/actions/state-actions');
      await setActiveTab('inventories');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.activeTab).toBe('inventories');
    });
  });

  describe('Theme management', () => {
    it('should set theme to light', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'dark' as const,
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { setTheme } = await import('@/app/actions/state-actions');
      await setTheme('light');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.theme).toBe('light');
    });

    it('should set theme to dark', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light' as const,
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { setTheme } = await import('@/app/actions/state-actions');
      await setTheme('dark');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.theme).toBe('dark');
    });

    it('should toggle theme from light to dark', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light' as const,
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { toggleTheme } = await import('@/app/actions/state-actions');
      await toggleTheme();
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.theme).toBe('dark');
    });

    it('should toggle theme from dark to light', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'dark' as const,
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { toggleTheme } = await import('@/app/actions/state-actions');
      await toggleTheme();
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.theme).toBe('light');
    });
  });

  describe('Customer management', () => {
    it('should set customer ID', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { setCustomerId } = await import('@/app/actions/state-actions');
      await setCustomerId('customer-123');
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.customerId).toBe('customer-123');
    });

    it('should set customer ID to null', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: 'customer-123'
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { setCustomerId } = await import('@/app/actions/state-actions');
      await setCustomerId(null);
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.customerId).toBe(null);
    });
  });

  describe('Reset actions', () => {
    it('should reset analysis state', async () => {
      const currentState = {
        files: [{ id: '1', name: 'test.jpg', size: 1024, type: 'image/jpeg', preview: 'blob:test', roomName: 'Kitchen', kind: 'image', tags: [] }],
        result: { items: [], confidenceNote: 'Test' },
        phase: "complete",
        progress: 100,
        saving: false,
        error: 'Some error',
        title: "My Move",
        note: "",
        s3UploadFailed: true,
        activeTab: 'inventories' as const,
        theme: 'dark' as const,
        customerId: 'customer-123'
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { resetAnalysis } = await import('@/app/actions/state-actions');
      await resetAnalysis();
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files).toEqual([]);
      expect(updatedState.result).toBe(null);
      expect(updatedState.phase).toBe("idle");
      expect(updatedState.progress).toBe(0);
      expect(updatedState.error).toBe(null);
      expect(updatedState.s3UploadFailed).toBe(false);
      expect(updatedState.customerId).toBe(null);
      // These should remain unchanged
      expect(updatedState.title).toBe("My Move");
      expect(updatedState.note).toBe("");
      expect(updatedState.activeTab).toBe('inventories');
      expect(updatedState.theme).toBe('dark');
    });

    it('should reset entire app state', async () => {
      const { resetApp } = await import('@/app/actions/state-actions');
      await resetApp();
      
      expect(mockCookieStore.delete).toHaveBeenCalledWith('app-state');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty files array in addFiles', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { addFiles } = await import('@/app/actions/state-actions');
      await addFiles([]);
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.files).toEqual([]);
    });

    it('should handle malformed cookie value gracefully', async () => {
      mockCookieStore.get.mockReturnValue({ value: '{invalid json' });
      
      const { getAppState } = await import('@/app/actions/state-actions');
      const state = await getAppState();
      
      expect(state).toEqual({
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      });
    });

    it('should handle null cookie value', async () => {
      mockCookieStore.get.mockReturnValue(null);
      
      const { getAppState } = await import('@/app/actions/state-actions');
      const state = await getAppState();
      
      expect(state).toEqual({
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      });
    });

    it('should handle undefined cookie value', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      
      const { getAppState } = await import('@/app/actions/state-actions');
      const state = await getAppState();
      
      expect(state).toEqual({
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      });
    });

    it('should handle empty string cookie value', async () => {
      mockCookieStore.get.mockReturnValue({ value: '' });
      
      const { getAppState } = await import('@/app/actions/state-actions');
      const state = await getAppState();
      
      expect(state).toEqual({
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      });
    });

    it('should handle complex nested state updates', async () => {
      const currentState = {
        files: [],
        result: null,
        phase: "idle",
        progress: 0,
        saving: false,
        error: null,
        title: "My Move",
        note: "",
        s3UploadFailed: false,
        activeTab: 'analyze',
        theme: 'light',
        customerId: null,
        workflowPhase: 'upload',
        editedItems: null,
        pricingData: null
      };
      
      mockCookieStore.get.mockReturnValue({ value: JSON.stringify(currentState) });
      
      const { updateAppState } = await import('@/app/actions/state-actions');
      await updateAppState({
        phase: "uploading",
        progress: 25,
        saving: true,
        error: null,
        s3UploadFailed: false
      });
      
      const setCall = mockCookieStore.set.mock.calls[0];
      const updatedState = JSON.parse(setCall[1]);
      expect(updatedState.phase).toBe("uploading");
      expect(updatedState.progress).toBe(25);
      expect(updatedState.saving).toBe(true);
      expect(updatedState.error).toBe(null);
      expect(updatedState.s3UploadFailed).toBe(false);
    });
  });
});
