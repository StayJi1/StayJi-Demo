import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/common/Card'
import axiosClient from '../../api/axiosClient'
import { MVP_CITY, MVP_STATE } from '../../config/mvp'

const CITY_OPTIONS = {
  [MVP_STATE]: [MVP_CITY],
}

const formStorageKey = 'stayji-signup-form'

const readStoredSignupForm = (requestedRole) => {
  const fallback = { name: '', contact: '', email: '', password: '', role: requestedRole || 'user', state: MVP_STATE, city: MVP_CITY, acceptTerms: false, acceptPrivacy: false }
  try {
    const saved = JSON.parse(sessionStorage.getItem(formStorageKey) || '{}')
    if (!saved || typeof saved !== 'object') return fallback
    return {
      ...fallback,
      ...saved,
      role: requestedRole || saved.role || fallback.role,
      acceptTerms: Boolean(saved.acceptTerms),
      acceptPrivacy: Boolean(saved.acceptPrivacy),
    }
  } catch {
    return fallback
  }
}

function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedRole = ['owner', 'vendor'].includes(searchParams.get('role')) ? 'owner' : null
  const { signup, googleSignup, status, error, isAuthenticated, role } = useAuth()
  const googleButtonRef = useRef(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [form, setForm] = useState(() => readStoredSignupForm(requestedRole))
  const [localError, setLocalError] = useState('')
  const [cityOptions, setCityOptions] = useState(CITY_OPTIONS)
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('')

  useEffect(() => {
    axiosClient.get('/client/city-options')
      .then((res) => {
        const options = res.data?.data?.options
        if (options && Object.keys(options).length) {
          setCityOptions(options)
          setForm((current) => {
            const state = options[current.state] ? current.state : Object.keys(options)[0]
            const city = options[state]?.includes(current.city) ? current.city : options[state]?.[0] || ''
            return { ...current, state, city }
          })
        }
      })
      .catch(() => setCityOptions(CITY_OPTIONS))
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/dashboard/${role || 'user'}`, { replace: true })
    }
  }, [isAuthenticated, navigate, role])

  useEffect(() => {
    sessionStorage.setItem(formStorageKey, JSON.stringify(form))
  }, [form])

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return undefined

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setLocalError('')
          if (!form.contact.trim()) {
            setPendingGoogleCredential(credential)
            setLocalError('Enter your phone number to finish Google signup.')
            return
          }
          if (!form.acceptTerms || !form.acceptPrivacy) {
            setLocalError('Accept StayJi Terms & Conditions and Privacy Policy before continuing with Google.')
            return
          }
          try {
            const response = await googleSignup({ credential, contact: form.contact, role: form.role, state: form.state, city: form.city, acceptTerms: form.acceptTerms, acceptPrivacy: form.acceptPrivacy })
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
  }, [googleClientId, googleSignup, form.contact, form.role, form.state, form.city, form.acceptTerms, form.acceptPrivacy, navigate])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value }
      if (name === 'state') next.city = cityOptions[value]?.[0] || ''
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')
    if (!form.contact.trim()) {
      setLocalError('Phone number is required to create an account.')
      return
    }
    if (!form.acceptTerms || !form.acceptPrivacy) {
      setLocalError('Accept StayJi Terms & Conditions and Privacy Policy to continue.')
      return
    }
    if (form.role === 'owner' && (!form.state || !form.city)) {
      setLocalError('Select your operating state and city to create an Owner account.')
      return
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
      setLocalError('Use a stronger password with 8+ characters, uppercase, lowercase, and a number.')
      return
    }
    try {
      const response = await signup(form)
      sessionStorage.removeItem(formStorageKey)
      navigate(`/dashboard/${response.user?.role || form.role}`)
    } catch {
      // handled in context
    }
  }

  const completeGoogleSignup = async () => {
    setLocalError('')
    if (!pendingGoogleCredential) return
    if (!form.contact.trim()) {
      setLocalError('Phone number is required to finish Google signup.')
      return
    }
    if (!form.acceptTerms || !form.acceptPrivacy) {
      setLocalError('Accept StayJi Terms & Conditions and Privacy Policy before continuing with Google.')
      return
    }
    try {
      const response = await googleSignup({ credential: pendingGoogleCredential, contact: form.contact, role: form.role, state: form.state, city: form.city, acceptTerms: form.acceptTerms, acceptPrivacy: form.acceptPrivacy })
      setPendingGoogleCredential('')
      sessionStorage.removeItem(formStorageKey)
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
          <p className="text-slate-400">Join as a user or owner and manage listings with a premium dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4">
            <Input label="Full name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="Phone number" name="contact" value={form.contact} onChange={handleChange} required />
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
            {requestedRole ? (
              <div className="rounded-3xl border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-100">
                Creating an Owner account for listing stays on StayJi. Admin approval is required before property activation.
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
                  <option value="owner">Owner</option>
                </select>
              </label>
            )}
            {form.role === 'owner' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-200">
                  State
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
                  >
                    {Object.keys(cityOptions).map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                </label>
                <label className="block text-sm text-slate-200">
                  City
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
                  >
                    {(cityOptions[form.state] || []).map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <label className="flex items-start gap-3">
              <input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={handleChange} required className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
              <span>I agree to StayJi <Link to="/terms-and-conditions" className="text-accent-300 hover:text-white">Terms & Conditions</Link>.</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="acceptPrivacy" checked={form.acceptPrivacy} onChange={handleChange} required className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
              <span>I agree to the <Link to="/privacy-policy" className="text-accent-300 hover:text-white">Privacy Policy</Link>.</span>
            </label>
          </div>
          {localError || error ? <p className="text-sm text-rose-300">{localError || error}</p> : null}
          <Button type="submit" className="w-full">{status === 'loading' ? 'Creating account…' : 'Create account'}</Button>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              or
              <span className="h-px flex-1 bg-slate-800" />
            </div>
            {pendingGoogleCredential ? (
              <div className="grid gap-3 rounded-3xl border border-accent-500/40 bg-accent-500/10 p-4">
                <p className="text-sm text-accent-100">Google verified your email. Add your phone number to complete the account.</p>
                <Input label="Phone number" name="contact" value={form.contact} onChange={handleChange} required />
                <Button type="button" variant="secondary" onClick={completeGoogleSignup} disabled={status === 'loading'}>
                  {status === 'loading' ? 'Finishing signup...' : 'Finish Google signup'}
                </Button>
              </div>
            ) : null}
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
