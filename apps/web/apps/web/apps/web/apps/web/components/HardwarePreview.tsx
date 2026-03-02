'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CircuitNode } from '@/lib/circom-parser'

interface Props {
  nodes: CircuitNode[]
  onClose: () => void
}

// Задержки в тактах для разных типов узлов
const DELAY_BY_TYPE = {
  signal: 1,
  component: 3,
  constraint: 2,
}

// Интерфейс состояния узла в симуляции
interface NodeSimState {
  state: 'idle' | 'active' | 'done'
  readyTime: number   // такт, когда узел готов к выполнению (все зависимости выполнены)
  finishTime: number  // такт, когда узел завершит выполнение (readyTime + delay)
  delay: number
}

export function HardwarePreview({ nodes, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [simulationTime, setSimulationTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [maxTime, setMaxTime] = useState(20)
  const [nodeStates, setNodeStates] = useState<Map<string, NodeSimState>>(new Map())
  const [activeWires, setActiveWires] = useState<Set<string>>(new Set())

  // Метрики аппаратного использования (грубая оценка)
  const [metrics, setMetrics] = useState({
    lut: 0,
    registers: 0,
    memory: 0,
    criticalPath: 0,
  })

  // Инициализация состояний узлов при первом запуске или сбросе
  const resetSimulation = () => {
    setSimulationTime(0)
    const initialStates = new Map<string, NodeSimState>()
    nodes.forEach(node => {
      initialStates.set(node.id, {
        state: 'idle',
        readyTime: Infinity,
        finishTime: Infinity,
        delay: DELAY_BY_TYPE[node.type] || 1,
      })
    })
    setNodeStates(initialStates)
    setActiveWires(new Set())

    // Пересчёт метрик на основе узлов
    let totalLut = 0
    let totalReg = 0
    let totalMem = 0
    nodes.forEach(node => {
      // LUT: примерно 10 * complexity для компонентов, 1 для сигналов, 2 для ограничений
      if (node.type === 'component') totalLut += node.complexity * 10
      else if (node.type === 'constraint') totalLut += node.complexity * 2
      else totalLut += 1
      // Регистры: примерно complexity * 2 для всех
      totalReg += node.complexity * 2
      // Память: только для компонентов с большим complexity (>5)
      if (node.type === 'component' && node.complexity > 5) totalMem += node.complexity * 4
    })
    // Критический путь (макс. сумма задержек вдоль зависимостей) – упрощённо
    const criticalPath = nodes.reduce((max, node) => {
      const depTimes = node.dependencies.map(d => {
        const depNode = nodes.find(n => n.id === d)
        return depNode ? DELAY_BY_TYPE[depNode.type] || 1 : 0
      })
      const nodeDelay = DELAY_BY_TYPE[node.type] || 1
      return Math.max(max, (depTimes.reduce((a, b) => a + b, 0) + nodeDelay))
    }, 0)
    setMetrics({ lut: totalLut, registers: totalReg, memory: totalMem, criticalPath })
  }

  // Запуск/пауза
  const toggleSimulation = () => {
    if (isRunning) {
      setIsRunning(false)
    } else {
      resetSimulation()
      setIsRunning(true)
    }
  }

  // Основной цикл симуляции (потактовое обновление)
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSimulationTime(prev => {
        const currentTime = prev + 1
        if (currentTime > maxTime) {
          setIsRunning(false)
          return maxTime
        }

        // Обновляем состояния узлов на основе зависимостей и задержек
        const newStates = new Map(nodeStates)

        // Для каждого узла определяем, все ли зависимости выполнены
        nodes.forEach(node => {
          const state = newStates.get(node.id)
          if (!state) return

          // Если узел уже завершён, пропускаем
          if (state.state === 'done') return

          // Проверяем зависимости: все ли они выполнены (finishTime <= currentTime)
          const depsDone = node.dependencies.every(depId => {
            const depState = newStates.get(depId)
            return depState && depState.state === 'done'
          })

          if (depsDone && state.state === 'idle') {
            // Узел готов к запуску
            state.readyTime = currentTime
            state.state = 'active'
            state.finishTime = currentTime + state.delay
          }

          if (state.state === 'active' && state.finishTime <= currentTime) {
            state.state = 'done'
          }
        })

        // Обновляем активные провода (от активных узлов к зависимым)
        const newWires = new Set<string>()
        nodes.forEach(node => {
          const state = newStates.get(node.id)
          if (state?.state === 'active') {
            node.dependencies.forEach(depId => {
              newWires.add(`${node.id}-${depId}`)
            })
          }
        })

        setNodeStates(newStates)
        setActiveWires(newWires)

        return currentTime
      })
    }, 1000 / speed)

    return () => clearInterval(interval)
  }, [isRunning, speed, maxTime, nodes, nodeStates])

  // 3D рендеринг (как раньше, но с учётом состояний)
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0a0a')

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 30

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    const ambientLight = new THREE.AmbientLight(0x404040)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 1, 100)
    pointLight.position.set(10, 20, 10)
    scene.add(pointLight)

    // Цвета состояний
    const stateColors = {
      idle: 0x444444,
      active: 0x00ff9d,
      done: 0x00995c,
    }

    // Позиции узлов
    const positions: { [id: string]: THREE.Vector3 } = {}
    const radius = 15
    nodes.forEach((node, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodes.length)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      positions[node.id] = new THREE.Vector3(x, y, z)
    })

    // Узлы
    const spheres: THREE.Mesh[] = []
    nodes.forEach(node => {
      const pos = positions[node.id]
      if (!pos) return
      const state = nodeStates.get(node.id)
      const color = state ? stateColors[state.state] : stateColors.idle
      const geometry = new THREE.SphereGeometry(0.5, 32)
      const material = new THREE.MeshStandardMaterial({ color })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.copy(pos)
      sphere.userData = { node }
      scene.add(sphere)
      spheres.push(sphere)
    })

    // Рёбра
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 })
    const activeLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff9d })

    nodes.forEach(node => {
      if (!node.dependencies) return
      node.dependencies.forEach(depId => {
        const start = positions[node.id]
        const end = positions[depId]
        if (start && end) {
          const points = [start, end]
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const isActive = activeWires.has(`${node.id}-${depId}`) || activeWires.has(`${depId}-${node.id}`)
          const line = new THREE.Line(geometry, isActive ? activeLineMaterial : lineMaterial)
          scene.add(line)
        }
      })
    })

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [nodes, nodeStates, activeWires])

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Верхняя панель */}
      <div className="bg-bg-light p-4 flex justify-between items-center border-b border-primary/30">
        <h2 className="text-xl font-bold text-primary">Hardware Preview (FPGA Simulation)</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
      </div>

      {/* 3D сцена */}
      <div ref={containerRef} className="flex-1 w-full" />

      {/* Панель управления */}
      <div className="bg-bg-light p-4 border-t border-primary/30">
        <div className="flex items-center gap-6 flex-wrap">
          <button
            onClick={toggleSimulation}
            className={`px-4 py-2 rounded font-semibold ${
              isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark text-black'
            }`}
          >
            {isRunning ? 'Stop' : 'Start Simulation'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-primary">{speed}x</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Time:</span>
            <span className="text-sm text-primary font-mono">
              {simulationTime} / {maxTime} cycles
            </span>
          </div>

          {/* Метрики */}
          <div className="ml-auto grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
            <div>LUT: <span className="text-primary font-mono">{metrics.lut}</span></div>
            <div>Registers: <span className="text-primary font-mono">{metrics.registers}</span></div>
            <div>Memory: <span className="text-primary font-mono">{metrics.memory} KB</span></div>
            <div>Critical path: <span className="text-primary font-mono">{metrics.criticalPath} cycles</span></div>
          </div>
        </div>

        {/* Легенда */}
        <div className="flex gap-4 text-xs mt-3">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-600"></span> Idle
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-primary"></span> Active
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-800"></span> Done
          </div>
          <div className="flex items-center gap-1 ml-4">
            <span className="w-3 h-3 border border-primary"></span> Active wire
          </div>
        </div>
      </div>
    </div>
  )
}
