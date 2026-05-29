import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from './TaskList'
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

const mockTasks: Task[] = [
  mockTask,
  { ...mockTask, id: 'task-2', title: 'Second task' },
]

describe('TaskList', () => {
  it('renders TaskForm component', () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    )

    expect(screen.getByTestId('task-input')).toBeInTheDocument()
    expect(screen.getByTestId('task-add-button')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading is true', () => {
    const { container } = render(
      <TaskList
        tasks={[]}
        loading={true}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    )

    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('does not show empty message when loading is true', () => {
    render(
      <TaskList
        tasks={[]}
        loading={true}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    )

    expect(screen.queryByText('No tasks here yet')).not.toBeInTheDocument()
  })

  it('shows default empty message when tasks array is empty', () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    )

    expect(screen.getByText('No tasks here yet')).toBeInTheDocument()
  })

  it('shows custom emptyMessage when provided', () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        emptyMessage="Nothing to do!"
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    )

    expect(screen.getByText('Nothing to do!')).toBeInTheDocument()
  })

  it('renders TaskItem components for each task', () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    )

    expect(screen.getByTestId('task-item-task-1')).toBeInTheDocument()
    expect(screen.getByTestId('task-item-task-2')).toBeInTheDocument()
    expect(screen.getByText('Test task')).toBeInTheDocument()
    expect(screen.getByText('Second task')).toBeInTheDocument()
  })

  it('does not show empty message when tasks are present', () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    )

    expect(screen.queryByText('No tasks here yet')).not.toBeInTheDocument()
  })

  it('passes onToggleTask callback to TaskItem', async () => {
    const onToggleTask = vi.fn()
    const user = userEvent.setup()

    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onAddTask={vi.fn()}
        onToggleTask={onToggleTask}
        onDeleteTask={vi.fn()}
      />,
    )

    await user.click(screen.getAllByTestId('task-complete-button')[0])
    expect(onToggleTask).toHaveBeenCalledWith('task-1', false)
  })

  it('passes onDeleteTask callback to TaskItem', async () => {
    const onDeleteTask = vi.fn()
    const user = userEvent.setup()

    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={onDeleteTask}
      />,
    )

    await user.click(screen.getAllByTestId('task-delete-button')[0])
    expect(onDeleteTask).toHaveBeenCalledWith('task-1')
  })

  it('passes onViewDetails callback to TaskItem', async () => {
    const onViewDetails = vi.fn()
    const user = userEvent.setup()

    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onViewDetails={onViewDetails}
      />,
    )

    await user.click(screen.getAllByTestId('task-item-content')[0])
    expect(onViewDetails).toHaveBeenCalledWith('task-1')
  })

  it('passes onAddTask callback to TaskForm', async () => {
    const onAddTask = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onAddTask={onAddTask}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    )

    await user.type(screen.getByTestId('task-input'), 'New list task')
    await user.click(screen.getByTestId('task-add-button'))

    expect(onAddTask).toHaveBeenCalledTimes(1)
    expect(onAddTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New list task' }),
    )
  })

  it('passes defaultDueDate to TaskForm', async () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
        defaultDueDate="2026-05-15"
      />,
    )

    const input = screen.getByTestId('task-input')
    input.focus()

    await expect(screen.findByDisplayValue('2026-05-15')).resolves.toBeInTheDocument()
  })
})
