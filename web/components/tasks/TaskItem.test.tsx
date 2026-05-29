import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskItem } from './TaskItem'
import { type Task } from '@/domain/tasks/types'

const mockTask: Task = {
  id: 'task-1',
  title: 'Test task',
  description: 'A description',
  priority: 'MEDIUM',
  dueDate: new Date('2026-04-10T00:00:00.000Z'),
  dueTime: '14:00',
  dueTimezone: 'America/Sao_Paulo',
  completed: false,
  completedAt: undefined,
  listId: 'list-1',
  userId: 'user-1',
  createdAt: new Date('2026-04-09T10:00:00.000Z'),
  updatedAt: new Date('2026-04-10T08:00:00.000Z'),
}

describe('TaskItem', () => {
  it('renders task title and priority badge', () => {
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByTestId('task-item-task-1')).toBeInTheDocument()
    expect(screen.getByTestId('task-item-title')).toHaveTextContent('Test task')
    expect(screen.getByTestId('task-item-content')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('calls onToggle when checkbox is clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()

    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={vi.fn()} />)

    await user.click(screen.getByTestId('task-complete-button'))
    expect(onToggle).toHaveBeenCalledWith('task-1', false)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()

    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={onDelete} />)

    await user.click(screen.getByTestId('task-delete-button'))
    expect(onDelete).toHaveBeenCalledWith('task-1')
  })

  it('calls onViewDetails when content area is clicked (if provided)', async () => {
    const onViewDetails = vi.fn()
    const user = userEvent.setup()

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onViewDetails={onViewDetails}
      />,
    )

    await user.click(screen.getByTestId('task-item-content'))
    expect(onViewDetails).toHaveBeenCalledWith('task-1')
  })

  it('calls onViewDetails when view details button is clicked', async () => {
    const onViewDetails = vi.fn()
    const user = userEvent.setup()

    render(
      <TaskItem
        task={mockTask}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onViewDetails={onViewDetails}
      />,
    )

    await user.click(screen.getByLabelText('View task details'))
    expect(onViewDetails).toHaveBeenCalledWith('task-1')
  })

  it('does not render view details button when onViewDetails is not provided', () => {
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.queryByLabelText('View task details')).not.toBeInTheDocument()
  })

  it('shows completed state with line-through and checkmark', () => {
    const completedTask = { ...mockTask, completed: true }

    render(<TaskItem task={completedTask} onToggle={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByTestId('task-item-title')).toHaveClass('line-through')
    const completeButton = screen.getByTestId('task-complete-button')
    expect(completeButton.querySelector('svg')).toBeInTheDocument()
  })

  it('does not show checkmark for incomplete task', () => {
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} />)

    const completeButton = screen.getByTestId('task-complete-button')
    expect(completeButton.querySelector('svg')).not.toBeInTheDocument()
  })

  it('passes completed=true to onToggle when task is already completed', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    const completedTask = { ...mockTask, completed: true }

    render(<TaskItem task={completedTask} onToggle={onToggle} onDelete={vi.fn()} />)

    await user.click(screen.getByTestId('task-complete-button'))
    expect(onToggle).toHaveBeenCalledWith('task-1', true)
  })

  it('renders correct priority badge labels for all priorities', () => {
    const cases: Array<{ priority: Task['priority']; label: string }> = [
      { priority: 'HIGH', label: 'H' },
      { priority: 'MEDIUM', label: 'M' },
      { priority: 'LOW', label: 'L' },
    ]

    for (const { priority, label } of cases) {
      const { unmount } = render(
        <TaskItem
          task={{ ...mockTask, priority }}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })
})
