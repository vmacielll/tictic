import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from './TaskForm'

describe('TaskForm', () => {
  it('renders input and submit button', () => {
    render(<TaskForm onSubmit={vi.fn()} />)

    expect(screen.getByTestId('task-input')).toBeInTheDocument()
    expect(screen.getByTestId('task-add-button')).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<TaskForm onSubmit={vi.fn()} />)

    expect(screen.getByTestId('task-add-button')).toBeDisabled()
  })

  it('submit button is enabled when title is not empty', async () => {
    const user = userEvent.setup()
    render(<TaskForm onSubmit={vi.fn()} />)

    await user.type(screen.getByTestId('task-input'), 'New task')

    expect(screen.getByTestId('task-add-button')).not.toBeDisabled()
  })

  it('shows the provided placeholder', () => {
    render(<TaskForm onSubmit={vi.fn()} placeholder="Custom placeholder" />)

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
  })

  it('uses default placeholder when not provided', () => {
    render(<TaskForm onSubmit={vi.fn()} />)

    expect(screen.getByPlaceholderText('Add a task...')).toBeInTheDocument()
  })

  it('shows expanded details (description, date, priority) on focus', async () => {
    const user = userEvent.setup()
    render(<TaskForm onSubmit={vi.fn()} />)

    await user.click(screen.getByTestId('task-input'))

    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument()
    expect(screen.getByTestId('priority-L')).toBeInTheDocument()
    expect(screen.getByTestId('priority-M')).toBeInTheDocument()
    expect(screen.getByTestId('priority-H')).toBeInTheDocument()
  })

  it('renders priority buttons with correct labels', async () => {
    const user = userEvent.setup()
    render(<TaskForm onSubmit={vi.fn()} />)

    await user.click(screen.getByTestId('task-input'))

    expect(screen.getByTestId('priority-L')).toHaveTextContent('L')
    expect(screen.getByTestId('priority-M')).toHaveTextContent('M')
    expect(screen.getByTestId('priority-H')).toHaveTextContent('H')
  })

  it('calls onSubmit with the correct data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TaskForm onSubmit={onSubmit} />)

    const input = screen.getByTestId('task-input')
    await user.type(input, 'My task')

    // Focus to show details
    await user.click(input)

    // Select HIGH priority
    await user.click(screen.getByTestId('priority-H'))

    // Submit
    await user.click(screen.getByTestId('task-add-button'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'My task',
      priority: 'HIGH',
      description: undefined,
      dueDate: undefined,
    })
  })

  it('calls onSubmit with description and dueDate when provided', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TaskForm onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('task-input'), 'Task with details')

    // Focus to reveal details
    await user.click(screen.getByTestId('task-input'))

    await user.type(screen.getByPlaceholderText('Description (optional)'), 'A description')
    await user.click(screen.getByTestId('priority-L'))

    await user.click(screen.getByTestId('task-add-button'))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Task with details',
      priority: 'LOW',
      description: 'A description',
      dueDate: undefined,
    })
  })

  it('uses default priority MEDIUM when not changed', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TaskForm onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('task-input'), 'Default priority task')
    await user.click(screen.getByTestId('task-add-button'))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'MEDIUM' }),
    )
  })

  it('shows spinner in submit button when submitting', async () => {
    let resolvePromise!: (value: unknown) => void
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve }),
    )
    const user = userEvent.setup()
    render(<TaskForm onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('task-input'), 'Submitting task')
    await user.click(screen.getByTestId('task-add-button'))

    const button = screen.getByTestId('task-add-button')
    expect(button.querySelector('.animate-spin')).toBeInTheDocument()
    expect(button).toBeDisabled()

    resolvePromise(undefined)
  })

  it('disables all inputs while submitting', async () => {
    let resolvePromise!: (value: unknown) => void
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve }),
    )
    const user = userEvent.setup()
    render(<TaskForm onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('task-input'), 'Submitting')
    await user.click(screen.getByTestId('task-input')) // show details
    await user.click(screen.getByTestId('task-add-button'))

    expect(screen.getByTestId('task-input')).toBeDisabled()
    expect(screen.getByPlaceholderText('Description (optional)')).toBeDisabled()

    resolvePromise(undefined)
  })

  it('resets form after successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TaskForm onSubmit={onSubmit} />)

    await user.type(screen.getByTestId('task-input'), 'My task')

    // Focus to show details
    await user.click(screen.getByTestId('task-input'))
    const descInput = screen.getByPlaceholderText('Description (optional)')
    await user.type(descInput, 'A description')

    await user.click(screen.getByTestId('task-add-button'))

    // Wait for form to reset
    await waitFor(() => {
      expect(screen.getByTestId('task-input')).toHaveValue('')
    })

    // Details section should be hidden
    expect(screen.queryByPlaceholderText('Description (optional)')).not.toBeInTheDocument()
  })

  it('initializes dueDate from defaultDueDate prop', async () => {
    render(<TaskForm onSubmit={vi.fn()} defaultDueDate="2026-05-15" />)

    // Focus to reveal the date input
    const input = screen.getByTestId('task-input')
    input.focus()

    await expect(screen.findByDisplayValue('2026-05-15')).resolves.toBeInTheDocument()
  })
})
