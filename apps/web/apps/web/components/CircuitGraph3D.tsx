cat > apps/web/components/CircuitGraph3D.tsx << 'EOF'
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export function CircuitGraph3D() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

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

    // КУБИК для проверки
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff9d })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    // Анимация
    const animate = () => {
      requestAnimationFrame(animate)
      
      // Вращаем кубик
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      
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
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="w-full h-[600px] rounded-lg border border-primary/20" />
}
EOF
