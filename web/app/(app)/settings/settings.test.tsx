import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '@/app/(app)/settings/page'

// Mock Next.js Link (used by child components indirectly)
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={props.href} {...props}>{children}</a>
  ),
}))

// Mock AuthContext
const mockRefreshUser = vi.fn()
const mockLogout = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    loading: false,
    refreshUser: mockRefreshUser,
    logout: mockLogout,
  }),
}))

// Mock Toast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}))

// Mock API functions
const mockUpdateProfile = vi.fn()
const mockChangePassword = vi.fn()
const mockDeleteAccount = vi.fn()
vi.mock('@/lib/api', () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  changePassword: (...args: unknown[]) => mockChangePassword(...args),
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Profile and Password sections', () => {
    render(<SettingsPage />)

    // Page heading
    expect(screen.getByTestId('page-heading')).toHaveTextContent('Settings')

    // Profile section
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()

    // Password section
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument()
  })

  it('renders Delete Account button', () => {
    render(<SettingsPage />)

    expect(screen.getByRole('button', { name: 'Delete account' })).toBeInTheDocument()
  })

  it('calls updateProfile on form submit', async () => {
    const user = userEvent.setup()
    mockUpdateProfile.mockResolvedValueOnce({ id: 'user-1', name: 'Updated Name', email: 'test@example.com' })

    render(<SettingsPage />)

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Name')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(mockUpdateProfile).toHaveBeenCalledWith('Updated Name')
    expect(mockRefreshUser).toHaveBeenCalled()
  })

  it('shows error when updateProfile fails', async () => {
    const user = userEvent.setup()
    mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'))

    render(<SettingsPage />)

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Update failed')).toBeInTheDocument()
  })

  it('calls changePassword on password form submit', async () => {
    const user = userEvent.setup()
    mockChangePassword.mockResolvedValueOnce({ message: 'Password changed' })

    render(<SettingsPage />)

    // Find password inputs within the Password section
    const passwordSection = screen.getByText('Password').closest('section')!
    const inputs = passwordSection.querySelectorAll('input[type="password"]')
    expect(inputs.length).toBeGreaterThanOrEqual(3)

    await user.type(inputs[0], 'oldPass123')
    await user.type(inputs[1], 'newPass123')
    await user.type(inputs[2], 'newPass123')

    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(mockChangePassword).toHaveBeenCalledWith('oldPass123', 'newPass123')
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(<SettingsPage />)

    const passwordSection = screen.getByText('Password').closest('section')!
    const inputs = passwordSection.querySelectorAll('input[type="password"]')

    await user.type(inputs[0], 'oldPass123')
    await user.type(inputs[1], 'newPass123')
    await user.type(inputs[2], 'differentPass')

    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  it('shows confirm dialog when Delete account is clicked and calls deleteAccount on confirm', async () => {
    const user = userEvent.setup()
    mockDeleteAccount.mockResolvedValueOnce({ message: 'Account deleted' })

    render(<SettingsPage />)

    await user.click(screen.getByRole('button', { name: 'Delete account' }))

    // Confirm dialog should appear
    const dialog = screen.getByTestId('confirm-dialog')
    expect(dialog).toBeInTheDocument()

    // Type password into the dialog's password input
    const dialogPasswordInput = dialog.querySelector('input[type="password"]')!
    await user.type(dialogPasswordInput, 'myPassword')

    // Click confirm within the dialog
    await user.click(within(dialog).getByRole('button', { name: 'Delete my account' }))

    expect(mockDeleteAccount).toHaveBeenCalledWith('myPassword')
    expect(mockLogout).toHaveBeenCalled()
  })
})
