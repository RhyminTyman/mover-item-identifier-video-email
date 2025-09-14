import {
  SmartMovingConnector,
  MoveGuruConnector,
  createCrmConnector,
  CrmSyncService,
} from '@/lib/crm-connectors'

// Mock fetch globally
global.fetch = jest.fn()

describe('CRM Connectors', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  describe('SmartMovingConnector', () => {
    const config = {
      apiEndpoint: 'https://api.smartmoving.com/v1',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
    }

    const connector = new SmartMovingConnector(config)

    it('tests connection successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      const result = await connector.testConnection()
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://api.smartmoving.com/v1/auth/test',
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('tests connection failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      })

      const result = await connector.testConnection()
      expect(result).toBe(false)
    })

    it('syncs leads successfully', async () => {
      const mockLeads = {
        leads: [
          {
            id: '1',
            first_name: 'John',
            last_name: 'Smith',
            email: 'john@example.com',
            phone: '+1-555-0123',
            status: 'new',
            priority: 'high',
            estimated_value: 2500,
            move_date: '2024-02-15',
            origin_address: '123 Main St',
            destination_address: '456 Oak Ave',
            move_type: 'residential',
          },
        ],
      }

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLeads),
      })

      const leads = await connector.syncLeads()
      
      expect(leads).toHaveLength(1)
      expect(leads[0]).toEqual({
        crmLeadId: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '+1-555-0123',
        source: undefined,
        status: 'new',
        priority: 'high',
        estimatedValue: 2500,
        notes: undefined,
        moveDate: new Date('2024-02-15'),
        originAddress: '123 Main St',
        destinationAddress: '456 Oak Ave',
        moveType: 'residential',
      })
    })

    it('syncs sales successfully', async () => {
      const mockSales = {
        opportunities: [
          {
            id: '1',
            name: 'John Smith Move',
            stage: 'proposal',
            probability: 75,
            estimated_value: 2500,
            actual_value: null,
            expected_close_date: '2024-02-01',
            notes: 'High-value move',
            lead_id: '1',
          },
        ],
      }

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSales),
      })

      const sales = await connector.syncSales()
      
      expect(sales).toHaveLength(1)
      expect(sales[0]).toEqual({
        crmSaleId: '1',
        opportunityName: 'John Smith Move',
        stage: 'proposal',
        probability: 75,
        estimatedValue: 2500,
        actualValue: null,
        expectedCloseDate: new Date('2024-02-01'),
        notes: 'High-value move',
        leadId: '1',
      })
    })

    it('syncs schedules successfully', async () => {
      const mockSchedules = {
        appointments: [
          {
            id: '1',
            title: 'Site Visit',
            description: 'Initial assessment',
            start_time: '2024-01-20T10:00:00Z',
            end_time: '2024-01-20T12:00:00Z',
            location: '123 Main St',
            type: 'site-visit',
            status: 'scheduled',
            priority: 'high',
            attendees: [
              {
                name: 'John Smith',
                email: 'john@example.com',
                role: 'customer',
              },
            ],
            lead_id: '1',
          },
        ],
      }

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSchedules),
      })

      const schedules = await connector.syncSchedules()
      
      expect(schedules).toHaveLength(1)
      expect(schedules[0]).toEqual({
        crmScheduleId: '1',
        title: 'Site Visit',
        description: 'Initial assessment',
        startTime: new Date('2024-01-20T10:00:00Z'),
        endTime: new Date('2024-01-20T12:00:00Z'),
        location: '123 Main St',
        type: 'site-visit',
        status: 'scheduled',
        priority: 'high',
        attendees: [
          {
            name: 'John Smith',
            email: 'john@example.com',
            role: 'customer',
          },
        ],
        leadId: '1',
      })
    })

    it('creates a new lead', async () => {
      const newLead = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+1-555-0456',
        status: 'new',
        priority: 'medium',
        estimatedValue: 1800,
      }

      const mockResponse = {
        id: '2',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '+1-555-0456',
        status: 'new',
        priority: 'medium',
        estimated_value: 1800,
      }

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await connector.createLead(newLead)
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.smartmoving.com/v1/leads',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'jane@example.com',
            phone: '+1-555-0456',
            company: undefined,
            source: undefined,
            status: 'new',
            priority: 'medium',
            estimated_value: 1800,
            notes: undefined,
            move_date: undefined,
            origin_address: undefined,
            destination_address: undefined,
            move_type: undefined,
          }),
        }
      )

      expect(result.crmLeadId).toBe('2')
      expect(result.firstName).toBe('Jane')
    })

    it('handles API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      })

      await expect(connector.syncLeads()).rejects.toThrow('SmartMoving API error: Unauthorized')
    })
  })

  describe('MoveGuruConnector', () => {
    const config = {
      apiEndpoint: 'https://api.moveguru.com/v2',
      apiKey: 'test-api-key',
    }

    const connector = new MoveGuruConnector(config)

    it('tests connection successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      const result = await connector.testConnection()
      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        'https://api.moveguru.com/v2/ping',
        {
          headers: {
            'X-API-Key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        }
      )
    })

    it('throws error for unimplemented methods', async () => {
      await expect(connector.syncLeads()).rejects.toThrow('MoveGuru connector not implemented yet')
      await expect(connector.syncSales()).rejects.toThrow('MoveGuru connector not implemented yet')
      await expect(connector.syncSchedules()).rejects.toThrow('MoveGuru connector not implemented yet')
    })
  })

  describe('CRM Connector Factory', () => {
    const config = {
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    }

    it('creates SmartMoving connector', () => {
      const connector = createCrmConnector('smartmoving', config)
      expect(connector).toBeInstanceOf(SmartMovingConnector)
    })

    it('creates MoveGuru connector', () => {
      const connector = createCrmConnector('moveguru', config)
      expect(connector).toBeInstanceOf(MoveGuruConnector)
    })

    it('throws error for unsupported provider', () => {
      expect(() => createCrmConnector('unsupported', config))
        .toThrow('Unsupported CRM provider: unsupported')
    })
  })

  describe('CrmSyncService', () => {
    const mockConnector = {
      testConnection: jest.fn(),
      syncLeads: jest.fn(),
      syncSales: jest.fn(),
      syncSchedules: jest.fn(),
    }

    const syncService = new CrmSyncService(mockConnector as any)

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('syncs all data successfully', async () => {
      mockConnector.testConnection.mockResolvedValue(true)
      mockConnector.syncLeads.mockResolvedValue([
        { crmLeadId: '1', firstName: 'John', lastName: 'Smith' },
      ])
      mockConnector.syncSales.mockResolvedValue([
        { crmSaleId: '1', opportunityName: 'Test Sale' },
      ])
      mockConnector.syncSchedules.mockResolvedValue([
        { crmScheduleId: '1', title: 'Test Appointment' },
      ])

      const result = await syncService.syncAllData()

      expect(result).toEqual({
        leads: { synced: 1, created: 0, updated: 0 },
        sales: { synced: 1, created: 0, updated: 0 },
        schedules: { synced: 1, created: 0, updated: 0 },
      })

      expect(mockConnector.testConnection).toHaveBeenCalled()
      expect(mockConnector.syncLeads).toHaveBeenCalled()
      expect(mockConnector.syncSales).toHaveBeenCalled()
      expect(mockConnector.syncSchedules).toHaveBeenCalled()
    })

    it('throws error when connection test fails', async () => {
      mockConnector.testConnection.mockResolvedValue(false)

      await expect(syncService.syncAllData()).rejects.toThrow('Failed to connect to CRM')
    })
  })
})
