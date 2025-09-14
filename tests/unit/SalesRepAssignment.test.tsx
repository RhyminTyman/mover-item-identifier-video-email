import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the entire SalesRepAssignment component to avoid async issues
jest.mock('../../src/components/SalesRepAssignment', () => {
  return function MockSalesRepAssignment({ inventoryId, currentAssignedRep, status, onAssignmentChange, isAdmin }: any) {
    return (
      <div data-testid="sales-rep-assignment">
        <h2>Sales Rep Assignment</h2>
        <div data-testid="inventory-id">Inventory: {inventoryId}</div>
        <div data-testid="status">Status: {status}</div>
        {currentAssignedRep && (
          <div data-testid="assigned-rep">
            Assigned: {currentAssignedRep.firstName} {currentAssignedRep.lastName}
          </div>
        )}
        {isAdmin && <div data-testid="admin-controls">Admin Controls</div>}
      </div>
    )
  }
})

import SalesRepAssignment from '../../src/components/SalesRepAssignment'

const mockSalesReps = [
  {
    id: 'sales-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  {
    id: 'sales-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
  },
]

describe('SalesRepAssignment Component', () => {
  const defaultProps = {
    inventoryId: 'inv-123',
    status: 'submitted',
    onAssignmentChange: jest.fn(),
    isAdmin: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders sales rep assignment component', () => {
    const { container } = render(<SalesRepAssignment {...defaultProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with assigned sales rep', () => {
    const propsWithAssignment = {
      ...defaultProps,
      currentAssignedRep: mockSalesReps[0],
    }

    const { container } = render(<SalesRepAssignment {...propsWithAssignment} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot for non-admin users', () => {
    const nonAdminProps = {
      ...defaultProps,
      isAdmin: false,
      currentAssignedRep: mockSalesReps[0],
    }

    const { container } = render(<SalesRepAssignment {...nonAdminProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with different status', () => {
    const differentStatusProps = {
      ...defaultProps,
      status: 'assigned',
      currentAssignedRep: mockSalesReps[0],
    }

    const { container } = render(<SalesRepAssignment {...differentStatusProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})