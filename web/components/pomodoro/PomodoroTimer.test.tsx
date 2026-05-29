import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PomodoroTimer } from './PomodoroTimer'

// ── Hoisted mocks (available in vi.mock factory) ──────────────────────────
const {
  mockStartSession,
  mockCompleteSession,
  mockCancelSession,
  mockResetSession,
  defaultMockReturn,
} = vi.hoisted(() => {
  const startSession = vi.fn<[number?, string?], Promise<void>>()
  const completeSession = vi.fn<[], Promise<void>>()
  const cancelSession = vi.fn<[], Promise<void>>()
  const resetSession = vi.fn()

  return {
    mockStartSession: startSession,
    mockCompleteSession: completeSession,
    mockCancelSession: cancelSession,
    mockResetSession: resetSession,
    defaultMockReturn: {
      activeSession: null,
      sessions: [],
      timeLeft: 0,
      isRunning: false,
      loading: false,
      error: null,
      startSession,
      completeSession,
      cancelSession,
      resetSession,
      refreshSessions: vi.fn(),
    },
  }
})

const runningSession = {
  id: 'session-1',
  userId: 'user-1',
  taskId: undefined,
  duration: 25,
  startedAt: new Date(),
  completedAt: undefined,
  status: 'RUNNING' as const,
}

const completedSession = {
  id: 'session-2',
  userId: 'user-1',
  taskId: undefined,
  duration: 25,
  startedAt: new Date(),
  completedAt: new Date(),
  status: 'COMPLETED' as const,
}

const cancelledSession = {
  id: 'session-3',
  userId: 'user-1',
  taskId: undefined,
  duration: 25,
  startedAt: new Date(),
  completedAt: undefined,
  status: 'CANCELLED' as const,
}

// ── Mock the hook ─────────────────────────────────────────────────────────
vi.mock('@/hooks/usePomodoro', () => ({
  usePomodoro: vi.fn(() => ({ ...defaultMockReturn })),
}))

import { usePomodoro } from '@/hooks/usePomodoro'

