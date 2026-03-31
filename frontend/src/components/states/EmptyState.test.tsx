import { render, screen } from '@testing-library/react'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No courses yet" description="Start by creating your first course." />)

    expect(screen.getByRole('note')).toBeInTheDocument()
    expect(screen.getByText('No courses yet')).toBeInTheDocument()
    expect(screen.getByText('Start by creating your first course.')).toBeInTheDocument()
  })
})
