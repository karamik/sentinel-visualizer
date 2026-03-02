'use client'

import { useState } from 'react'
import { CircuitNode, ParsedCircuit } from '@/lib/circom-parser'

interface Props {
  circuit: ParsedCircuit
  onClose: () => void
}

interface WitnessValue {
  [signalName: string]: string // hex или bigint
}

export function StepDebugger({ circuit, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [witness, setWitness] = useState<WitnessValue>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [isRunning, setIsRunning] = useState(false)
  const maxSteps = circuit.constraints.length

  // Инициализация входных сигналов (публичные и приватные)
  const initInputs = () => {
    const inputSignals = circuit.signals.filter(s => 
      s.name.startsWith('pub_in') || s.name.startsWith('prv_in')
    )
    const defaultInputs: Record<string, string> = {}
    inputSignals.forEach(s => {
      defaultInputs[s.name] = '0'
    })
    setInputs(defaultInputs)
  }

  // Сброс отладчика
  const resetDebugger = () => {
    setStep(0)
    setWitness({})
    initInputs()
    setIsRunning(false)
  }

  // Запуск witness generation (симуляция)
  const startSimulation = () => {
    resetDebugger()
    setIsRunning(true)
  }

  // Выполнить один шаг (одно ограничение)
  const stepForward = () => {
    if (step >= maxSteps) return
    // Упрощённая модель: вычисляем значения сигналов на основе ограничений
    // В реальности нужно использовать R1CS и witness calculator
    const newWitness = { ...witness }
    const currentConstraint = circuit.constraints[step]
    // Пример: для простоты присваиваем сигналам случайные значения
    // В реальном приложении здесь должен быть вызов библиотеки для вычисления witness
    if (currentConstraint.dependencies.length > 0) {
      // Берём первый зависимый сигнал и даём ему значение
      const dep = currentConstraint.dependencies[0]
      newWitness[dep] = `0x${Math.floor(Math.random() * 1000).toString(16)}`
    }
    setWitness(newWitness)
    setStep(prev => prev + 1)
  }

  // Выполнить все шаги
  const stepAll = () => {
    for (let i = step; i < maxSteps; i++) {
      stepForward()
    }
  }

  // Сброс до начального состояния
  const reset = () => {
    setStep(0)
    setWitness({})
  }

  // Обновление значения входа
  const handleInputChange = (name: string, value: string) => {
    setInputs(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Заголовок */}
      <div className="bg-bg-light p-4 flex justify-between items-center border-b border-primary/30">
        <h2 className="text-xl font-bold text-primary">Step Debugger: {circuit.name}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
      </div>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-3 gap-4">
        {/* Левая панель: входные сигналы */}
        <div className="bg-bg-light rounded-lg p-4 border border-primary/20">
          <h3 className="text-primary font-semibold mb-3">Input Signals</h3>
          <div className="space-y-2 max-h-96 overflow-auto">
            {Object.entries(inputs).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-24 truncate">{name}:</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleInputChange(name, e.target.value)}
                  className="flex-1 bg-bg border border-primary/30 rounded px-2 py-1 text-sm text-white font-mono"
                  placeholder="0x..."
                />
              </div>
            ))}
          </div>
          <button
            onClick={startSimulation}
            className="mt-4 w-full py-2 bg-primary text-black rounded font-semibold hover:bg-primary-dark"
          >
            Start Simulation
          </button>
        </div>

        {/* Центральная панель: управление шагами */}
        <div className="bg-bg-light rounded-lg p-4 border border-primary/20">
          <h3 className="text-primary font-semibold mb-3">Control</h3>
          <div className="flex gap-2 mb-4">
            <button
              onClick={stepForward}
              disabled={!isRunning || step >= maxSteps}
              className="px-3 py-1 bg-primary text-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Step
            </button>
            <button
              onClick={stepAll}
              disabled={!isRunning || step >= maxSteps}
              className="px-3 py-1 bg-primary text-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Run All
            </button>
            <button
              onClick={reset}
              disabled={!isRunning}
              className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50"
            >
              Reset
            </button>
          </div>
          <div className="text-sm text-gray-400">
            Step: <span className="text-primary font-mono">{step} / {maxSteps}</span>
          </div>
          <div className="mt-4 p-3 bg-bg rounded border border-primary/30">
            <div className="text-xs text-gray-500 mb-1">Current Constraint:</div>
            {step < maxSteps ? (
              <div className="text-white font-mono text-sm">
                {circuit.constraints[step].name}
              </div>
            ) : (
              <div className="text-gray-500">Finished</div>
            )}
          </div>
        </div>

        {/* Правая панель: значения свидетеля */}
        <div className="bg-bg-light rounded-lg p-4 border border-primary/20">
          <h3 className="text-primary font-semibold mb-3">Witness</h3>
          <div className="space-y-1 max-h-96 overflow-auto">
            {Object.entries(witness).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-24 truncate">{name}:</span>
                <span className="text-primary font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Нижняя панель с информацией */}
      <div className="bg-bg-light p-4 border-t border-primary/30 text-xs text-gray-500">
        Step through the circuit constraints and see how witness values are computed.
        This is a simplified simulation; real witness calculation requires full R1CS evaluation.
      </div>
    </div>
  )
}
