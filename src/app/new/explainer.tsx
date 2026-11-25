'use client'

import { useEffect, useRef } from 'react'
import { buildExplainer, EXPLAINER_SECONDS } from './explainer-draw'

// Plays the explainer as a live drawing with no background, so it sits on
// whatever colour the section has. It only runs while it is on screen, and
// for visitors who ask for less motion it shows one still frame.
export default function Explainer({ alt, ratio }: { alt: string; ratio: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const [w, h] = ratio.split(':').map(Number)

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const seek = buildExplainer(svg)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { seek(20.4); return () => { svg.replaceChildren() } }

    let raf = 0, onScreen = false, offset = 0, last = 0
    const frame = (now: number) => {
      if (last) offset = (offset + (now - last) / 1000) % EXPLAINER_SECONDS
      last = now
      seek(offset)
      raf = requestAnimationFrame(frame)
    }
    const run = () => { if (!raf && onScreen && !document.hidden) { last = 0; raf = requestAnimationFrame(frame) } }
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) run(); else stop() }, { threshold: 0.15 })
    const vis = () => { if (document.hidden) stop(); else run() }
    seek(0)
    io.observe(svg)
    document.addEventListener('visibilitychange', vis)
    return () => { stop(); io.disconnect(); document.removeEventListener('visibilitychange', vis); svg.replaceChildren() }
  }, [])

  return <svg ref={ref} className="ic-live" viewBox="0 0 1200 900" role="img" aria-label={alt} style={{ aspectRatio: `${w || 4} / ${h || 3}` }} />
}
