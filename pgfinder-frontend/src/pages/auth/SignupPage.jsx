import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/common/Card'

function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedRole = searchParams.get('role') === 'vendor' ? 'vendor' : null
  const { signup, googleSignup, status, error, isAuthenticated, role } = useAuth()
  const googleButtonRef = useRef(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [form, setForm] = useState({ name: '', contact: '', email: '', password: '', role: requestedRole || 'user' })
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/dashboard/${role || 'user'}`, { replace: true })
    }
  }, [isAuthenticated, navigate, role])

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return undefined

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setLocalError('')
          if (!form.contact.trim()) {
            setLocalError('Enter your phone number before continuing with Google.')
            return
          }
          try {
            const response = await googleSignup({ credential, contact: form.contact, role: form.role })
            navigate(`/dashboard/${response.user?.role || form.role}`)
          } catch {
            // handled in context
          }
        },
      })
      googleButtonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleButtonRef.current.offsetWidth || 320,
      })
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton()
      return undefined
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = renderGoogleButton
    document.head.appendChild(script)

    return () => {
      script.onload = null
    }
  }, [googleClientId, googleSignup, form.contact, form.role, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')
    if (!form.contact.trim()) {
      setLocalError('Phone number is required to create an account.')
      return
    }
    try {
      const response = await signup(form)
      navigate(`/dashboard/${response.user?.role || form.role}`)
    } catch {
      // handled in context
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-108px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Get started</p>
          <h1 className="text-3xl font-semibold text-white">Create your account</h1>
          <p className="text-slate-400">Join as a student or vendor and manage listings with a premium dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4">
            <Input label="Full name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="Phone number" name="contact" value={form.contact} onChange={handleChange} required />
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
            {requestedRole ? (
              <div className="rounded-3xl border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-100">
                Creating a vendor account for listing stays on StayJi.
              </div>
            ) : (
              <label className="block text-sm text-slate-200">
                Account type
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
                >
                  <option value="user">Student / User</option>
                  <option value="vendor">Host / Vendor</option>
                </select>
              </label>
            )}
          </div>
          {localError || error ? <p className="text-sm text-rose-300">{localError || error}</p> : null}
          <Button type="submit" className="w-full">{status === 'loading' ? 'Creating account…' : 'Create account'}</Button>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              or
              <span className="h-px flex-1 bg-slate-800" />
            </div>
            {googleClientId ? (
              <div ref={googleButtonRef} className="min-h-10 w-full overflow-hidden rounded-3xl" />
            ) : (
              <p className="rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-center text-sm text-slate-400">
                Google signup is ready once `VITE_GOOGLE_CLIENT_ID` and backend `GOOGLE_CLIENT_ID` are configured.
              </p>
            )}
          </div>
          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-300 hover:text-white">
              Log in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}

export default SignupPage
