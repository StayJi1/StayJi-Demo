import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/common/Card'
import authService from '../../services/authService'

function LoginPage() {
  const navigate = useNavigate()
  const { login, status, error, isAuthenticated, role } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', role: 'user' })
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
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const normalizeRole = (value) => {
    const rawRole = value?.toString().toLowerCase() || 'user'
    if (['owner', 'host', 'hostel'].includes(rawRole)) return 'vendor'
    if (['personal', 'student'].includes(rawRole)) return 'user'
    return rawRole
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
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
      <Card className="w-full max-w-xl">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Welcome back</p>
          <h1 className="text-3xl font-semibold text-white">Login to your account</h1>
          <p className="text-slate-400">Access your dashboard, manage properties, and book visits in one place.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4">
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
            <label className="block text-sm font-medium text-slate-200">
              Account type
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-brand-500"
              >
                <option value="user">Student / User</option>
                <option value="vendor">Host / Vendor</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
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
