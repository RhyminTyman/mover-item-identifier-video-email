import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import WorkflowStatus from '@/components/WorkflowStatus'

describe('WorkflowStatus Component', () => {
  const defaultProps = {
    currentStatus: 'submitted',
    assignedSalesRep: {
      id: 'sales-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    assignedAt: '2024-01-15T10:00:00Z',
    onStatusChange: jest.fn(),
    isSalesRep: true,
    isCustomer: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders workflow status component', () => {
    render(<WorkflowStatus {...defaultProps} />)
    
    expect(screen.getByText('Workflow Status')).toBeInTheDocument()
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('displays all workflow steps', () => {
    render(<WorkflowStatus {...defaultProps} />)
    
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('Quoted')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('shows current status as active', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    const submittedStep = screen.getByText('Submitted').closest('.MuiStepLabel-root')
    const assignedStep = screen.getByText('Assigned').closest('.MuiStepLabel-root')
    
    expect(submittedStep).toHaveClass('Mui-completed')
    expect(assignedStep).toHaveClass('Mui-active')
  })

  it('displays assigned sales rep information', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Assigned on Jan 15, 2024 at 10:00 AM')).toBeInTheDocument()
  })

  it('shows status update button for sales rep', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    expect(screen.getByText('Mark as Verified')).toBeInTheDocument()
  })

  it('shows status update button for customer when quoted', () => {
    render(
      <WorkflowStatus 
        {...defaultProps} 
        currentStatus="quoted" 
        isSalesRep={false}
        isCustomer={true}
      />
    )
    
    expect(screen.getByText('Accept Quote')).toBeInTheDocument()
    expect(screen.getByText('Request Changes')).toBeInTheDocument()
  })

  it('calls onStatusChange when status update button is clicked', async () => {
    const user = userEvent.setup()
    const onStatusChange = jest.fn()
    
    render(
      <WorkflowStatus 
        {...defaultProps} 
        onStatusChange={onStatusChange}
        currentStatus="assigned"
      />
    )
    
    const updateButton = screen.getByText('Mark as Verified')
    await user.click(updateButton)
    
    expect(onStatusChange).toHaveBeenCalledWith('verified')
  })

  it('handles status update API call', async () => {
    const user = userEvent.setup()
    const onStatusChange = jest.fn()
    
    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
    
    render(
      <WorkflowStatus 
        {...defaultProps} 
        onStatusChange={onStatusChange}
        currentStatus="assigned"
      />
    )
    
    const updateButton = screen.getByText('Mark as Verified')
    await user.click(updateButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/inventories/inventory-id/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'verified' }),
      })
    })
  })

  it('shows loading state during status update', async () => {
    const user = userEvent.setup()
    
    // Mock delayed API response
    global.fetch = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }), 100))
    )
    
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    const updateButton = screen.getByText('Mark as Verified')
    await user.click(updateButton)
    
    expect(screen.getByText('Updating...')).toBeInTheDocument()
  })

  it('displays error message when status update fails', async () => {
    const user = userEvent.setup()
    
    // Mock failed API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Update failed' }),
    })
    
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    const updateButton = screen.getByText('Mark as Verified')
    await user.click(updateButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to update status/)).toBeInTheDocument()
    })
  })

  it('shows different button text based on current status', () => {
    const { rerender } = render(<WorkflowStatus {...defaultProps} currentStatus="submitted" />)
    expect(screen.getByText('Assign to Sales Rep')).toBeInTheDocument()
    
    rerender(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    expect(screen.getByText('Mark as Verified')).toBeInTheDocument()
    
    rerender(<WorkflowStatus {...defaultProps} currentStatus="verified" />)
    expect(screen.getByText('Generate Quote')).toBeInTheDocument()
    
    rerender(<WorkflowStatus {...defaultProps} currentStatus="quoted" isCustomer={true} isSalesRep={false} />)
    expect(screen.getByText('Accept Quote')).toBeInTheDocument()
  })

  it('displays completion message when status is accepted', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="accepted" />)
    
    expect(screen.getByText('Quote Accepted')).toBeInTheDocument()
    expect(screen.getByText('Customer has accepted the quote. Moving process can begin.')).toBeInTheDocument()
  })

  it('shows no action buttons when workflow is complete', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="accepted" />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('handles missing assigned sales rep gracefully', () => {
    render(<WorkflowStatus {...defaultProps} assignedSalesRep={undefined} />)
    
    expect(screen.getByText('No sales rep assigned')).toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(<WorkflowStatus {...defaultProps} assignedAt="2024-01-15T14:30:00Z" />)
    
    expect(screen.getByText('Assigned on Jan 15, 2024 at 2:30 PM')).toBeInTheDocument()
  })
})
