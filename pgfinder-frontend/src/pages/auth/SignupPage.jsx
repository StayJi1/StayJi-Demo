import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/common/Card'

function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedRole = searchParams.get('role') === 'vendor' ? 'vendor' : null
  const { signup, status, error, isAuthenticated, role } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: requestedRole || 'user' })

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/dashboard/${role || 'user'}`, { replace: true })
    }
  }, [isAuthenticated, navigate, role])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
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
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
            {requestedRole ? (
              <div className="rounded-3xl border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-100">
                Creating a vendor account for listing PGs.
              </div>
            ) : (
              <input type="hidden" name="role" value="user" />
            )}
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button type="submit" className="w-full">{status === 'loading' ? 'Creating account…' : 'Create account'}</Button>
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
