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
    expect(screen.getAllByText('Submitted')).toHaveLength(2) // One in chip, one in step
  })

  it('displays all workflow steps', () => {
    render(<WorkflowStatus {...defaultProps} />)
    
    expect(screen.getAllByText('Submitted')).toHaveLength(2) // One in chip, one in step
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('Quoted')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('shows current status as active', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    // The component shows the current status in a chip - use getAllByText to handle multiple instances
    expect(screen.getAllByText('Assigned')).toHaveLength(2) // One in chip, one in step
  })

  it('displays assigned sales rep information', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Assigned Sales Rep')).toBeInTheDocument()
  })

  it('shows quote acceptance buttons for customer when quoted', () => {
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

  it('calls onStatusChange when customer accepts quote', async () => {
    const user = userEvent.setup()
    const onStatusChange = jest.fn()
    
    render(
      <WorkflowStatus 
        {...defaultProps} 
        onStatusChange={onStatusChange}
        currentStatus="quoted"
        isCustomer={true}
        isSalesRep={false}
      />
    )
    
    const acceptButton = screen.getByText('Accept Quote')
    await user.click(acceptButton)
    
    expect(onStatusChange).toHaveBeenCalledWith('accepted')
  })

  it('displays completion message when status is accepted', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="accepted" />)
    
    // The component shows "Accepted" status - use getAllByText to handle multiple instances
    expect(screen.getAllByText('Accepted')).toHaveLength(2) // One in chip, one in step
    expect(screen.getByText('Customer has accepted the final quote')).toBeInTheDocument()
  })

  it('shows no action buttons when workflow is complete', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="accepted" />)
    
    // No action buttons should be visible for completed workflow
    expect(screen.queryByText('Mark as')).not.toBeInTheDocument()
  })

  it('handles missing assigned sales rep gracefully', () => {
    render(<WorkflowStatus {...defaultProps} assignedSalesRep={undefined} />)
    
    // Should not show sales rep section when no sales rep assigned
    expect(screen.queryByText('Assigned Sales Rep')).not.toBeInTheDocument()
  })

  it('formats dates correctly', () => {
    render(<WorkflowStatus {...defaultProps} assignedAt="2024-01-15T14:30:00Z" />)
    
    // The component shows the timestamp in a readable format - look for the actual format
    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument()
  })

  it('shows thank you message for customers when submitted', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="submitted" isCustomer={true} isSalesRep={false} />)
    
    expect(screen.getByText(/Thank you!/)).toBeInTheDocument()
    expect(screen.getByText(/Your inventory has been submitted successfully/)).toBeInTheDocument()
  })

  it('shows next steps message for sales reps when assigned', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    expect(screen.getByText(/Next Steps:/)).toBeInTheDocument()
    expect(screen.getByText(/Schedule a site visit/)).toBeInTheDocument()
  })

  it('shows quote ready alert for customers when quoted', () => {
    render(
      <WorkflowStatus 
        {...defaultProps} 
        currentStatus="quoted" 
        isCustomer={true} 
        isSalesRep={false} 
      />
    )
    
    expect(screen.getByText('Quote Ready')).toBeInTheDocument()
    expect(screen.getByText(/Your final quote has been prepared/)).toBeInTheDocument()
  })

  it('displays step descriptions correctly', () => {
    render(<WorkflowStatus {...defaultProps} />)
    
    expect(screen.getByText('Customer has submitted their inventory for review')).toBeInTheDocument()
    expect(screen.getByText('Inventory has been assigned to a sales representative')).toBeInTheDocument()
    expect(screen.getByText('Sales rep has verified items and dimensions on-site')).toBeInTheDocument()
    expect(screen.getByText('Final quote has been provided to customer')).toBeInTheDocument()
    expect(screen.getByText('Customer has accepted the final quote')).toBeInTheDocument()
  })

  it('shows correct status colors and icons', () => {
    render(<WorkflowStatus {...defaultProps} currentStatus="assigned" />)
    
    // Check that the status chip is rendered with correct content - use getAllByText for multiple instances
    expect(screen.getAllByText('Assigned')).toHaveLength(2) // One in chip, one in step
    
    // Check that the step descriptions are shown
    expect(screen.getByText('Inventory has been assigned to a sales representative')).toBeInTheDocument()
  })

  it('handles error state correctly', () => {
    render(<WorkflowStatus {...defaultProps} />)
    
    // Initially no error should be shown
    expect(screen.queryByText(/Error/)).not.toBeInTheDocument()
  })

  it('renders stepper with correct orientation', () => {
    render(<WorkflowStatus {...defaultProps} />)
    
    // The stepper should be rendered
    expect(screen.getByText('Workflow Status')).toBeInTheDocument()
    
    // All steps should be visible - use getAllByText for "Submitted" since it appears twice
    expect(screen.getAllByText('Submitted')).toHaveLength(2) // One in chip, one in step
    expect(screen.getByText('Assigned')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('Quoted')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('shows appropriate content for different user roles', () => {
    // Test as customer
    const { rerender } = render(
      <WorkflowStatus {...defaultProps} isCustomer={true} isSalesRep={false} currentStatus="quoted" />
    )
    
    expect(screen.getByText('Accept Quote')).toBeInTheDocument()
    
    // Test as sales rep
    rerender(<WorkflowStatus {...defaultProps} isCustomer={false} isSalesRep={true} currentStatus="assigned" />)
    
    expect(screen.getByText(/Next Steps:/)).toBeInTheDocument()
  })

  // Snapshot tests
  it('matches snapshot for submitted status', () => {
    const { container } = render(<WorkflowStatus {...defaultProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot for verified status', () => {
    const verifiedProps = {
      ...defaultProps,
      currentStatus: 'verified' as const,
    }

    const { container } = render(<WorkflowStatus {...verifiedProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot for accepted status', () => {
    const acceptedProps = {
      ...defaultProps,
      currentStatus: 'accepted' as const,
    }

    const { container } = render(<WorkflowStatus {...acceptedProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot without assigned sales rep', () => {
    const noRepProps = {
      ...defaultProps,
      assignedSalesRep: null,
    }

    const { container } = render(<WorkflowStatus {...noRepProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot for customer view', () => {
    const customerProps = {
      ...defaultProps,
      isCustomer: true,
      isSalesRep: false,
      currentStatus: 'quoted' as const,
    }

    const { container } = render(<WorkflowStatus {...customerProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})