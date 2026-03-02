'use client'

import { useRef } from 'react'
import { toPng, toSvg } from 'html-to-image'

interface Props {
  targetRef: React.RefObject<HTMLElement> // ссылка на элемент, который нужно экспортировать (граф)
  filename?: string
  enabled?: boolean // доступно ли (для платных планов)
}

export function ExportButtons({ targetRef, filename = 'circuit-graph', enabled = true }: Props) {
  const handleExportPNG = async () => {
    if (!targetRef.current) return
    try {
      const dataUrl = await toPng(targetRef.current, { quality: 0.95 })
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to export PNG:', err)
      alert('Failed to export PNG')
    }
  }

  const handleExportSVG = async () => {
    if (!targetRef.current) return
    try {
      const dataUrl = await toSvg(targetRef.current)
      const link = document.createElement('a')
      link.download = `${filename}.svg`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to export SVG:', err)
      alert('Failed to export SVG')
    }
  }

  if (!enabled) {
    return (
      <div className="flex gap-2 opacity-50 cursor-not-allowed" title="Upgrade to Pro to export">
        <button
          disabled
          className="px-3 py-1 text-sm rounded bg-gray-700 text-gray-400"
        >
          PNG
        </button>
        <button
          disabled
          className="px-3 py-1 text-sm rounded bg-gray-700 text-gray-400"
        >
          SVG
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportPNG}
        className="px-3 py-1 text-sm rounded bg-primary text-black hover:bg-primary-dark transition-colors"
        title="Export as PNG"
      >
        PNG
      </button>
      <button
        onClick={handleExportSVG}
        className="px-3 py-1 text-sm rounded bg-primary text-black hover:bg-primary-dark transition-colors"
        title="Export as SVG"
      >
        SVG
      </button>
    </div>
  )
}
