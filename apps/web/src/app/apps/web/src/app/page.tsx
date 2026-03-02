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

  const loadExample = async (path: string) => {
    setLoading(true)
    try {
      const response = await fetch(`https://raw.githubusercontent.com/karamik/sentinel-visualizer/main/examples/${path}`)
      const text = await response.text()
      
      const blob = new Blob([text], { type: 'text/plain' })
      const file = new File([blob], path.split('/').pop() || 'example.circom', { type: 'text/plain' })
      
      const parsed = await parseCircomFile(file)
      setCircuit(parsed)
    } catch (err) {
      alert('Failed to load example: ' + (err as Error).message)
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

      {/* Upload + Examples */}
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

          <div className="mt-6">
            <p className="text-sm text-gray-500 text-center mb-3">Or try an example:</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => loadExample('01-hello-world/circuit.circom')}
                disabled={loading}
                className="px-4 py-2 bg-bg-light border border-primary/30 rounded-lg text-sm hover:border-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Hello World'}
              </button>
              <button 
                onClick={() => loadExample('02-merkle-tree/merkle.circom')}
                disabled={loading}
                className="px-4 py-2 bg-bg-light border border-primary/30 rounded-lg text-sm hover:border-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Merkle Tree'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats + Graph */}
      {circuit && (
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-primary">{circuit.name}</h2>
            <button 
              onClick={() => {
                setCircuit(null)
                setSelectedNode(null)
              }}
              className="text-sm text-gray-500 hover:text-primary transition-colors"
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

          <div className="bg-bg rounded-lg p-4">
            <CircuitGraph 
              nodes={allNodes} 
              onNodeClick={setSelectedNode}
            />
          </div>

          {selectedNode && (
            <div className="mt-4 bg-bg-light p-4 rounded-lg border border-primary/20">
              <h3 className="text-primary font-bold mb-2 flex items-center gap-2">
                <span className="text-lg">🔍</span>
                {selectedNode.name}
              </h3>
              <div className="text-sm text-gray-400 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-bg p-2 rounded">
                  <span className="text-gray-500 text-xs uppercase">Type</span>
                  <div className="text-white font-mono">{selectedNode.type}</div>
                </div>
                <div className="bg-bg p-2 rounded">
                  <span className="text-gray-500 text-xs uppercase">Line</span>
                  <div className="text-white font-mono">{selectedNode.line}</div>
                </div>
                <div className="bg-bg p-2 rounded">
                  <span className="text-gray-500 text-xs uppercase">Complexity</span>
                  <div className="text-primary font-mono">{selectedNode.complexity}/10</div>
                </div>
                <div className="bg-bg p-2 rounded">
                  <span className="text-gray-500 text-xs uppercase">Dependencies</span>
                  <div className="text-white font-mono">{selectedNode.dependencies.length}</div>
                </div>
              </div>
              {selectedNode.dependencies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <span className="text-gray-500 text-xs uppercase">Depends on:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedNode.dependencies.map((dep, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
