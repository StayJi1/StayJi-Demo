import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiUpload } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Card from '../../../components/common/Card'
import { useAuth } from '../../../context/AuthContext'
import propertyService from '../../../services/propertyService'

function AddPropertyPage() {
  const { user } = useAuth()
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(propertyId)
  const [form, setForm] = useState({
    name: '',
    propertyCategory: 'PG',
    city: '',
    area: '',
    address: '',
    latitude: '',
    longitude: '',
    rent: '',
    depositAmount: '',
    availableBeds: '',
    vacancyStatus: 'Available now',
    availableFrom: '',
    sharingAvailability: '',
    parkingAvailable: false,
    acAvailable: false,
    dailyRate: '',
    perDayCheckIn: false,
    sharing: '',
    gender: 'Co-ed',
    mealsAvailable: [],
    menuPhotoUrls: '',
    description: '',
    imageUrls: '',
    videoUrl: '',
  })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [videoFile, setVideoFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    const loadProperty = async () => {
      if (!isEditMode || !propertyId) return
      try {
        setLoading(true)
        const property = await propertyService.fetchPropertyById(propertyId, { includePrivate: true })
        setForm({
          name: property.name || '',
          propertyCategory: property.category || property.type || 'PG',
          city: property.city || '',
          area: property.area || '',
          address: property.address || '',
          latitude: property.location?.lat || property.latitude || '',
          longitude: property.location?.lng || property.longitude || '',
          rent: property.rent || '',
          depositAmount: property.depositAmount || '',
          availableBeds: property.availableBeds || '',
          vacancyStatus: property.vacancyStatus || 'Available now',
          availableFrom: property.availableFrom || '',
          sharingAvailability: property.sharingAvailability || '',
          parkingAvailable: Boolean(property.parkingAvailable),
          acAvailable: Boolean(property.acAvailable),
          dailyRate: property.dailyRate || '',
          perDayCheckIn: Boolean(property.perDayCheckIn),
          sharing: property.sharing || '',
          gender: property.gender || 'Co-ed',
          mealsAvailable: property.mealsAvailable || [],
          menuPhotoUrls: (property.menuPhotoUrls || [property.menuPhoto]).filter(Boolean).join('\n'),
          description: property.description || '',
          imageUrls: (property.images || [property.image]).filter(Boolean).join('\n'),
          videoUrl: property.videoUrl || '',
          propertyTypeIDFK: property.propertyTypeIDFK || '',
          isAvailable: property.status !== 'Booked',
        })
      } catch (err) {
        setMessage(err?.message || 'Unable to load property details.')
      } finally {
        setLoading(false)
      }
    }
    loadProperty()
  }, [isEditMode, propertyId])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleMealToggle = (meal) => {
    setForm((current) => ({
      ...current,
      mealsAvailable: current.mealsAvailable.includes(meal)
        ? current.mealsAvailable.filter((item) => item !== meal)
        : [...current.mealsAvailable, meal],
    }))
  }

  const handleImageFiles = (event) => {
    setImageFiles(Array.from(event.target.files || []).slice(0, 10))
  }

  const handleVideoFile = (event) => {
    setVideoFile(event.target.files?.[0] || null)
  }

  const handleFindCoordinates = async () => {
    const address = [form.address, form.area, form.city].filter(Boolean).join(', ')
    if (!address) {
      setMessage('Add an address, area, or city before finding coordinates.')
      setStatus('error')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`)
      const results = await response.json()
      if (!results?.length) {
        setStatus('error')
        setMessage('No map coordinates found for this address.')
        return
      }

      setForm((current) => ({
        ...current,
        latitude: results[0].lat,
        longitude: results[0].lon,
      }))
      setStatus('idle')
      setMessage('Coordinates added from OpenStreetMap.')
    } catch {
      setStatus('error')
      setMessage('Unable to fetch coordinates right now.')
    } finally {
      setLoading(false)
    }
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
    payload.append('latitude', form.latitude)
    payload.append('longitude', form.longitude)
    payload.append('rent', form.rent)
    payload.append('depositAmount', form.depositAmount)
    payload.append('availableBeds', form.availableBeds)
    payload.append('vacancyStatus', form.vacancyStatus)
    payload.append('availableFrom', form.availableFrom)
    payload.append('sharingAvailability', form.sharingAvailability)
    payload.append('parkingAvailable', form.parkingAvailable)
    payload.append('acAvailable', form.acAvailable)
    payload.append('dailyRate', form.dailyRate)
    payload.append('perDayCheckIn', form.perDayCheckIn)
    payload.append('propertyCategory', form.propertyCategory)
    payload.append('pricingUnit', form.perDayCheckIn ? 'month-day' : 'month')
    payload.append('sharing', form.sharing)
    payload.append('genderType', form.gender)
    payload.append('areaName', form.area)
    payload.append('cityName', form.city)
    payload.append('aminityFeatures', form.mealsAvailable.length ? 'WiFi, Meals, Laundry, Security' : 'WiFi, Laundry, Security')
    payload.append('mealsAvailable', JSON.stringify(form.mealsAvailable))
    payload.append('menuPhotoUrls', form.menuPhotoUrls)
    payload.append('menuPhoto', form.menuPhotoUrls.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || '')
    payload.append('propertyImageUrls', form.imageUrls)
    payload.append('propertyImage', form.imageUrls.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || '')
    imageFiles.forEach((file) => payload.append('propertyImage', file))
    if (videoFile) payload.append('video', videoFile)
    payload.append('videoUrl', form.videoUrl)

    setStatus('loading')
    setUploadProgress(imageFiles.length || videoFile ? 35 : 0)
    setMessage('')
    try {
      if (isEditMode && propertyId) {
        await propertyService.updateProperty(propertyId, {
          propertyName: form.name,
          description: form.description,
          address: form.address,
          latitude: form.latitude,
          longitude: form.longitude,
          rent: form.rent,
          depositAmount: form.depositAmount,
          availableBeds: form.availableBeds,
          vacancyStatus: form.vacancyStatus,
          availableFrom: form.availableFrom,
          sharingAvailability: form.sharingAvailability,
          parkingAvailable: form.parkingAvailable,
          acAvailable: form.acAvailable,
          dailyRate: form.dailyRate,
          perDayCheckIn: form.perDayCheckIn,
          propertyCategory: form.propertyCategory,
          pricingUnit: form.perDayCheckIn ? 'month-day' : 'month',
          sharing: form.sharing,
          genderType: form.gender,
          areaName: form.area,
          cityName: form.city,
          aminityFeatures: form.mealsAvailable.length ? 'WiFi, Meals, Laundry, Security' : 'WiFi, Laundry, Security',
          mealsAvailable: form.mealsAvailable,
          menuPhotoUrls: form.menuPhotoUrls,
          menuPhoto: form.menuPhotoUrls.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || '',
          propertyImageUrls: form.imageUrls,
          propertyImage: form.imageUrls.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || '',
          videoUrl: form.videoUrl,
          isAvailable: form.isAvailable,
          propertyTypeIDFK: form.propertyTypeIDFK,
        })
        setMessage('Property updated successfully. Admin approval is required before it appears live.')
      } else {
        await propertyService.createProperty(payload)
        setUploadProgress(100)
        setForm({
          name: '',
          propertyCategory: 'PG',
          city: '',
          area: '',
          address: '',
          latitude: '',
          longitude: '',
          rent: '',
          depositAmount: '',
          availableBeds: '',
          vacancyStatus: 'Available now',
          availableFrom: '',
          sharingAvailability: '',
          parkingAvailable: false,
          acAvailable: false,
          dailyRate: '',
          perDayCheckIn: false,
          sharing: '',
          gender: 'Co-ed',
          mealsAvailable: [],
          menuPhotoUrls: '',
          description: '',
          imageUrls: '',
          videoUrl: '',
          propertyTypeIDFK: '',
          isAvailable: true,
        })
        setImageFiles([])
        setVideoFile(null)
        setMessage('Property submitted successfully. It will go live after admin approval.')
      }
      setStatus('success')
      if (isEditMode) {
        navigate('/dashboard/vendor/properties')
      }
    } catch (error) {
      setMessage(error.message || 'Unable to save property.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-accent-400">New listing</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{isEditMode ? 'Edit property details' : 'Add a stay property'}</h1>
        </div>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Property name" name="name" value={form.name} onChange={handleChange} required />
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Segment</span>
              <select
                name="propertyCategory"
                value={form.propertyCategory}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              >
                <option value="PG">PG</option>
                <option value="Flat">Flat</option>
                <option value="Hotel">Hotel</option>
                <option value="Hostel">Hostel</option>
              </select>
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="City" name="city" value={form.city} onChange={handleChange} required />
            <Input label="Area / locality" name="area" value={form.area} onChange={handleChange} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Address" name="address" value={form.address} onChange={handleChange} required />
            <Input label="Monthly price" name="rent" type="number" value={form.rent} onChange={handleChange} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Input label="Latitude" name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} placeholder="18.5204" />
            <Input label="Longitude" name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} placeholder="73.8567" />
            <button
              type="button"
              onClick={handleFindCoordinates}
              disabled={loading}
              className="rounded-3xl border border-accent-500/60 px-5 py-3 text-sm font-semibold text-accent-200 transition hover:bg-accent-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Find on map
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Deposit amount" name="depositAmount" type="number" value={form.depositAmount} onChange={handleChange} placeholder="Security deposit" />
            <Input label="Sharing type" name="sharing" value={form.sharing} onChange={handleChange} placeholder="2BHK, 3 sharing" required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Beds / rooms available" name="availableBeds" type="number" value={form.availableBeds} onChange={handleChange} placeholder="10" />
            <Input label="Available from" name="availableFrom" type="date" value={form.availableFrom} onChange={handleChange} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Vacancy status</span>
              <select
                name="vacancyStatus"
                value={form.vacancyStatus}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              >
                <option value="Available now">Available now</option>
                <option value="Few beds left">Few beds left</option>
                <option value="Fully occupied">Fully occupied</option>
                <option value="Available from date">Available from date</option>
              </select>
            </label>
            <Input label="Sharing availability" name="sharingAvailability" value={form.sharingAvailability} onChange={handleChange} placeholder="2 double-sharing, 5 single-sharing" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Per-day price" name="dailyRate" type="number" value={form.dailyRate} onChange={handleChange} placeholder="Required for hotels / day stays" />
            <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm text-slate-200">
              <input type="checkbox" name="perDayCheckIn" checked={form.perDayCheckIn} onChange={handleChange} className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
              Allows per-day check-in
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm text-slate-200">
              <input type="checkbox" name="parkingAvailable" checked={form.parkingAvailable} onChange={handleChange} className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
              Parking available
            </label>
            <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm text-slate-200">
              <input type="checkbox" name="acAvailable" checked={form.acAvailable} onChange={handleChange} className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
              AC rooms available
            </label>
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
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm text-slate-200">
              <span className="mb-3 block text-slate-300">Food available</span>
              <div className="flex flex-wrap gap-3">
                {['Breakfast', 'Lunch', 'Dinner'].map((meal) => (
                  <label key={meal} className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={form.mealsAvailable.includes(meal)} onChange={() => handleMealToggle(meal)} className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent-400" />
                    {meal}
                  </label>
                ))}
              </div>
            </div>
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
                <p className="font-semibold text-white">Property photos and video</p>
                <p className="text-sm text-slate-400">Upload from mobile gallery, camera, or desktop. URL fields remain optional.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-5">
              <label className="block rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-5 text-sm text-slate-200">
                <span className="mb-2 block text-slate-300">Upload images</span>
                <input type="file" accept="image/*" capture="environment" multiple onChange={handleImageFiles} className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-accent-500 file:px-4 file:py-2 file:font-semibold file:text-slate-950" />
              </label>
              {imageFiles.length ? (
                <div className="grid gap-3 sm:grid-cols-4">
                  {imageFiles.map((file) => (
                    <img key={`${file.name}-${file.size}`} src={URL.createObjectURL(file)} alt={file.name} className="h-28 w-full rounded-2xl object-cover" />
                  ))}
                </div>
              ) : null}
              <label className="block rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 p-5 text-sm text-slate-200">
                <span className="mb-2 block text-slate-300">Upload room video</span>
                <input type="file" accept="video/*" capture="environment" onChange={handleVideoFile} className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-accent-500 file:px-4 file:py-2 file:font-semibold file:text-slate-950" />
                {videoFile ? <span className="mt-3 block text-slate-400">{videoFile.name}</span> : null}
              </label>
              {uploadProgress > 0 ? (
                <div className="rounded-3xl bg-slate-900 p-3">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-accent-400 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : null}
              <label className="block text-sm text-slate-200">
                <span className="mb-2 block text-slate-300">Image URLs</span>
                <textarea
                  name="imageUrls"
                  rows="4"
                  value={form.imageUrls}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
                />
              </label>
              <Input label="Small video URL" name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="https://.../room-tour.mp4" />
              <label className="block text-sm text-slate-200">
                <span className="mb-2 block text-slate-300">Menu photo URLs</span>
                <textarea
                  name="menuPhotoUrls"
                  rows="3"
                  value={form.menuPhotoUrls}
                  onChange={handleChange}
                  placeholder="https://.../menu.jpg"
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
                />
              </label>
            </div>
          </div>
          {message ? (
            <p className={`text-sm ${status === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>
          ) : null}
          <Button type="submit" disabled={status === 'loading' || loading}>
            {status === 'loading' || loading ? 'Saving property…' : isEditMode ? 'Update property' : 'Save property'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default AddPropertyPage
