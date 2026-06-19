'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Input } from '@/components/ui/Input'
import { updateProfile, changePassword, deleteAccount } from '@/lib/api'

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth()
  const toast = useToast()

  // Profile state
  const [name, setName] = useState(user?.name ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setSavingProfile(true)
    try {
      await updateProfile(name.trim())
      await refreshUser()
      toast.addToast('Profile updated', 'success')
    } catch (err: any) {
      setProfileError(err?.message ?? 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.addToast('Password changed', 'success')
    } catch (err: any) {
      setPasswordError(err?.message ?? 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteAccount(deletePassword)
      toast.addToast('Account deleted', 'success')
      logout()
    } catch (err: any) {
      setDeleteError(err?.message ?? 'Failed to delete account')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div data-testid="settings-page" className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary" data-testid="page-heading">
          Settings
        </h1>
        <p className="text-sm text-text-muted mt-1">Manage your profile and account</p>
      </div>

      {/* Profile Section */}
      <section className="mb-8 p-6 bg-surface rounded-xl border border-border">
        <h2 className="text-base font-semibold text-text-primary mb-4">Profile</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <div className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-text-primary text-sm">
              {user?.email ?? ''}
            </div>
            <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={100}
              required
              className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          {profileError && <ErrorMessage message={profileError} />}
          <button
            type="submit"
            disabled={savingProfile || name.trim().length < 2}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingProfile ? 'Saving...' : 'Save'}
          </button>
        </form>
      </section>

      {/* Password Section */}
      <section className="mb-8 p-6 bg-surface rounded-xl border border-border">
        <h2 className="text-base font-semibold text-text-primary mb-4">Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          {passwordError && <ErrorMessage message={passwordError} />}
          <button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {changingPassword ? 'Changing...' : 'Change password'}
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="p-6 bg-surface rounded-xl border border-danger/20">
        <h2 className="text-base font-semibold text-danger mb-2">Danger zone</h2>
        <p className="text-sm text-text-muted mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        {deleteError && <ErrorMessage message={deleteError} />}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 bg-danger text-white text-sm font-medium rounded-lg hover:bg-danger/90 transition-colors"
        >
          Delete account
        </button>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete account"
          message="This action is permanent and cannot be undone. All your data will be permanently deleted."
          confirmLabel="Delete my account"
          variant="danger"
          onConfirm={handleDeleteAccount}
          onCancel={() => {
            setShowDeleteConfirm(false)
            setDeletePassword('')
            setDeleteError(null)
          }}
        >
          <div className="mt-4">
            <Input
              label="Enter your password to confirm"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </ConfirmDialog>
      </section>
    </div>
  )
}
