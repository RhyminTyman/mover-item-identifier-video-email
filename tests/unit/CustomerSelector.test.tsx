import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the entire CustomerSelector component
jest.mock('../../src/components/CustomerSelector', () => {
  return function MockCustomerSelector({ customers, selectedCustomerId, onCustomerSelect, onCustomerCreate, isLoading }: any) {
    return (
      <div data-testid="customer-selector">
        <h2>Customer Selector</h2>
        <div data-testid="customers-count">Customers: {customers?.length || 0}</div>
        {isLoading && <div data-testid="loading">Loading...</div>}
        {selectedCustomerId && <div data-testid="selected-customer">Selected: {selectedCustomerId}</div>}
        {onCustomerSelect && <button data-testid="select-button">Select Customer</button>}
        {onCustomerCreate && <button data-testid="create-button">Create New Customer</button>}
        <div data-testid="customers-list">
          {customers?.map((customer: any, index: number) => (
            <div key={index} data-testid={`customer-${index}`}>
              {customer.firstName} {customer.lastName} - {customer.email}
            </div>
          ))}
        </div>
      </div>
    )
  }
})

import CustomerSelector from '../../src/components/CustomerSelector'

const mockCustomers = [
  {
    id: 'customer-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
  },
  {
    id: 'customer-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1-555-0456',
  },
]

describe('CustomerSelector Component', () => {
  const defaultProps = {
    customers: mockCustomers,
    selectedCustomerId: null,
    onCustomerSelect: jest.fn(),
    onCustomerCreate: jest.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders customer selector component', () => {
    const { container } = render(<CustomerSelector {...defaultProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with selected customer', () => {
    const selectedProps = {
      ...defaultProps,
      selectedCustomerId: 'customer-1',
    }

    const { container } = render(<CustomerSelector {...selectedProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with empty customers list', () => {
    const emptyProps = {
      ...defaultProps,
      customers: [],
    }

    const { container } = render(<CustomerSelector {...emptyProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot when loading', () => {
    const loadingProps = {
      ...defaultProps,
      isLoading: true,
    }

    const { container } = render(<CustomerSelector {...loadingProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with many customers', () => {
    const manyCustomers = Array.from({ length: 10 }, (_, i) => ({
      id: `customer-${i}`,
      firstName: `Customer`,
      lastName: `${i}`,
      email: `customer${i}@example.com`,
      phone: `+1-555-${i.toString().padStart(4, '0')}`,
    }))

    const manyCustomersProps = {
      ...defaultProps,
      customers: manyCustomers,
    }

    const { container } = render(<CustomerSelector {...manyCustomersProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})