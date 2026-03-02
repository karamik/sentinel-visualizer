'use client'

import { useState } from 'react'
import { parseCircomFile, ParsedCircuit, CircuitNode } from '@/lib/circom-parser'
import { CircuitGraph } from '@/components/CircuitGraph'

export default function Home() {
  const [circuit, setCircuit] = useState<ParsedCircuit | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<CircuitNode | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const parsed = await parseCircomFile(file)
      setCircuit(parsed)
    } catch (err) {
      alert('Failed to parse circuit: ' + (err as Error).message)
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

      {/* Upload */}
      {!circuit && (
        <div className="max-w-md mx-auto mb-8">
          <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept=".circom"
              onChange={handleFileUpload}
              className="hidden"
              id="circuit-upload"
            />
            <label
              htmlFor="circuit-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <span className="text-4xl mb-2">📤</span>
              <span className="text-primary font-semibold">
                {loading ? 'Parsing...' : 'Drop .circom file here'}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                or click to browse
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Stats */}
      {circuit && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-primary">{circuit.name}</h2>
            <button 
              onClick={() => setCircuit(null)}
              className="text-sm text-gray-500 hover:text-primary"
            >
              ← Upload new
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-bg-light p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{circuit.signals.length}</div>
              <div className="text-xs text-gray-500">Signals</div>
            </div>
            <div className="bg-bg-light p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{circuit.components.length}</div>
              <div className="text-xs text-gray-500">Components</div>
            </div>
            <div className="bg-bg-light p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{circuit.constraints.length}</div>
              <div className="text-xs text-gray-500">Constraints</div>
            </div>
            <div className="bg-bg-light p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{circuit.totalComplexity}</div>
              <div className="text-xs text-gray-500">Complexity</div>
            </div>
          </div>

          {/* Graph */}
          <div className="bg-bg rounded-lg p-4">
            <CircuitGraph 
              nodes={allNodes} 
              onNodeClick={setSelectedNode}
            />
          </div>

          {/* Selected Node Info */}
          {selectedNode && (
            <div className="mt-4 bg-bg-light p-4 rounded-lg">
              <h3 className="text-primary font-bold mb-2">Selected: {selectedNode.name}</h3>
              <div className="text-sm text-gray-400 grid grid-cols-2 gap-2">
                <div>Type: <span className="text-white">{selectedNode.type}</span></div>
                <div>Line: <span className="text-white">{selectedNode.line}</span></div>
                <div>Complexity: <span className="text-white">{selectedNode.complexity}/10</span></div>
                <div>Dependencies: <span className="text-white">{selectedNode.dependencies.length}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features */}
      {!circuit && (
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
          <div className="p-4 bg-bg-light rounded-lg">
            <div className="text-2xl font-bold text-primary">3D</div>
            <div className="text-xs text-gray-500">Interactive Graph</div>
          </div>
          <div className="p-4 bg-bg-light rounded-lg">
            <div className="text-2xl font-bold text-primary">⚡</div>
            <div className="text-xs text-gray-500">Hardware Preview</div>
          </div>
          <div className="p-4 bg-bg-light rounded-lg">
            <div className="text-2xl font-bold text-primary">🐛</div>
            <div className="text-xs text-gray-500">Step Debugger</div>
          </div>
        </div>
      )}
    </main>
  )
}
