'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          🔮 Sentinel Visualizer
        </h1>
        <p className="text-gray-400">See the Unseen in ZK Circuits</p>
      </div>

      <div className="w-full max-w-md">
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary transition-colors">
          <input
            type="file"
            accept=".circom,.json"
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
              {file ? file.name : 'Drop .circom file here'}
            </span>
            <span className="text-sm text-gray-500 mt-1">
              or click to browse
            </span>
          </label>
        </div>

        {file && (
          <button className="w-full mt-4 bg-primary text-black font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors">
            Visualize Circuit →
          </button>
        )}
      </div>

      <div className="mt-12 grid grid-cols-3 gap-4 text-center">
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
    </main>
  )
}
