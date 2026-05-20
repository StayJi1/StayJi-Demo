import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'

function UserProfilePage() {
  const { user, updateProfile, status, error } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    occupation: '',
    gender: '',
  })
  const [success, setSuccess] = useState(null)

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
    try {
      await updateProfile({
        userFname: form.firstName,
        userLname: form.lastName,
        userEmail: form.email,
        contact: form.contact,
        occupation: form.occupation,
        gender: form.gender,
      })
      setSuccess('Profile updated successfully.')
    } catch {
      setSuccess(null)
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
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              />
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

          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Button type="submit" className="w-full">
            {status === 'loading' ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default UserProfilePage
