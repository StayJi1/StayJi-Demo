import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function useSwipe(onLeft, onRight) {
  const startX = useRef(null)
  const onTouchStart = (e) => { startX.current = e.touches?.[0]?.clientX }
  const onTouchEnd = (e) => {
    const endX = e.changedTouches?.[0]?.clientX
    if (startX.current == null || endX == null) return
    const dx = endX - startX.current
    if (Math.abs(dx) < 40) return
    if (dx > 0) onRight()
    else onLeft()
    startX.current = null
  }
  return { onTouchStart, onTouchEnd }
}

function GalleryTrigger({ property }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
  const gallery = [...new Set([property.image, ...(property.images || [])].filter(Boolean))]
  const images = gallery.length ? gallery : [fallbackImage]
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setZoomed(false)
        setOpen(false)
      }
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, images.length])

  const next = () => setIndex((i) => (i + 1) % images.length)
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length)
  const { onTouchStart, onTouchEnd } = useSwipe(next, prev)

  return (
    <div>
      <button type="button" onClick={() => { setIndex(0); setZoomed(false); setOpen(true) }} className="h-96 w-full overflow-hidden text-left">
        <img src={images[0]} onError={(event) => { event.currentTarget.src = fallbackImage }} alt={property.name || 'StayJi property'} loading="eager" className="h-96 w-full object-cover rounded-[2rem]" />
      </button>
      {images.length > 1 ? (
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 sm:grid-cols-4">
          {images.slice(1, 5).map((img, idx) => (
            <button key={img} type="button" onClick={() => { setIndex(idx + 1); setZoomed(false); setOpen(true) }} className="h-24 w-full overflow-hidden rounded-2xl">
              <img src={img} onError={(event) => { event.currentTarget.src = fallbackImage }} alt={`${property.name || 'StayJi property'} ${idx + 1}`} loading="lazy" className="h-24 w-full object-cover rounded-2xl" />
            </button>
          ))}
        </div>
      ) : null}

      {open ? createPortal((
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Property image gallery"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setZoomed(false)
              setOpen(false)
            }
          }}
        >
          <button type="button" onClick={() => { setZoomed(false); setOpen(false) }} className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white sm:right-6 sm:top-6">
            <FiX size={20} />
          </button>
          <button type="button" onClick={prev} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white sm:left-6">
            <FiChevronLeft size={24} />
          </button>
          <button type="button" onClick={next} className="absolute right-14 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white sm:right-20">
            <FiChevronRight size={24} />
          </button>

          <div className="max-h-[95vh] max-w-[98vw] touch-pan-y overflow-auto">
            <div
              onDoubleClick={() => setZoomed((z) => !z)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className={`relative flex items-center justify-center ${zoomed ? 'cursor-grab' : ''}`}
            >
              <img
                src={images[index]}
                onError={(event) => { event.currentTarget.src = fallbackImage }}
                alt={`${property.name || 'StayJi property'} ${index + 1}`}
                className={`max-h-[95vh] max-w-[98vw] object-contain transition-transform ${zoomed ? 'scale-150' : 'scale-100'}`}
                style={{ transformOrigin: 'center center' }}
                draggable={false}
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-300">
              <span>{index + 1} / {images.length}</span>
            </div>
          </div>
        </div>
      ), document.body) : null}
    </div>
  )
}

export default GalleryTrigger
