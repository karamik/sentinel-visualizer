'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CircuitNode } from '@/lib/circom-parser'

interface Props {
  nodes: CircuitNode[]
  onNodeClick?: (node: CircuitNode) => void
}

export function CircuitGraph3D({ nodes, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

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

    // Цвета для типов узлов
    const colors = {
      signal: 0x00ff9d,
      component: 0x00cc7d,
      constraint: 0x00995c
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
        color: colors[node.type] || 0x888888,
        emissive: 0x111111
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.copy(pos)
      sphere.userData = { node } // сохраняем данные узла для кликов
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

    // Raycaster для обработки кликов
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

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

    renderer.domElement.addEventListener('click', onClick)

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
      renderer.dispose()
    }
  }, [nodes, onNodeClick])

  return <div ref={containerRef} className="w-full h-[600px] rounded-lg border border-primary/20" />
}
