// apps/web/components/CircuitGraph3D.tsx

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

    // 1. Сцена
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0a0a')

    // 2. Камера
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 30

    // 3. Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    containerRef.current.innerHTML = '' // очищаем
    containerRef.current.appendChild(renderer.domElement)

    // 4. Контролы
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // 5. Свет
    const ambientLight = new THREE.AmbientLight(0x404040)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1, 100)
    pointLight.position.set(10, 20, 10)
    scene.add(pointLight)

    // 6. Анимация
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 7. Resize
    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [nodes])

  return <div ref={containerRef} className="w-full h-[600px] rounded-lg border border-primary/20" />
}
