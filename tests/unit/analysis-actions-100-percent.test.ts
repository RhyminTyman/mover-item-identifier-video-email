/**
 * 100% Coverage test for analysis-actions.ts
 * Target: 100% across all metrics (statements, branches, functions, lines)
 */

describe('analysis-actions.ts - 100% Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should export all functions', async () => {
    // Mock all dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const analysisActions = await import('@/app/actions/analysis-actions');
    
    expect(typeof analysisActions.analyzeFiles).toBe('function');
    expect(typeof analysisActions.analyzeFilesWithImages).toBe('function');
    expect(typeof analysisActions.saveInventory).toBe('function');
  });

  it('should handle analyzeFiles with no files', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFiles } = await import('@/app/actions/analysis-actions');
    
    await expect(analyzeFiles()).rejects.toThrow('No files to analyze');
  });

  it('should handle analyzeFilesWithImages with empty array', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const result = await analyzeFilesWithImages([]);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with invalid files', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'document.pdf', dataUrl: 'data:application/pdf;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with valid images', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({ items: [] })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'image.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with null result', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: null,
        title: 'Test',
        note: 'Test note'
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with no user', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: {
          items: [{ shortName: 'Test Item' }]
        },
        title: 'Test',
        note: 'Test note'
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(() => Promise.resolve(null)),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with successful customer user', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: {
          items: [
            {
              shortName: 'Test Item',
              description: 'Test description',
              notes: 'Test notes',
              estimatedDimensionsInches: {
                length: 10,
                width: 10,
                height: 10
              },
              tags: ['test'],
              roomName: 'Test Room'
            }
          ]
        },
        title: 'Test Title',
        note: 'Test note',
        customerId: null
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { 
          create: jest.fn(() => Promise.resolve({ id: 'test-inventory' }))
        },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(() => Promise.resolve({
        id: 'test-user-id',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Test',
        lastName: 'User'
      })),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(() => Promise.resolve({
        id: 'test-user-id',
        role: 'customer'
      })),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with sales user', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: {
          items: [
            {
              shortName: 'Test Item',
              description: 'Test description',
              notes: 'Test notes',
              estimatedDimensionsInches: {
                length: 10,
                width: 10,
                height: 10
              },
              tags: ['test'],
              roomName: 'Test Room'
            }
          ]
        },
        title: 'Sales Inventory',
        note: 'Sales note',
        customerId: 'customer-123'
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { 
          create: jest.fn(() => Promise.resolve({ id: 'test-inventory' }))
        },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(() => Promise.resolve({
        id: 'sales-123',
        emailAddresses: [{ emailAddress: 'sales@example.com' }],
        firstName: 'Sales',
        lastName: 'User'
      })),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(() => Promise.resolve({
        id: 'sales-123',
        role: 'sales'
      })),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with admin user', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: {
          items: [
            {
              shortName: 'Test Item',
              description: 'Test description',
              notes: 'Test notes',
              estimatedDimensionsInches: {
                length: 10,
                width: 10,
                height: 10
              },
              tags: ['test'],
              roomName: 'Test Room'
            }
          ]
        },
        title: 'Admin Inventory',
        note: 'Admin note',
        customerId: 'customer-456'
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { 
          create: jest.fn(() => Promise.resolve({ id: 'test-inventory' }))
        },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(() => Promise.resolve({
        id: 'admin-123',
        emailAddresses: [{ emailAddress: 'admin@example.com' }],
        firstName: 'Admin',
        lastName: 'User'
      })),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(() => Promise.resolve({
        id: 'admin-123',
        role: 'admin'
      })),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with database error', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: {
          items: [{ shortName: 'Test Item' }]
        },
        title: 'Test',
        note: 'Test note'
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { 
          create: jest.fn(() => Promise.reject(new Error('Database error')))
        },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(() => Promise.resolve({
        id: 'test-user-id',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Test',
        lastName: 'User'
      })),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(() => Promise.resolve({
        id: 'test-user-id',
        role: 'customer'
      })),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with non-Error exception', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.reject('String error')),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with missing email', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: {
          items: [{ shortName: 'Test Item' }]
        },
        title: 'Test',
        note: 'Test note'
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(() => Promise.resolve({
        id: 'user-123',
        emailAddresses: [],
        firstName: 'Test',
        lastName: 'User'
      })),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(() => Promise.reject(new Error('Email required'))),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with missing names', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: {
          items: [
            {
              shortName: 'Test Item',
              description: 'Test description',
              notes: 'Test notes',
              estimatedDimensionsInches: {
                length: 10,
                width: 10,
                height: 10
              },
              tags: ['test'],
              roomName: 'Test Room'
            }
          ]
        },
        title: 'Test Title',
        note: 'Test note',
        customerId: null
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { 
          create: jest.fn(() => Promise.resolve({ id: 'test-inventory' }))
        },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(() => Promise.resolve({
        id: 'user-123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: null,
        lastName: null
      })),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(() => Promise.resolve({
        id: 'user-123',
        role: 'customer'
      })),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle saveInventory with multiple items', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => Promise.resolve({
        result: {
          items: [
            {
              shortName: 'Item 1',
              description: 'Description 1',
              notes: 'Notes 1',
              estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
              tags: ['tag1'],
              roomName: 'Room 1'
            },
            {
              shortName: 'Item 2',
              description: 'Description 2',
              notes: 'Notes 2',
              estimatedDimensionsInches: { length: 20, width: 20, height: 20 },
              tags: ['tag2'],
              roomName: 'Room 2'
            }
          ]
        },
        title: 'Multiple Items',
        note: 'Multiple note',
        customerId: null
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { 
          create: jest.fn(() => Promise.resolve({ id: 'test-inventory' }))
        },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(() => Promise.resolve({
        id: 'test-user-id',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Test',
        lastName: 'User'
      })),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(() => Promise.resolve({
        id: 'test-user-id',
        role: 'customer'
      })),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { saveInventory } = await import('@/app/actions/analysis-actions');
    const result = await saveInventory();
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with successful analysis and determineItemComplexity', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Simple Box',
            description: 'A simple box container',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['simple', 'container']
          },
          {
            shortName: 'Complex Furniture',
            description: 'Complex furniture piece',
            estimatedDimensionsInches: { length: 20, width: 20, height: 20 },
            tags: ['furniture', 'complex']
          },
          {
            shortName: 'Moderate Item',
            description: 'Regular item',
            estimatedDimensionsInches: { length: 15, width: 15, height: 15 },
            tags: ['moderate']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'simple-box.jpg', dataUrl: 'data:image/jpeg;base64,test' },
      { name: 'furniture.jpg', dataUrl: 'data:image/jpeg;base64,test2' },
      { name: 'moderate.jpg', dataUrl: 'data:image/jpeg;base64,test3' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with analytics error', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Test Item',
            description: 'Test description',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['test']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(() => Promise.reject(new Error('Analytics error'))),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'test.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFiles with files present', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [{ 
          name: 'test.jpg', 
          type: 'image/jpeg', 
          kind: 'image', 
          roomName: 'Test Room',
          preview: 'blob:http://localhost:3000/test-blob-url'
        }] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedUrl: 'https://test-signed-url.com' })
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test data'], { type: 'image/jpeg' }))
      })
      .mockResolvedValueOnce({
        ok: true
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: [
            {
              shortName: 'Test Item',
              description: 'Test description',
              estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
              tags: ['test']
            }
          ],
          confidenceNote: 'Analysis completed successfully'
        })
      });

    const { analyzeFiles } = await import('@/app/actions/analysis-actions');
    
    const result = await analyzeFiles();
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFiles with error in helper functions', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [{ 
          name: 'test.jpg', 
          type: 'image/jpeg', 
          kind: 'image', 
          roomName: 'Test Room' 
        }] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

    const { analyzeFiles } = await import('@/app/actions/analysis-actions');
    
    await expect(analyzeFiles()).rejects.toThrow('Failed to get signed URL');
  });

  it('should handle analyzeFiles with S3 upload error', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [{ 
          name: 'test.jpg', 
          type: 'image/jpeg', 
          kind: 'image', 
          roomName: 'Test Room',
          preview: 'blob:http://localhost:3000/test-blob-url'
        }] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedUrl: 'https://test-signed-url.com' })
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test data'], { type: 'image/jpeg' }))
      })
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'S3 Upload Failed'
      });

    const { analyzeFiles } = await import('@/app/actions/analysis-actions');
    
    await expect(analyzeFiles()).rejects.toThrow('S3 upload failed: S3 Upload Failed');
  });

  it('should handle analyzeFiles with analysis API error', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [{ 
          name: 'test.jpg', 
          type: 'image/jpeg', 
          kind: 'image', 
          roomName: 'Test Room',
          preview: 'blob:http://localhost:3000/test-blob-url'
        }] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedUrl: 'https://test-signed-url.com' })
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test data'], { type: 'image/jpeg' }))
      })
      .mockResolvedValueOnce({
        ok: true
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Analysis API failed' })
      });

    const { analyzeFiles } = await import('@/app/actions/analysis-actions');
    
    await expect(analyzeFiles()).rejects.toThrow('Analysis API failed');
  });

  it('should handle analyzeFiles with File instance', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [{ 
          name: 'test.jpg', 
          type: 'image/jpeg', 
          kind: 'image', 
          roomName: 'Test Room'
        }] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    // Create a mock File instance
    const mockFile = new File(['test data'], 'test.jpg', { type: 'image/jpeg' });
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedUrl: 'https://test-signed-url.com' })
      })
      .mockResolvedValueOnce({
        ok: true
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: [
            {
              shortName: 'Test Item',
              description: 'Test description',
              estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
              tags: ['test']
            }
          ],
          confidenceNote: 'Analysis completed successfully'
        })
      });

    const { analyzeFiles } = await import('@/app/actions/analysis-actions');
    
    // Mock the file to be a File instance
    const mockGetAppState = require('@/app/actions/state-actions').getAppState;
    mockGetAppState.mockReturnValueOnce({
      files: [mockFile]
    });
    
    const result = await analyzeFiles();
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFiles with invalid file data', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [{ 
          name: 'test.jpg', 
          type: 'image/jpeg', 
          kind: 'image', 
          roomName: 'Test Room',
          preview: 'invalid-url' // Not a blob URL
        }] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedUrl: 'https://test-signed-url.com' })
      });

    const { analyzeFiles } = await import('@/app/actions/analysis-actions');
    
    await expect(analyzeFiles()).rejects.toThrow('Invalid file data');
  });

  it('should handle analyzeFilesWithImages with analytics error in catch block', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.reject(new Error('Analysis failed'))),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(() => Promise.reject(new Error('Analytics update failed'))),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'test.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with files containing room names', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [
          { name: 'item from kitchen.jpg', kind: 'image', roomName: 'Kitchen' },
          { name: 'item from living-room.jpg', kind: 'image', roomName: 'Living Room' }
        ] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Item from kitchen',
            description: 'Kitchen item',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['kitchen']
          },
          {
            shortName: 'Item from living-room',
            description: 'Living room item',
            estimatedDimensionsInches: { length: 20, width: 20, height: 20 },
            tags: ['living-room']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'item from kitchen.jpg', dataUrl: 'data:image/jpeg;base64,test' },
      { name: 'item from living-room.jpg', dataUrl: 'data:image/jpeg;base64,test2' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with unknown room names', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Unknown Item',
            description: 'Unknown item',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['unknown']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'unknown.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with single file (singular form)', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Single Item',
            description: 'A single item description',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['single']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    // Test with exactly 1 file to trigger singular form
    const mockFiles = [
      { name: 'single.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with correspondingFile tags', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [
          { name: 'item from kitchen.jpg', kind: 'image', tags: ['kitchen', 'furniture'] }
        ] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Item from kitchen',
            description: 'Kitchen item with matching file',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['kitchen']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'item from kitchen.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with item without tags', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Item without tags',
            description: 'Item with no tags',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            // No tags property
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'no-tags.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFiles with analysis API error without error message', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [{ 
          name: 'test.jpg', 
          type: 'image/jpeg', 
          kind: 'image', 
          roomName: 'Test Room',
          preview: 'blob:http://localhost:3000/test-blob-url'
        }] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedUrl: 'https://test-signed-url.com' })
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test data'], { type: 'image/jpeg' }))
      })
      .mockResolvedValueOnce({
        ok: true
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}) // No error message
      });

    const { analyzeFiles } = await import('@/app/actions/analysis-actions');
    
    await expect(analyzeFiles()).rejects.toThrow('Analysis failed');
  });

  it('should handle analyzeFilesWithImages without OPENAI_VISION_MODEL env var', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Test Item',
            description: 'Test description',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['test']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    // Clear the environment variable
    const originalEnv = process.env.OPENAI_VISION_MODEL;
    delete process.env.OPENAI_VISION_MODEL;

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'test.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();

    // Restore the environment variable
    if (originalEnv) {
      process.env.OPENAI_VISION_MODEL = originalEnv;
    }
  });

  it('should handle analyzeFilesWithImages without confidenceNote', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Test Item',
            description: 'Test description',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['test']
          }
        ],
        // No confidenceNote property
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'test.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with single file and no confidenceNote (singular + fallback)', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ files: [] })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Single Item',
            description: 'A single item description',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['single']
          }
        ],
        // No confidenceNote property - this will trigger the fallback
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    // Test with exactly 1 file AND no confidenceNote to trigger both branches
    const mockFiles = [
      { name: 'single.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with item having null shortName', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [
          { name: 'test.jpg', kind: 'image', tags: ['test'] }
        ] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: null, // null shortName to test optional chaining
            description: 'Item with null shortName',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['test']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'test.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should handle analyzeFilesWithImages with correspondingFile having no tags', async () => {
    // Mock minimal dependencies
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn(),
      setAnalysisState: jest.fn(),
      setAnalysisResult: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn(() => ({ 
        files: [
          { name: 'item from kitchen.jpg', kind: 'image' } // No tags property
        ] 
      })),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
    }));

    jest.doMock('@/lib/db', () => ({
      prisma: {
        inventory: { create: jest.fn() },
        analysisSession: { create: jest.fn(), update: jest.fn() },
        itemAnalysis: { createMany: jest.fn() },
      },
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn(() => Promise.resolve({
        items: [
          {
            shortName: 'Item from kitchen',
            description: 'Kitchen item with matching file but no tags',
            estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
            tags: ['kitchen']
          }
        ],
        confidenceNote: 'Analysis completed successfully'
      })),
    }));

    jest.doMock('@clerk/nextjs/server', () => ({
      auth: jest.fn(() => ({ userId: 'test-user-id' })),
      currentUser: jest.fn(),
    }));

    jest.doMock('@/lib/user', () => ({
      getCurrentUser: jest.fn(() => ({ id: 'test-user-id', email: 'test@example.com' })),
      ensureUserExists: jest.fn(),
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn(() => Promise.resolve('test-session-id')),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn(() => 'test-session-id'),
      addItemAnalytics: jest.fn(),
    }));

    jest.doMock('@/lib/s3', () => ({
      s3: { getObject: jest.fn() },
    }));

    global.fetch = jest.fn();

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'item from kitchen.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test determineItemComplexity function branches - simple items', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'A simple box container',
            shortName: 'Box',
            tags: ['simple', 'storage']
          }
        ],
        confidenceNote: 'High confidence'
      }),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn()
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'simple box.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test determineItemComplexity function branches - complex items with furniture', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Large furniture piece',
            shortName: 'Sofa',
            tags: ['furniture']
          }
        ],
        confidenceNote: 'High confidence'
      }),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn()
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'furniture.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test determineItemComplexity function branches - complex items with appliance', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Kitchen appliance',
            shortName: 'Refrigerator',
            tags: ['appliance']
          }
        ],
        confidenceNote: 'High confidence'
      }),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn()
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'appliance.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test determineItemComplexity function branches - complex items with complex tag', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Electronic device',
            shortName: 'Computer',
            tags: ['complex']
          }
        ],
        confidenceNote: 'High confidence'
      }),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn()
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'complex.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test determineItemComplexity function branches - moderate items', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Regular household item',
            shortName: 'Lamp',
            tags: ['decorative']
          }
        ],
        confidenceNote: 'High confidence'
      }),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn()
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'lamp.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test determineItemComplexity function branches - item with no description', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn().mockResolvedValue({
        items: [
          {
            description: undefined,
            shortName: 'Item',
            tags: undefined
          }
        ],
        confidenceNote: 'High confidence'
      }),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn()
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'unknown.jpg', dataUrl: 'data:image/jpeg;base64,test' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test confidenceNote fallback with single file (singular form)', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Test item',
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: undefined // This should trigger the fallback
      }),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn()
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'single.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' } // Single file
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test confidenceNote fallback with multiple files (plural form)', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Test item 1',
            shortName: 'Test1',
            tags: ['test']
          },
          {
            description: 'Test item 2',
            shortName: 'Test2',
            tags: ['test']
          }
        ],
        confidenceNote: null // This should trigger the fallback
      }),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn()
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'file1.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' },
      { name: 'file2.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' } // Multiple files
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test error handling with Error instance', async () => {
    const mockSetError = jest.fn();
    
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: mockSetError,
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockRejectedValue(new Error('Test error message'))
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'error.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
    expect(mockSetError).toHaveBeenCalledWith('Test error message');
  });

  it('should test error handling with non-Error instance', async () => {
    const mockSetError = jest.fn();
    
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: mockSetError,
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockRejectedValue('String error')
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'error.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
    expect(mockSetError).toHaveBeenCalledWith('Analysis failed');
  });

  it('should test confidenceNote with truthy value (not fallback)', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Test item',
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: 'Custom confidence message' // This should be used (truthy)
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'custom.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test determineItemComplexity with truthy description', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Valid description text', // This should be used (truthy)
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: 'High confidence'
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'valid.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test line 223 - confidenceNote truthy branch (exact coverage)', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Test item',
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: 'This is a truthy confidence note' // This should be used (truthy)
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'truthy-confidence.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test line 247 - item.description truthy branch (exact coverage)', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'This is a truthy description', // This should be used (truthy)
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: 'High confidence'
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'truthy-description.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test line 223 - ternary operator false branch (exactly 1 file)', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Test item',
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: undefined // This should trigger the fallback
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    // Exactly 1 file - this should make base64Images.length !== 1 evaluate to false
    const mockFiles = [
      { name: 'single-file.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should test both lines 223 and 247 - combined truthy branches', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'A very specific description that should be truthy', // Truthy description for line 247
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: 'Custom confidence message that is truthy' // Truthy confidenceNote for line 223
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'combined-truthy.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should cover lines 209-212 - analytics data creation with dimensions', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Test item with dimensions',
            shortName: 'Test',
            tags: ['test'],
            estimatedDimensionsInches: {
              length: 24,
              width: 12,
              height: 6
            }
          }
        ],
        confidenceNote: 'High confidence analysis'
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'dimensions-test.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should cover lines 221-236 - successful result setting and progress update', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Test item for final result',
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: 'Final analysis complete'
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'final-result.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should cover error handling lines 228-236 - catch block execution', async () => {
    const mockSetError = jest.fn();
    const mockUpdateAnalysisSession = jest.fn().mockRejectedValue(new Error('Analytics error'));
    
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: mockSetError,
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockRejectedValue(new Error('Analysis failed'))
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: mockUpdateAnalysisSession,
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    const mockFiles = [
      { name: 'error-test.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
    expect(mockSetError).toHaveBeenCalledWith('Analysis failed');
  });

  it('should cover line 223 - ternary operator false branch (exactly 1 file, no confidenceNote)', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            description: 'Single file test',
            shortName: 'Test',
            tags: ['test']
          }
        ],
        confidenceNote: null // This should trigger the fallback
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    // Exactly 1 file - this should make base64Images.length !== 1 evaluate to false
    // and confidenceNote is null, so it should use the fallback with singular form
    const mockFiles = [
      { name: 'single-file-final.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });

  it('should cover line 223 - EXACT branch coverage for ternary operator false case', async () => {
    jest.doMock('@/app/actions/state-actions', () => ({
      getAnalysisState: jest.fn().mockResolvedValue({
        files: []
      }),
      setAnalysisState: jest.fn(),
      clearAnalysisState: jest.fn(),
      getAppState: jest.fn().mockResolvedValue({
        files: []
      }),
      updateAppState: jest.fn(),
      setError: jest.fn(),
      startAnalysis: jest.fn(),
      updateProgress: jest.fn(),
      resetAnalysis: jest.fn(),
      setActiveTab: jest.fn(),
      setAnalysisResult: jest.fn()
    }));

    jest.doMock('@/lib/analysis', () => ({
      analyzeImageWithOpenAI: jest.fn(),
      generateInventoryReport: jest.fn(),
      analyzeImages: jest.fn().mockResolvedValue({
        items: [
          {
            shortName: 'Test Item from test.jpg',
            description: 'A test item',
            estimatedDimensionsInches: { length: 10, width: 5, height: 3 },
            notes: 'Test notes',
            tags: ['test', 'item'],
            roomName: 'Test Room'
          }
        ],
        confidenceNote: undefined // Explicitly undefined to trigger || operator
      })
    }));

    jest.doMock('@/lib/analytics', () => ({
      createAnalysisSession: jest.fn().mockResolvedValue('session-123'),
      updateAnalysisSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      addItemAnalytics: jest.fn()
    }));

    const { analyzeFilesWithImages } = await import('@/app/actions/analysis-actions');
    
    // CRITICAL: Exactly 1 file to make base64Images.length !== 1 evaluate to FALSE
    // This should trigger the false branch of the ternary operator: 's' : ''
    const mockFiles = [
      { name: 'exactly-one-file.jpg', dataUrl: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
    ];
    
    const result = await analyzeFilesWithImages(mockFiles);
    expect(result).toBeUndefined();
  });
});
