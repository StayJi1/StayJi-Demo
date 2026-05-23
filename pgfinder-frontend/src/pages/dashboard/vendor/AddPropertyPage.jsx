import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Card from '../../../components/common/Card'
import { useAuth } from '../../../context/AuthContext'
import propertyService from '../../../services/propertyService'
import { bangaloreLocalities } from '../../../data/seoContent'
import axiosClient from '../../../api/axiosClient'

const slugify = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const CITY_OPTIONS = {
  Karnataka: ['Bangalore'],
  Maharashtra: ['Mumbai', 'Pune'],
  Telangana: ['Hyderabad'],
}

const predefinedAmenities = ['WiFi', 'Meals', 'Laundry', 'Security', 'Attached balcony', 'Study table', 'Private fridge', 'Washing machine', 'Rooftop access', 'Biometric entry']
const defaultSharingRows = [
  { sharingType: 'Single sharing', totalRooms: '', vacantRooms: '', bedsPerRoom: 1, vacantBeds: '', monthlyRent: '' },
  { sharingType: 'Double sharing', totalRooms: '', vacantRooms: '', bedsPerRoom: 2, vacantBeds: '', monthlyRent: '' },
  { sharingType: 'Triple sharing', totalRooms: '', vacantRooms: '', bedsPerRoom: 3, vacantBeds: '', monthlyRent: '' },
  { sharingType: 'Four sharing', totalRooms: '', vacantRooms: '', bedsPerRoom: 4, vacantBeds: '', monthlyRent: '' },
]

