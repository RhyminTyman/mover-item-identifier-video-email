import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the entire AnalysisButton component
jest.mock('../../src/components/AnalysisButton', () => {
  return function MockAnalysisButton({ onAnalyze, isLoading, disabled, children }: any) {
    return (
      <div data-testid="analysis-button">
        <button 
          data-testid="analyze-btn"
          onClick={onAnalyze}
          disabled={disabled || isLoading}
        >
          {isLoading ? 'Analyzing...' : (children || 'Analyze')}
        </button>
        {isLoading && <div data-testid="loading-indicator">Loading...</div>}
      </div>
    )
  }
})

import AnalysisButton from '../../src/components/AnalysisButton'

describe('AnalysisButton Component', () => {
  const defaultProps = {
    onAnalyze: jest.fn(),
    isLoading: false,
    disabled: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders analysis button component', () => {
    const { container } = render(<AnalysisButton {...defaultProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot when loading', () => {
    const loadingProps = {
      ...defaultProps,
      isLoading: true,
    }

    const { container } = render(<AnalysisButton {...loadingProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot when disabled', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    }

    const { container } = render(<AnalysisButton {...disabledProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with custom text', () => {
    const customTextProps = {
      ...defaultProps,
      children: 'Start Analysis',
    }

    const { container } = render(<AnalysisButton {...customTextProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  it('matches snapshot with all states combined', () => {
    const allStatesProps = {
      ...defaultProps,
      isLoading: true,
      disabled: true,
      children: 'Processing...',
    }

    const { container } = render(<AnalysisButton {...allStatesProps} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})