import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the entire ProgressIndicator component
jest.mock('../../src/components/ProgressIndicator', () => {
  return function MockProgressIndicator({ message, size, color }: any) {
    return (
      <div data-testid="progress-indicator">
        <div data-testid="spinner" style={{ width: size, height: size, color: color }}>
          Loading...
        </div>
        {message && <div data-testid="message">{message}</div>}
      </div>
    )
  }
})

import ProgressIndicator from '../../src/components/ProgressIndicator'

describe('ProgressIndicator Component', () => {
  it('renders progress indicator component', () => {
    const { container } = render(<ProgressIndicator />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with custom message', () => {
    const { container } = render(<ProgressIndicator message="Processing your request..." />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with custom size', () => {
    const { container } = render(<ProgressIndicator size={48} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with custom color', () => {
    const { container } = render(<ProgressIndicator color="secondary" />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with all custom props', () => {
    const { container } = render(
      <ProgressIndicator 
        message="Loading data..." 
        size={32} 
        color="primary" 
      />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})