function AddPropertyPage() {
  const { user, role } = useAuth()
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(propertyId)
  const [form, setForm] = useState({
    name: '',
    propertyCategory: 'PG',
    state: user?.assignedState || user?.state || 'Karnataka',
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
    amenities: ['WiFi', 'Laundry', 'Security'],
    customAmenityInput: '',
    menuPhotoUrls: '',
    description: '',
    imageUrls: '',
    videoUrl: '',
    roomInventory: defaultSharingRows,
    customFeatures: '',
    referralAgreementAccepted: false,
    leadPricingAccepted: false,
    ownerTermsAccepted: false,
  })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [videoFile, setVideoFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [cityOptions, setCityOptions] = useState(CITY_OPTIONS)

  useEffect(() => {
    axiosClient.get('/client/city-options')
      .then((res) => {
        if (res.data?.data?.options) setCityOptions(res.data.data.options)
      })
      .catch(() => setCityOptions(CITY_OPTIONS))
  }, [])

  useEffect(() => {
    const loadProperty = async () => {
      if (!isEditMode || !propertyId) return
      try {
        setLoading(true)
        const property = await propertyService.fetchPropertyById(propertyId, { includePrivate: true })
        setForm({
          name: property.name || '',
          propertyCategory: property.category || property.type || 'PG',
          state: property.stateName || property.state || user?.assignedState || user?.state || 'Karnataka',
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
          amenities: property.amenities?.length ? property.amenities : (property.aminityFeatures || '').split(',').map((item) => item.trim()).filter(Boolean),
          customAmenityInput: '',
          menuPhotoUrls: (property.menuPhotoUrls || [property.menuPhoto]).filter(Boolean).join('\n'),
          description: property.description || '',
          imageUrls: (property.images || [property.image]).filter(Boolean).join('\n'),
          videoUrl: property.videoUrl || '',
          propertyTypeIDFK: property.propertyTypeIDFK || '',
          isAvailable: property.status !== 'Booked',
          roomInventory: property.roomInventory?.length ? property.roomInventory : defaultSharingRows,
          customFeatures: (property.customFeatures || []).join(', '),
          referralAgreementAccepted: Boolean(property.ownerAgreement?.referralAgreementAccepted),
          leadPricingAccepted: Boolean(property.ownerAgreement?.leadPricingAccepted),
          ownerTermsAccepted: Boolean(property.ownerAgreement?.termsAccepted),
        })
      } catch (err) {
        setMessage(err?.message || 'Unable to load property details.')
      } finally {
        setLoading(false)
      }
    }
    loadProperty()
  }, [isEditMode, propertyId, user?.assignedState, user?.state])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value }
      if (name === 'state') next.city = cityOptions[value]?.[0] || ''
      return next
    })
  }

  const toggleAmenity = (amenity) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }))
  }

  const addCustomAmenity = () => {
    const amenity = form.customAmenityInput.trim()
    if (!amenity) return
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity) ? current.amenities : [...current.amenities, amenity],
      customAmenityInput: '',
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

  const handleRoomInventoryChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      roomInventory: current.roomInventory.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }))
  }

  const addSharingBlock = () => {
    setForm((current) => ({
      ...current,
      roomInventory: [...current.roomInventory, { sharingType: 'Custom sharing', totalRooms: '', occupiedRooms: '', vacantRooms: '', bedsPerRoom: 1, vacantBeds: '', waitingList: '', monthlyRent: '', bathroom: '', balcony: false, ac: false, furnishing: '', foodPreference: '', gender: '' }],
    }))
  }

  const removeSharingBlock = (index) => {
    setForm((current) => ({
      ...current,
      roomInventory: current.roomInventory.filter((_, rowIndex) => rowIndex !== index),
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
    if (!form.state || !form.area || !form.city || !form.latitude || !form.longitude) {
      setStatus('error')
      setMessage('Locality and Google Maps/OpenStreetMap coordinates are mandatory so this listing appears on locality pages.')
      return
    }
    if (!isEditMode && (!form.referralAgreementAccepted || !form.leadPricingAccepted || !form.ownerTermsAccepted)) {
      setStatus('error')
      setMessage('Accept referral agreement, lead pricing, and StayJi owner terms before submitting.')
      return
    }

    const payload = new FormData()
    const roomTypesPayload = form.roomInventory.map((row) => ({
      label: row.label || row.sharingType,
      sharingType: row.sharingType,
      totalRooms: row.totalRooms,
      vacantRooms: row.vacantRooms,
      occupiedRooms: row.occupiedRooms || Math.max(0, Number(row.totalRooms || 0) - Number(row.vacantRooms || 0)),
      waitingList: row.waitingList || 0,
      bedsPerRoom: row.bedsPerRoom,
      availableBeds: row.vacantBeds,
      vacantBeds: row.vacantBeds,
      bathroom: row.bathroom || '',
      balcony: Boolean(row.balcony),
      ac: Boolean(row.ac),
      furnishing: row.furnishing || '',
      foodPreference: row.foodPreference || '',
      gender: row.gender || '',
      monthlyRent: row.monthlyRent,
    }))
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
    payload.append('localitySlug', slugify(form.area))
    payload.append('cityName', form.city)
    payload.append('stateName', form.state)
    payload.append('aminityFeatures', form.amenities.join(', '))
    payload.append('mealsAvailable', JSON.stringify(form.mealsAvailable))
    payload.append('menuPhotoUrls', form.menuPhotoUrls)
    payload.append('menuPhoto', form.menuPhotoUrls.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || '')
    payload.append('propertyImageUrls', form.imageUrls)
    payload.append('propertyImage', form.imageUrls.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || '')
    payload.append('roomInventory', JSON.stringify(form.roomInventory))
    payload.append('roomTypes', JSON.stringify(roomTypesPayload))
    payload.append('customFeatures', form.customFeatures)
    payload.append('referralAgreementAccepted', form.referralAgreementAccepted)
    payload.append('leadPricingAccepted', form.leadPricingAccepted)
    payload.append('ownerTermsAccepted', form.ownerTermsAccepted)
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
          localitySlug: slugify(form.area),
          cityName: form.city,
          stateName: form.state,
          aminityFeatures: form.amenities.join(', '),
          mealsAvailable: form.mealsAvailable,
          menuPhotoUrls: form.menuPhotoUrls,
          menuPhoto: form.menuPhotoUrls.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || '',
          propertyImageUrls: form.imageUrls,
          propertyImage: form.imageUrls.split(/\n|,/).map((item) => item.trim()).filter(Boolean)[0] || '',
          videoUrl: form.videoUrl,
          isAvailable: form.isAvailable,
          propertyTypeIDFK: form.propertyTypeIDFK,
          roomInventory: form.roomInventory,
          roomTypes: roomTypesPayload,
          customFeatures: form.customFeatures,
          referralAgreementAccepted: form.referralAgreementAccepted,
          leadPricingAccepted: form.leadPricingAccepted,
          ownerTermsAccepted: form.ownerTermsAccepted,
          })
        setMessage('Property updated successfully. Admin approval is required before it appears live.')
      } else {
        await propertyService.createProperty(payload)
        setUploadProgress(100)
        setForm({
          name: '',
          propertyCategory: 'PG',
          state: user?.assignedState || user?.state || 'Karnataka',
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
          amenities: ['WiFi', 'Laundry', 'Security'],
          customAmenityInput: '',
          menuPhotoUrls: '',
          description: '',
          imageUrls: '',
          videoUrl: '',
          propertyTypeIDFK: '',
          isAvailable: true,
          roomInventory: defaultSharingRows,
          customFeatures: '',
          referralAgreementAccepted: false,
          leadPricingAccepted: false,
          ownerTermsAccepted: false,
        })
        setImageFiles([])
        setVideoFile(null)
        setMessage('Property submitted successfully. It will go live after admin approval.')
      }
      setStatus('success')
      if (isEditMode) {
        navigate(role === 'admin' ? `/dashboard/admin/properties/${propertyId}` : '/dashboard/owner/properties')
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
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">State</span>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              >
                {Object.keys(cityOptions).map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </label>
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">City</span>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              >
                <option value="">Select city</option>
                {(cityOptions[form.state] || []).map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </label>
            <label className="block text-sm text-slate-200">
              <span className="mb-2 block text-slate-300">Area / locality</span>
              <select
                name="area"
                value={form.area}
                onChange={handleChange}
                required
                className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20"
              >
                <option value="">Select Bangalore locality</option>
                {bangaloreLocalities.map((locality) => (
                  <option key={locality.slug} value={locality.name}>{locality.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Address" name="address" value={form.address} onChange={handleChange} required />
            <Input label="Monthly price" name="rent" type="number" value={form.rent} onChange={handleChange} required />
          </div>
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Input label="Latitude" name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} placeholder="12.9716" required />
            <Input label="Longitude" name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} placeholder="77.5946" required />
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
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-400">Sharing-wise vacancy</p>
                <button type="button" onClick={addSharingBlock} className="inline-flex items-center gap-2 rounded-full border border-accent-500/60 px-4 py-2 text-sm text-accent-200">
                  <FiPlus /> Add sharing
                </button>
              </div>
            <div className="mt-5 grid gap-4">
              {form.roomInventory.map((row, index) => (
                <div key={`${row.sharingType}-${index}`} className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-4 xl:grid-cols-6">
                  <Input label="Type" value={row.sharingType} onChange={(event) => handleRoomInventoryChange(index, 'sharingType', event.target.value)} />
                  <Input label="Total rooms" type="number" value={row.totalRooms} onChange={(event) => handleRoomInventoryChange(index, 'totalRooms', event.target.value)} />
                  <Input label="Occupied rooms" type="number" value={row.occupiedRooms || Math.max(0, Number(row.totalRooms || 0) - Number(row.vacantRooms || 0))} onChange={(event) => handleRoomInventoryChange(index, 'occupiedRooms', event.target.value)} />
                  <Input label="Vacant rooms" type="number" value={row.vacantRooms} onChange={(event) => handleRoomInventoryChange(index, 'vacantRooms', event.target.value)} />
                  <Input label="Vacant beds" type="number" value={row.vacantBeds} onChange={(event) => handleRoomInventoryChange(index, 'vacantBeds', event.target.value)} />
                  <Input label="Rent" type="number" value={row.monthlyRent} onChange={(event) => handleRoomInventoryChange(index, 'monthlyRent', event.target.value)} />
                  <Input label="Waiting list" type="number" value={row.waitingList || ''} onChange={(event) => handleRoomInventoryChange(index, 'waitingList', event.target.value)} />
                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block text-slate-300">Bathroom</span>
                    <select value={row.bathroom || ''} onChange={(event) => handleRoomInventoryChange(index, 'bathroom', event.target.value)} className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
                      <option value="">Select</option>
                      <option value="attached">Attached</option>
                      <option value="shared">Shared</option>
                    </select>
                  </label>
                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block text-slate-300">Furnishing</span>
                    <select value={row.furnishing || ''} onChange={(event) => handleRoomInventoryChange(index, 'furnishing', event.target.value)} className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
                      <option value="">Select</option>
                      <option value="furnished">Furnished</option>
                      <option value="semi-furnished">Semi-furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </label>
                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block text-slate-300">Food</span>
                    <select value={row.foodPreference || ''} onChange={(event) => handleRoomInventoryChange(index, 'foodPreference', event.target.value)} className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
                      <option value="">Select</option>
                      <option value="veg">Veg</option>
                      <option value="non-veg">Non-veg</option>
                      <option value="both">Both</option>
                      <option value="none">No food</option>
                    </select>
                  </label>
                  <label className="block text-sm text-slate-200">
                    <span className="mb-2 block text-slate-300">Gender</span>
                    <select value={row.gender || ''} onChange={(event) => handleRoomInventoryChange(index, 'gender', event.target.value)} className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
                      <option value="">Select</option>
                      <option value="boys">Boys</option>
                      <option value="girls">Girls</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"><input type="checkbox" checked={Boolean(row.balcony)} onChange={(event) => handleRoomInventoryChange(index, 'balcony', event.target.checked)} /> Balcony</label>
                  <label className="inline-flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"><input type="checkbox" checked={Boolean(row.ac)} onChange={(event) => handleRoomInventoryChange(index, 'ac', event.target.checked)} /> AC</label>
                  <button type="button" onClick={() => removeSharingBlock(index)} className="inline-flex items-center justify-center gap-2 rounded-3xl border border-rose-500/50 px-4 py-3 text-sm text-rose-200">
                    <FiTrash2 /> Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-400">Amenities</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {predefinedAmenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`rounded-full border px-4 py-2 text-sm ${form.amenities.includes(amenity) ? 'border-accent-400 bg-accent-500/10 text-accent-100' : 'border-slate-700 text-slate-300'}`}
                >
                  {amenity}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input label="Add custom amenity" name="customAmenityInput" value={form.customAmenityInput} onChange={handleChange} placeholder="Private fridge, rooftop access..." />
              <button type="button" onClick={addCustomAmenity} className="self-end rounded-3xl border border-accent-500/60 px-5 py-3 text-sm font-semibold text-accent-200">
                Add Custom Amenity
              </button>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-400">Custom features</p>
            <textarea name="customFeatures" value={form.customFeatures} onChange={handleChange} placeholder="Gym, study room, rooftop access, biometric access, EV charging, gaming zone, shuttle service" className="mt-4 min-h-24 w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400" />
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
          <div className="grid gap-3 rounded-[1.75rem] border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
            <p className="font-semibold uppercase tracking-[0.18em]">Owner activation agreements</p>
            <label className="flex items-start gap-3"><input type="checkbox" name="referralAgreementAccepted" checked={form.referralAgreementAccepted} onChange={handleChange} /> I accept the property referral agreement.</label>
            <label className="flex items-start gap-3"><input type="checkbox" name="leadPricingAccepted" checked={form.leadPricingAccepted} onChange={handleChange} /> I accept qualified lead pricing and conversion charges.</label>
            <label className="flex items-start gap-3"><input type="checkbox" name="ownerTermsAccepted" checked={form.ownerTermsAccepted} onChange={handleChange} /> I accept StayJi owner terms and property approval rules.</label>
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
