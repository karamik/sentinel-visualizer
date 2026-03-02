'use client'

import { useState } from 'react'
import { parseCircomFile, ParsedCircuit, CircuitNode } from '@/lib/circom-parser'
import { CircuitGraph } from '@/components/CircuitGraph'

// Встроенные примеры (не нужен fetch)
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

export default function Home() {
  const [circuit, setCircuit] = useState<ParsedCircuit | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<CircuitNode | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      setError('Failed to load example: ' + (err as Error).message)
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
                onClick={() => loadExample('hello-world')}
                disabled={loading}
                className="px-4 py-2 bg-bg-light border border-primary/30 rounded-lg text-sm hover:border-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                Hello World
              </button>
              <button
                onClick={() => loadExample('merkle')}
                disabled={loading}
                className="px-4 py-2 bg-bg-light border border-primary/30 rounded-lg text-sm hover:border-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                Merkle Tree
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
                setError(null)
              }}
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              ← Upload new
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

          {/* Fallback если граф пустой */}
          {allNodes.length === 0 ? (
            <div className="bg-bg-light rounded-lg p-8 text-center text-gray-500">
              <p className="text-lg mb-2">⚠️ No nodes to visualize</p>
              <p className="text-sm">Circuit parsed but no renderable elements found</p>
            </div>
          ) : (
            <div className="bg-bg rounded-lg p-4">
              <CircuitGraph
                nodes={allNodes}
                onNodeClick={setSelectedNode}
              />
            </div>
          )}

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
                  <span className="text-gray-500 text-xs uppercase">Deps</span>
                  <div className="text-white font-mono">{selectedNode.dependencies.length}</div>
                </div>
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
