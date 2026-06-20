import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/common/Card'
import authService from '../../services/authService'
import SEO from '../../components/SEO'

function LoginPage({ portal = 'public' }) {
  const navigate = useNavigate()
  const { login, status, error, isAuthenticated, role } = useAuth()
  const isAdminPortal = portal === 'admin'
  const [form, setForm] = useState({ email: '', password: '', role: isAdminPortal ? 'admin' : 'user', acceptPolicy: false })
  const [resetOpen, setResetOpen] = useState(false)
  const [resetForm, setResetForm] = useState({ email: '', otp: '', password: '' })
  const [resetStep, setResetStep] = useState('email')
  const [resetMessage, setResetMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/dashboard/${role || 'user'}`, { replace: true })
    }
  }, [isAuthenticated, navigate, role])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const normalizeRole = (value) => {
    const rawRole = value?.toString().toLowerCase() || 'user'
    if (['owner', 'host', 'hostel', 'vendor'].includes(rawRole)) return 'owner'
    if (['personal', 'student'].includes(rawRole)) return 'user'
    return rawRole
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.acceptPolicy) return
    try {
      const response = await login(form)
      const rawRole = response.user?.role || response.user?.userType?.toLowerCase() || form.role
      const actualRole = normalizeRole(rawRole)
      navigate(`/dashboard/${actualRole}`, { replace: true })
    } catch {
      // handled in context
    }
  }

  const requestReset = async () => {
    try {
      setResetMessage('')
      await authService.requestPasswordReset({ email: resetForm.email || form.email })
      setResetStep('otp')
      setResetMessage('If the email exists, a verification code has been sent.')
    } catch (err) {
      setResetMessage(err?.message || 'Unable to start password reset.')
    }
  }

  const completeReset = async () => {
    try {
      setResetMessage('')
      await authService.resetPasswordWithOtp({ email: resetForm.email || form.email, otp: resetForm.otp, password: resetForm.password })
      setResetOpen(false)
      setResetStep('email')
      setResetMessage('')
    } catch (err) {
      setResetMessage(err?.message || 'Unable to reset password.')
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-108px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {isAdminPortal ? <SEO noindex title="Admin Login" description="Restricted StayJi governance login." path="/admin-login" schema={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Restricted Login' }} /> : null}
      <Card className="w-full max-w-xl">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">{isAdminPortal ? 'Admin portal' : 'Welcome back'}</p>
          <h1 className="text-3xl font-semibold text-white">{isAdminPortal ? 'Admin login' : 'Login to your account'}</h1>
          <p className="text-slate-400">{isAdminPortal ? 'Restricted StayJi governance access. This route is hidden from public navigation and SEO.' : 'Access your dashboard, manage properties, and book visits in one place.'}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4">
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
            {!isAdminPortal ? <label className="block text-sm font-medium text-slate-200">
              Account type
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-brand-500"
              >
                <option value="user">Student / User</option>
                <option value="owner">Owner</option>
              </select>
            </label> : (
              <input type="hidden" name="role" value={form.role} />
            )}
          </div>
          <label className="flex items-start gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <input type="checkbox" name="acceptPolicy" checked={form.acceptPolicy} onChange={handleChange} required className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
            <span>I agree to StayJi <Link to="/terms-and-conditions" className="text-accent-300 hover:text-white">Terms & Conditions</Link> and <Link to="/privacy-policy" className="text-accent-300 hover:text-white">Privacy Policy</Link>.</span>
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button type="submit" className="w-full">{status === 'loading' ? 'Signing in…' : 'Continue'}</Button>
          <button type="button" onClick={() => setResetOpen((current) => !current)} className="w-full text-center text-sm text-accent-300 hover:text-white">
            Forgot email/password?
          </button>
          {resetOpen ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="grid gap-3">
                <Input label="Registered email" type="email" name="resetEmail" value={resetForm.email} onChange={(event) => setResetForm((current) => ({ ...current, email: event.target.value }))} />
                {resetStep === 'otp' ? (
                  <>
                    <Input label="Verification code" name="otp" value={resetForm.otp} onChange={(event) => setResetForm((current) => ({ ...current, otp: event.target.value }))} />
                    <Input label="New password" type="password" name="newPassword" value={resetForm.password} onChange={(event) => setResetForm((current) => ({ ...current, password: event.target.value }))} />
                  </>
                ) : null}
                <Button type="button" variant="secondary" onClick={resetStep === 'otp' ? completeReset : requestReset}>
                  {resetStep === 'otp' ? 'Reset password' : 'Send verification code'}
                </Button>
                {resetMessage ? <p className="text-sm text-emerald-300">{resetMessage}</p> : null}
              </div>
            </div>
          ) : null}
          <p className="text-center text-sm text-slate-400">
            New to StayJi?{' '}
            <Link to="/signup" className="text-accent-300 hover:text-white">
              Create an account
            </Link>
          </p>
        </form>
      </Card>
    </div>
  )
}

export default LoginPage
