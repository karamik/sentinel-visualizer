'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CircuitNode } from '@/lib/circom-parser'

interface Props {
  nodes: CircuitNode[]
  onNodeClick?: (node: CircuitNode) => void
  colorMode?: 'type' | 'heatmap' // NEW: режим раскраски
}

export function CircuitGraph3D({ nodes, onNodeClick, colorMode = 'type' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<CircuitNode | null>(null)

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    // Сцена
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0a0a')

    // Камера
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 30

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(renderer.domElement)

    // Контролы
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Свет
    const ambientLight = new THREE.AmbientLight(0x404040)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1, 100)
    pointLight.position.set(10, 20, 10)
    scene.add(pointLight)

    // Цвета для режима type
    const typeColors = {
      signal: 0x00ff9d,
      component: 0x00cc7d,
      constraint: 0x00995c
    }

    // Функция для получения цвета узла в зависимости от режима
    const getNodeColor = (node: CircuitNode): number => {
      if (colorMode === 'heatmap') {
        // Нормализуем complexity от 1 до 10 (предполагаем, что complexity от 1 до 10)
        const minComplexity = 1
        const maxComplexity = 10
        const t = Math.max(0, Math.min(1, (node.complexity - minComplexity) / (maxComplexity - minComplexity)))
        // Интерполяция между зелёным (0x00ff00) и красным (0xff0000)
        const r = Math.floor(255 * t)
        const g = Math.floor(255 * (1 - t))
        const b = 0
        return (r << 16) | (g << 8) | b
      } else {
        return typeColors[node.type] || 0x888888
      }
    }

    // Создаём карту позиций узлов (размещаем на сфере)
    const positions: { [id: string]: THREE.Vector3 } = {}
    const radius = 15

    nodes.forEach((node, i) => {
      // Равномерное распределение по сфере (золотой угол)
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodes.length)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions[node.id] = new THREE.Vector3(x, y, z)
    })

    // Создаём узлы-сферы
    const spheres: THREE.Mesh[] = []

    nodes.forEach(node => {
      const pos = positions[node.id]
      if (!pos) return

      const geometry = new THREE.SphereGeometry(
        Math.max(0.3, Math.min(1.0, 0.3 + (node.complexity || 1) * 0.1)),
        32
      )
      const material = new THREE.MeshStandardMaterial({
        color: getNodeColor(node),
        emissive: 0x111111
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.copy(pos)
      sphere.userData = { node } // сохраняем данные узла
      scene.add(sphere)
      spheres.push(sphere)
    })

    // Создаём связи (линии)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 })

    nodes.forEach(node => {
      if (!node.dependencies) return
      node.dependencies.forEach(depId => {
        const start = positions[node.id]
        const end = positions[depId]
        if (start && end) {
          const points = [start, end]
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const line = new THREE.Line(geometry, lineMaterial)
          scene.add(line)
        }
      })
    })

    // Raycaster для обработки кликов и наведения
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // Клик
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current || !onNodeClick) return

      const rect = containerRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(spheres)
      if (intersects.length > 0) {
        const hit = intersects[0].object
        const node = hit.userData.node as CircuitNode
        onNodeClick(node)
      }
    }

    // Наведение мыши (подсветка)
    const onMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(spheres)

      // Сбрасываем масштаб всех сфер
      spheres.forEach(sphere => sphere.scale.set(1, 1, 1))

      if (intersects.length > 0) {
        const hit = intersects[0].object
        hit.scale.set(1.3, 1.3, 1.3) // увеличиваем при наведении
        const node = hit.userData.node as CircuitNode
        setHoveredNode(node)
      } else {
        setHoveredNode(null)
      }
    }

    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.addEventListener('mousemove', onMouseMove)

    // Анимация
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
    }
  }, [nodes, onNodeClick, colorMode]) // добавлена зависимость colorMode

  return (
    <div className="relative w-full h-[600px] rounded-lg border border-primary/20">
      <div ref={containerRef} className="w-full h-full" />

      {/* Легенда для тепловой карты */}
      {colorMode === 'heatmap' && (
        <div className="absolute bottom-4 right-4 bg-bg-light/90 p-3 rounded-lg border border-primary/30 text-sm">
          <div className="text-white mb-2 font-semibold">Complexity</div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-4 rounded" style={{
              background: 'linear-gradient(to right, #00ff00, #ffff00, #ff0000)'
            }} />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Low</span>
              <span className="ml-auto">High</span>
            </div>
          </div>
        </div>
      )}

      {/* Подсказка при наведении */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 bg-bg-light/90 p-2 rounded border border-primary/30 text-xs text-gray-300">
          <span className="text-primary font-bold">{hoveredNode.name}</span>
          <span className="ml-2">Complexity: {hoveredNode.complexity}/10</span>
        </div>
      )}
    </div>
  )
}
