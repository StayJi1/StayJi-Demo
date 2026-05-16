import { useState } from 'react'
import { FiUpload } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Card from '../../../components/common/Card'
import { useAuth } from '../../../context/AuthContext'
import propertyService from '../../../services/propertyService'

function AddPropertyPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '',
    city: '',
    area: '',
    address: '',
    rent: '',
    sharing: '',
    gender: 'Co-ed',
    foodIncluded: false,
    description: '',
    imageUrl: '',
  })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!user?._id) {
      setMessage('Please login again before adding a property.')
      return
    }

    const payload = new FormData()
    payload.append('userIDFK', user._id)
    payload.append('propertyName', form.name)
    payload.append('description', form.description)
    payload.append('address', form.address || `${form.area}, ${form.city}`)
    payload.append('rent', form.rent)
    payload.append('sharing', form.sharing)
    payload.append('genderType', form.gender)
    payload.append('areaName', form.area)
    payload.append('cityName', form.city)
    payload.append('aminityFeatures', form.foodIncluded ? 'WiFi, Meals, Laundry, Security' : 'WiFi, Laundry, Security')
    payload.append('propertyImage', form.imageUrl)

    setStatus('loading')
    setMessage('')
    try {
      await propertyService.createProperty(payload)
      setForm({
        name: '',
        city: '',
        area: '',
        address: '',
        rent: '',
        sharing: '',
        gender: 'Co-ed',
        foodIncluded: false,
        description: '',
        imageUrl: '',
      })
      setMessage('Property added successfully.')
      setStatus('success')
    } catch (error) {
      setMessage(error.message || 'Unable to add property.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">New listing</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Add a PG or hostel property</h1>
        </div>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Property name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="City" name="city" value={form.city} onChange={handleChange} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Area / locality" name="area" value={form.area} onChange={handleChange} required />
            <Input label="Address" name="address" value={form.address} onChange={handleChange} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Monthly rent" name="rent" type="number" value={form.rent} onChange={handleChange} required />
            <Input label="Sharing type" name="sharing" value={form.sharing} onChange={handleChange} placeholder="2BHK, 3 sharing" required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Gender type</span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              >
                <option value="Co-ed">Co-ed</option>
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm text-slate-200">
              <input type="checkbox" name="foodIncluded" checked={form.foodIncluded} onChange={handleChange} className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
              Food included
            </label>
          </div>
          <label className="block text-sm text-slate-200">
            <span className="mb-2 block text-slate-300">Description</span>
            <textarea
              name="description"
              rows="5"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
            />
          </label>
          <div className="rounded-[1.75rem] border border-dashed border-slate-800/70 bg-slate-950/80 p-6 text-slate-300">
            <div className="flex items-center gap-4">
              <FiUpload className="h-6 w-6 text-accent-400" />
              <div>
                <p className="font-semibold text-white">Property photo URL</p>
                <p className="text-sm text-slate-400">Paste an image URL for now; file upload can be added later.</p>
              </div>
            </div>
            <div className="mt-5">
              <Input label="Image URL" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://images.unsplash.com/..." />
            </div>
          </div>
          {message ? (
            <p className={`text-sm ${status === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>
          ) : null}
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Saving property…' : 'Save property'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default AddPropertyPage
