import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CrmManagement from '@/components/admin/CrmManagement'

// Mock fetch
global.fetch = jest.fn()

const mockIntegrations = [
  {
    id: '1',
    provider: 'smartmoving',
    name: 'SmartMoving Integration',
    description: 'Test integration',
    isActive: true,
    syncLeads: true,
    syncSales: true,
    syncSchedule: true,
    syncCustomers: true,
    lastSyncAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
]

const mockLeads = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
    phone: '+1-555-0123',
    status: 'new',
    priority: 'high',
    estimatedValue: 2500,
    moveDate: '2024-02-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
  },
]

const mockSales = [
  {
    id: '1',
    opportunityName: 'John Smith Residential Move',
    stage: 'proposal',
    probability: 75,
    estimatedValue: 2500,
    actualValue: null,
    expectedCloseDate: '2024-02-01T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
  },
]

const mockSchedules = [
  {
    id: '1',
    title: 'Site Visit - John Smith',
    startTime: '2024-01-20T10:00:00Z',
    endTime: '2024-01-20T12:00:00Z',
    type: 'site-visit',
    status: 'scheduled',
    location: '123 Main St',
    createdAt: '2024-01-15T00:00:00Z',
  },
]

describe('CrmManagement Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
    
    // Mock successful API responses
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIntegrations),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLeads),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSales),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSchedules),
      })
  })

  it('renders CRM management interface', async () => {
    render(<CrmManagement />)
    
    expect(screen.getByText('CRM Integration Management')).toBeInTheDocument()
    expect(screen.getByText('Add Integration')).toBeInTheDocument()
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('SmartMoving Integration')).toBeInTheDocument()
    })
  })

  it('displays integration cards with correct information', async () => {
    render(<CrmManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('SmartMoving Integration')).toBeInTheDocument()
      expect(screen.getByText('SmartMoving')).toBeInTheDocument()
      expect(screen.getByText('Test integration')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('shows sync buttons and status', async () => {
    render(<CrmManagement />)
    
    await waitFor(() => {
      expect(screen.getByText('Sync')).toBeInTheDocument()
      expect(screen.getByText('Activate')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
  })

  it('opens add integration dialog', async () => {
    render(<CrmManagement />)
    
    const addButton = screen.getByText('Add Integration')
    fireEvent.click(addButton)
    
    expect(screen.getByText('Add CRM Integration')).toBeInTheDocument()
    expect(screen.getByText('CRM Provider')).toBeInTheDocument()
    expect(screen.getByText('Integration Name')).toBeInTheDocument()
  })

  it('allows selecting CRM provider', async () => {
    render(<CrmManagement />)
    
    const addButton = screen.getByText('Add Integration')
    fireEvent.click(addButton)
    
    const providerSelect = screen.getByDisplayValue('')
    fireEvent.click(providerSelect)
    
    expect(screen.getByText('SmartMoving')).toBeInTheDocument()
    expect(screen.getByText('MoveGuru')).toBeInTheDocument()
    expect(screen.getByText('Custom Integration')).toBeInTheDocument()
  })

  it('handles form submission for new integration', async () => {
    const user = userEvent.setup()
    render(<CrmManagement />)
    
    // Mock successful POST response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '2', ...mockIntegrations[0] }),
    })
    
    const addButton = screen.getByText('Add Integration')
    await user.click(addButton)
    
    // Fill form
    await user.type(screen.getByLabelText('Integration Name'), 'Test Integration')
    await user.type(screen.getByLabelText('API Endpoint'), 'https://api.test.com')
    await user.type(screen.getByLabelText('API Key'), 'test-key')
    
    const createButton = screen.getByText('Create Integration')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/crm/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test Integration'),
      })
    })
  })

  it('displays leads in the leads tab', async () => {
    render(<CrmManagement />)
    
    await waitFor(() => {
      const leadsTab = screen.getByText('Leads (1)')
      fireEvent.click(leadsTab)
    })
    
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('$2,500.00')).toBeInTheDocument()
  })

  it('displays sales in the sales tab', async () => {
    render(<CrmManagement />)
    
    await waitFor(() => {
      const salesTab = screen.getByText('Sales (1)')
      fireEvent.click(salesTab)
    })
    
    expect(screen.getByText('John Smith Residential Move')).toBeInTheDocument()
    expect(screen.getByText('Proposal')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('$2,500.00')).toBeInTheDocument()
  })

  it('displays schedules in the schedule tab', async () => {
    render(<CrmManagement />)
    
    await waitFor(() => {
      const scheduleTab = screen.getByText('Schedule (1)')
      fireEvent.click(scheduleTab)
    })
    
    expect(screen.getByText('Site Visit - John Smith')).toBeInTheDocument()
    expect(screen.getByText('Site-visit')).toBeInTheDocument()
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
  })

  it('handles sync integration action', async () => {
    render(<CrmManagement />)
    
    // Mock successful sync response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Synced successfully' }),
    })
    
    await waitFor(() => {
      const syncButton = screen.getByText('Sync')
      fireEvent.click(syncButton)
    })
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/crm/integrations/1/sync', {
        method: 'POST',
      })
    })
  })

  it('handles toggle integration active status', async () => {
    render(<CrmManagement />)
    
    // Mock successful PATCH response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Updated successfully' }),
    })
    
    await waitFor(() => {
      const deactivateButton = screen.getByText('Deactivate')
      fireEvent.click(deactivateButton)
    })
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/crm/integrations/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })
    })
  })

  it('displays error message when API fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))
    
    render(<CrmManagement />)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load CRM data/)).toBeInTheDocument()
    })
  })

  it('shows no integrations message when empty', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
    
    render(<CrmManagement />)
    
    await waitFor(() => {
      expect(screen.getByText(/No CRM integrations configured/)).toBeInTheDocument()
    })
  })
})
