'use client'

import { useState } from 'react'
import { parseCircomFile, ParsedCircuit, CircuitNode } from '@/lib/circom-parser'
import { CircuitGraph } from '@/components/CircuitGraph'
import { CircuitGraph3D } from '@/components/CircuitGraph3D'

// Встроенные примеры (те же)
const EXAMPLES: Record<string, string> = {
  'hello-world': `pragma circom 2.0.0;

template Multiplier() {
    signal input a;
    signal input b;
    signal output c;
    c <== a * b;
}

component main = Multiplier();`,

  'merkle': `pragma circom 2.0.0;

template Hash() {
    signal input a;
    signal input b;
    signal output out;
    out <== a + b;
}

template Merkle(n) {
    signal input leaves[n];
    signal output root;
    
    component hashes[n-1];
    for (var i = 0; i < n-1; i++) {
        hashes[i] = Hash();
        hashes[i].a <== i == 0 ? leaves[0] : hashes[i-1].out;
        hashes[i].b <== leaves[i+1];
    }
    root <== hashes[n-2].out;
}

component main = Merkle(4);`
}

// Планы (те же)
const PRICING = [
  // ... (без изменений)
]

export default function Home() {
  const [circuit, setCircuit] = useState<ParsedCircuit | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<CircuitNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPricing, setShowPricing] = useState(false)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d') // NEW

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    try {
      const parsed = await parseCircomFile(file)
      setCircuit(parsed)
    } catch (err) {
      setError('Failed to parse: ' + (err as Error).message)
    }
    setLoading(false)
  }

  const loadExample = async (name: string) => {
    setLoading(true)
    setError(null)
    try {
      const code = EXAMPLES[name]
      if (!code) throw new Error('Example not found')

      const blob = new Blob([code], { type: 'text/plain' })
      const file = new File([blob], `${name}.circom`, { type: 'text/plain' })

      const parsed = await parseCircomFile(file)
      setCircuit(parsed)
    } catch (err) {
      setError('Failed to load: ' + (err as Error).message)
    }
    setLoading(false)
  }

  const allNodes = circuit
    ? [...circuit.signals, ...circuit.components, ...circuit.constraints]
    : []

  return (
    <main className="min-h-screen p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          🔮 Sentinel Visualizer
        </h1>
        <p className="text-gray-400">See the Unseen in ZK Circuits</p>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-md mx-auto mb-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Upload + Examples (если нет схемы и не показаны цены) */}
      {!circuit && !showPricing && (
        <div className="max-w-md mx-auto mb-8">
          {/* ... (без изменений) */}
        </div>
      )}

      {/* Pricing Section (если нет схемы и показаны цены) */}
      {showPricing && !circuit && (
        <div className="max-w-5xl mx-auto mb-8">
          {/* ... (без изменений) */}
        </div>
      )}

      {/* Когда схема загружена */}
      {circuit && (
        <div className="max-w-4xl mx-auto">
          {/* Верхняя панель с названием и кнопкой назад */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-primary">{circuit.name}</h2>
            <button
              onClick={() => {
                setCircuit(null)
                setSelectedNode(null)
                setError(null)
                setViewMode('2d') // сбрасываем режим
              }}
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              ← Upload new
            </button>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* ... (без изменений) */}
          </div>

          {/* Переключатель 2D/3D (только если есть узлы) */}
          {allNodes.length > 0 && (
            <div className="flex justify-end gap-2 mb-2">
              <button
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === '2d'
                    ? 'bg-primary text-black'
                    : 'bg-bg-light text-gray-400 hover:text-white'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === '3d'
                    ? 'bg-primary text-black'
                    : 'bg-bg-light text-gray-400 hover:text-white'
                }`}
              >
                3D
              </button>
            </div>
          )}

          {/* Граф */}
          {allNodes.length === 0 ? (
            <div className="bg-bg-light rounded-lg p-8 text-center text-gray-500">
              <p className="text-lg mb-2">⚠️ No nodes to visualize</p>
              <p className="text-sm">Circuit parsed but no renderable elements found</p>
            </div>
          ) : (
            <div className="bg-bg rounded-lg p-4">
              {viewMode === '2d' ? (
                <CircuitGraph nodes={allNodes} onNodeClick={setSelectedNode} />
              ) : (
                <CircuitGraph3D nodes={allNodes} onNodeClick={setSelectedNode} />
              )}
            </div>
          )}

          {/* Инспектор узла (если выбран) */}
          {selectedNode && (
            <div className="mt-4 bg-bg-light p-4 rounded-lg border border-primary/20">
              {/* ... (без изменений) */}
            </div>
          )}
        </div>
      )}

      {/* Features (когда нет схемы и не показаны цены) */}
      {!circuit && !showPricing && (
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
          {/* ... (без изменений) */}
        </div>
      )}
    </main>
  )
}
