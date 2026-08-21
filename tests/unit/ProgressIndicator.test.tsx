import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// The previous version of this file called jest.mock() on the component under
// test and then snapshotted the mock, so it exercised none of the real
// component and could not detect a regression in it. Its snapshots also
// described props (message/size/color) the component has never accepted.
import ProgressIndicator from '../../src/components/ProgressIndicator'

describe('ProgressIndicator', () => {
  it('renders nothing while idle', () => {
    const { container } = render(
      <ProgressIndicator phase="idle" progress={0} error={null} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the error alert instead of progress when an error is present', () => {
    render(<ProgressIndicator phase="analyzing" progress={40} error="Upload failed" />)

    expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
    expect(screen.getByText('Upload failed')).toBeInTheDocument()
    // The stepper must not render alongside the error.
    expect(screen.queryByText('Uploading Files')).not.toBeInTheDocument()
  })

  it('shows the rounded progress percentage', () => {
    render(<ProgressIndicator phase="analyzing" progress={42.6} error={null} />)
    expect(screen.getByText('43%')).toBeInTheDocument()
  })

  it.each([
    ['uploading', 'Uploading your files to the cloud...'],
    ['analyzing', 'AI is analyzing your files to identify items...'],
    ['complete', 'Analysis complete! Review the results below.'],
  ])('shows the status message for the %s phase', (phase, message) => {
    render(<ProgressIndicator phase={phase} progress={50} error={null} />)
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('renders every step label', () => {
    render(<ProgressIndicator phase="analyzing" progress={50} error={null} />)

    expect(screen.getByText('Uploading Files')).toBeInTheDocument()
    expect(screen.getByText('Analyzing Files')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('renders no status message for an unrecognised phase', () => {
    render(<ProgressIndicator phase="something-else" progress={10} error={null} />)

    expect(
      screen.queryByText('AI is analyzing your files to identify items...')
    ).not.toBeInTheDocument()
    // Still renders the shell so progress remains visible.
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })
})
