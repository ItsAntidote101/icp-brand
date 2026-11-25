'use client'

import { useEffect, useRef, useState } from 'react'

// A silent looping clip used like a moving illustration. It plays on its own
// unless the visitor has asked their device for less motion; then it waits,
// with controls, until they press play.
export default function Clip({ src, alt, ratio }: { src: string; alt: string; ratio: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [calm, setCalm] = useState(false)
  const [w, h] = ratio.split(':').map(Number)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCalm(true); ref.current?.pause() }
  }, [])
  return (
    <video
      ref={ref} className="ic-clip" style={{ aspectRatio: `${w || 4} / ${h || 3}` }}
      src={src} poster={src.replace(/\.mp4$/, '-poster.jpg')} aria-label={alt}
      autoPlay muted loop playsInline preload="metadata" controls={calm}
    />
  )
}
