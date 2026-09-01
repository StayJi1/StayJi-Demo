import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import authService from '../../../services/authService'

function UserProfilePage() {
  const { user, updateProfile, status, error, logout } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    occupation: '',
    gender: '',
    dob: '',
    bio: '',
    city: '',
    socialLinks: '',
  })
  const [success, setSuccess] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    if (user) {
      window.setTimeout(() => {
        setForm({
          firstName: user.firstName || user.userFname || '',
          lastName: user.lastName || user.userLname || '',
          email: user.userEmail || user.email || '',
          contact: user.contact || '',
          occupation: user.occupation || '',
          gender: user.gender || '',
          dob: user.dob || '',
          bio: user.bio || '',
          city: user.city || '',
          socialLinks: Array.isArray(user.socialLinks) ? user.socialLinks.join('\n') : '',
        })
      }, 0)
    }
  }, [user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const cleanContact = form.contact.replace(/\D/g, '')
    if (cleanContact && !/^[6-9]\d{9}$/.test(cleanContact)) {
      setSuccess('Enter a valid 10 digit Indian mobile number.')
      return
    }
    try {
      await updateProfile({
        userFname: form.firstName,
        userLname: form.lastName,
        contact: cleanContact,
        occupation: form.occupation,
        gender: form.gender,
        dob: form.dob,
        bio: form.bio,
        city: form.city,
        socialLinks: form.socialLinks,
      })
      setSuccess('Profile updated successfully.')
    } catch {
      setSuccess(null)
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    setPasswordMessage('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('New password and confirm password do not match.')
      return
    }
    try {
      await authService.changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage('Password changed. Please login again.')
      window.setTimeout(logout, 800)
    } catch (err) {
      setPasswordMessage(err?.message || 'Unable to change password.')
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-[1.5rem] border border-slate-800/80 bg-surface-800/90 p-5 shadow-card sm:rounded-[2rem] sm:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">My profile</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Update your account details</h1>
        </div>
      </header>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">First name</span>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
            </label>
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Last name</span>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                readOnly
                className="w-full cursor-not-allowed rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-400 outline-none"
              />
              <span className="mt-2 block text-xs text-slate-500">Email cannot be changed. Contact admin support.</span>
            </label>
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Contact</span>
              <input
                type="tel"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Date of birth</span>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20" />
            </label>
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">City</span>
              <input type="text" name="city" value={form.city} onChange={handleChange} className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20" />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Occupation</span>
              <input
                type="text"
                name="occupation"
                value={form.occupation}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
            </label>
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Gender</span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Co-ed">Co-ed</option>
              </select>
            </label>
          </div>

          <label className="block text-sm text-slate-200">
            <span className="mb-2 block text-slate-300">Bio / about</span>
            <textarea name="bio" rows="4" value={form.bio} onChange={handleChange} className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20" />
          </label>

          <label className="block text-sm text-slate-200">
            <span className="mb-2 block text-slate-300">Social links</span>
            <textarea name="socialLinks" rows="3" value={form.socialLinks} onChange={handleChange} placeholder="One link per line" className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20" />
          </label>

          {success ? <p className={`text-sm ${success.startsWith('Enter') ? 'text-rose-300' : 'text-emerald-300'}`}>{success}</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Button type="submit" className="w-full">
            {status === 'loading' ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>

      {!user?.isDummy ? (
        <Card className="p-8">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Password</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Update login password</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <input type="password" value={passwordForm.oldPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))} placeholder="Current password" className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} placeholder="New password" className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
              <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Confirm new password" className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
            </div>
            {passwordMessage ? <p className={`text-sm ${passwordMessage.startsWith('Password changed') ? 'text-emerald-300' : 'text-rose-300'}`}>{passwordMessage}</p> : null}
            <Button type="submit" disabled={!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}>
              Change password
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Password</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Shared demo account</h2>
            <p className="mt-2 text-sm text-slate-400">Password changes are disabled for shared demo accounts to keep them usable for multiple visitors.</p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default UserProfilePage