// ── Tests ─────────────────────────────────────────────────────────────────
describe('PomodoroTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePomodoro).mockReturnValue({ ...defaultMockReturn })
  })

  // ── 1. Loading state ──────────────────────────────────────────────────
  it('shows loading spinner when loading=true and no session', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      ...defaultMockReturn,
      loading: true,
      activeSession: null,
    })

    const { container } = render(<PomodoroTimer />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(screen.queryByTestId('pomodoro-start-button')).not.toBeInTheDocument()
  })

  // ── 2. No session (idle) ─────────────────────────────────────────────
  it('shows Start Focus button when no session', () => {
    render(<PomodoroTimer />)

    expect(screen.getByTestId('pomodoro-start-button')).toBeInTheDocument()
    expect(screen.getByText('Start Focus')).toBeInTheDocument()
  })

  // ── 3. Running session ───────────────────────────────────────────────
  it('shows timer, Complete and Cancel buttons, and Focusing badge when session is RUNNING', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      ...defaultMockReturn,
      activeSession: runningSession,
      timeLeft: 1_500_000, // 25:00
      isRunning: true,
    })

    render(<PomodoroTimer />)

    // Timer display
    expect(screen.getByText('25:00')).toBeInTheDocument()

    // Status badge
    const status = screen.getByTestId('pomodoro-status')
    expect(status).toBeInTheDocument()
    expect(status).toHaveTextContent('Focusing')

    // Control buttons
    expect(screen.getByTestId('pomodoro-complete-button')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
    expect(screen.getByTestId('pomodoro-cancel-button')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()

    // Start button should NOT be present
    expect(screen.queryByTestId('pomodoro-start-button')).not.toBeInTheDocument()
  })

  // ── 4. Completed session ─────────────────────────────────────────────
  it('shows New Session button and COMPLETED badge when session is COMPLETED', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      ...defaultMockReturn,
      activeSession: completedSession,
      timeLeft: 0,
    })

    render(<PomodoroTimer />)

    const status = screen.getByTestId('pomodoro-status')
    expect(status).toHaveTextContent('COMPLETED')

    expect(screen.getByTestId('pomodoro-new-session-button')).toBeInTheDocument()
    expect(screen.getByText('New Session')).toBeInTheDocument()

    expect(screen.queryByTestId('pomodoro-start-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pomodoro-complete-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pomodoro-cancel-button')).not.toBeInTheDocument()
  })

  // ── 5. Cancelled session ─────────────────────────────────────────────
  it('shows New Session button and CANCELLED badge when session is CANCELLED', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      ...defaultMockReturn,
      activeSession: cancelledSession,
      timeLeft: 0,
    })

    render(<PomodoroTimer />)

    const status = screen.getByTestId('pomodoro-status')
    expect(status).toHaveTextContent('CANCELLED')

    expect(screen.getByTestId('pomodoro-new-session-button')).toBeInTheDocument()

    expect(screen.queryByTestId('pomodoro-start-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pomodoro-complete-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pomodoro-cancel-button')).not.toBeInTheDocument()
  })

  // ── 6. Error state ───────────────────────────────────────────────────
  it('shows error message when error is set', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      ...defaultMockReturn,
      error: 'Something went wrong',
    })

    render(<PomodoroTimer />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  // ── 7. Start Focus click ─────────────────────────────────────────────
  it('calls startSession(25, undefined) when Start Focus is clicked', async () => {
    const user = userEvent.setup()

    render(<PomodoroTimer />)

    await user.click(screen.getByTestId('pomodoro-start-button'))

    expect(mockStartSession).toHaveBeenCalledTimes(1)
    expect(mockStartSession).toHaveBeenCalledWith(25, undefined)
  })

  // ── 8. Complete click ────────────────────────────────────────────────
  it('calls completeSession and onSessionComplete when Complete is clicked', async () => {
    const onSessionComplete = vi.fn()
    const user = userEvent.setup()

    vi.mocked(usePomodoro).mockReturnValue({
      ...defaultMockReturn,
      activeSession: runningSession,
      timeLeft: 1_200_000,
      isRunning: true,
    })

    render(<PomodoroTimer onSessionComplete={onSessionComplete} />)

    await user.click(screen.getByTestId('pomodoro-complete-button'))

    expect(mockCompleteSession).toHaveBeenCalledTimes(1)
    expect(onSessionComplete).toHaveBeenCalledTimes(1)
  })

  // ── 9. Cancel click ──────────────────────────────────────────────────
  it('calls cancelSession when Cancel is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(usePomodoro).mockReturnValue({
      ...defaultMockReturn,
      activeSession: runningSession,
      timeLeft: 1_200_000,
      isRunning: true,
    })

    render(<PomodoroTimer />)

    await user.click(screen.getByTestId('pomodoro-cancel-button'))

    expect(mockCancelSession).toHaveBeenCalledTimes(1)
  })

  // ── 10. New Session click ────────────────────────────────────────────
  it('calls resetSession and onSessionComplete when New Session is clicked', async () => {
    const onSessionComplete = vi.fn()
    const user = userEvent.setup()

    vi.mocked(usePomodoro).mockReturnValue({
      ...defaultMockReturn,
      activeSession: completedSession,
      timeLeft: 0,
    })

    render(<PomodoroTimer onSessionComplete={onSessionComplete} />)

    await user.click(screen.getByTestId('pomodoro-new-session-button'))

    expect(mockResetSession).toHaveBeenCalledTimes(1)
    expect(onSessionComplete).toHaveBeenCalledTimes(1)
  })

  // ── 11. With taskId ──────────────────────────────────────────────────
  it('passes taskId to startSession when taskId prop is provided', async () => {
    const user = userEvent.setup()

    render(<PomodoroTimer taskId="task-123" />)

    await user.click(screen.getByTestId('pomodoro-start-button'))

    expect(mockStartSession).toHaveBeenCalledWith(25, 'task-123')
  })
})
