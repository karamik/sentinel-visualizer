'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CircuitNode } from '@/lib/circom-parser'

interface Props {
  nodes: CircuitNode[]
  onClose: () => void
}

// Состояния узла для симуляции
type NodeState = 'idle' | 'active' | 'done'

export function HardwarePreview({ nodes, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [simulationTime, setSimulationTime] = useState(0) // текущий такт
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(1) // тактов в секунду
  const [maxTime, setMaxTime] = useState(10) // максимальное время симуляции (тактов)
  const [nodeStates, setNodeStates] = useState<Map<string, NodeState>>(new Map())
  const [activeWires, setActiveWires] = useState<Set<string>>(new Set())

  // Сброс симуляции
  const resetSimulation = () => {
    setSimulationTime(0)
    setNodeStates(new Map())
    setActiveWires(new Set())
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

  // Обновление состояний каждый такт (упрощённая модель)
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSimulationTime(prev => {
        const next = prev + 1
        if (next >= maxTime) {
          setIsRunning(false)
          return maxTime
        }

        // Обновляем состояния узлов: на каждом такте активируем узлы, чьи зависимости выполнены
        // Очень упрощённо: через time тактов активируем узлы с complexity <= time
        const newStates = new Map<string, NodeState>()
        const newWires = new Set<string>()

        nodes.forEach(node => {
          if (node.complexity <= next) {
            newStates.set(node.id, 'done')
          } else if (node.complexity === next + 1) {
            newStates.set(node.id, 'active')
          } else {
            newStates.set(node.id, 'idle')
          }
        })

        // Активные провода: от активных узлов к зависимым (или наоборот) – можно позже
        // Пока просто для демо: все рёбра от активных узлов
        nodes.forEach(node => {
          if (newStates.get(node.id) === 'active') {
            node.dependencies.forEach(depId => {
              newWires.add(`${node.id}-${depId}`)
            })
          }
        })

        setNodeStates(newStates)
        setActiveWires(newWires)

        return next
      })
    }, 1000 / speed) // тактов в секунду

    return () => clearInterval(interval)
  }, [isRunning, speed, maxTime, nodes])

  // Трёхмерная визуализация с состояниями
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

    // Цвета для состояний
    const stateColors = {
      idle: 0x444444,
      active: 0x00ff9d,
      done: 0x00995c
    }

    // Позиции узлов (как в 3D графе)
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
      const state = nodeStates.get(node.id) || 'idle'
      const geometry = new THREE.SphereGeometry(0.5, 32)
      const material = new THREE.MeshStandardMaterial({ color: stateColors[state] })
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

          <div className="ml-auto flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-600"></span> Idle
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-primary"></span> Active
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-800"></span> Done
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
