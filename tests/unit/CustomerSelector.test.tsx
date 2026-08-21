import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// The previous version of this file mocked the component under test and then
// snapshotted the mock, so it verified nothing about the real component. It
// also mocked a default export while importing the named one, leaving
// CustomerSelector undefined.
const setCustomerIdMock = jest.fn().mockResolvedValue(undefined)

jest.mock('@/app/actions/state-actions', () => ({
  setCustomerId: (...args: unknown[]) => setCustomerIdMock(...args),
}))

import { CustomerSelector } from '../../src/components/CustomerSelector'

const customers = [
  { id: 'customer-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { id: 'customer-2', firstName: 'Jane', lastName: 'Roe', email: 'jane@example.com' },
]

function mockFetch(impl: () => Promise<unknown> | unknown) {
  global.fetch = jest.fn(async () => impl()) as unknown as typeof fetch
}

const okResponse = (body: unknown) => ({ ok: true, json: async () => body })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('CustomerSelector', () => {
  it('shows a loading state before customers arrive', () => {
    mockFetch(() => new Promise(() => {})) // never resolves
    render(<CustomerSelector />)

    expect(screen.getByText('Loading customers...')).toBeInTheDocument()
  })

  it('fetches customers from /api/customers', async () => {
    mockFetch(() => okResponse(customers))
    render(<CustomerSelector />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/customers'))
  })

  it('renders the picker once loaded', async () => {
    mockFetch(() => okResponse(customers))
    render(<CustomerSelector />)

    expect(await screen.findByText('Select Customer')).toBeInTheDocument()
    expect(screen.getByLabelText('Customer')).toBeInTheDocument()
  })

  it('renders an empty customer list without crashing', async () => {
    mockFetch(() => okResponse([]))
    render(<CustomerSelector />)

    expect(await screen.findByText('Select Customer')).toBeInTheDocument()
  })

  it('surfaces an error when the request fails', async () => {
    mockFetch(() => ({ ok: false, json: async () => ({}) }))
    render(<CustomerSelector />)

    expect(await screen.findByText('Failed to fetch customers')).toBeInTheDocument()
    expect(screen.queryByText('Select Customer')).not.toBeInTheDocument()
  })

  it('preselects the customer named by currentCustomerId', async () => {
    mockFetch(() => okResponse(customers))
    render(<CustomerSelector currentCustomerId="customer-2" />)

    await waitFor(() =>
      expect(screen.getByLabelText('Customer')).toHaveValue('Jane Roe (jane@example.com)')
    )
  })

  it('persists the selection and notifies the parent', async () => {
    const user = userEvent.setup()
    const onCustomerChange = jest.fn()
    mockFetch(() => okResponse(customers))

    render(<CustomerSelector onCustomerChange={onCustomerChange} />)

    const input = await screen.findByLabelText('Customer')
    await user.click(input)
    await user.click(await screen.findByText('John Doe'))

    await waitFor(() => expect(setCustomerIdMock).toHaveBeenCalledWith('customer-1'))
    expect(onCustomerChange).toHaveBeenCalledWith('customer-1')
  })
})
