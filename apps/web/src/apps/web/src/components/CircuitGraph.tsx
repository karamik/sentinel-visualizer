'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { CircuitNode } from '@/lib/circom-parser'

interface Props {
  nodes: CircuitNode[];
  onNodeClick?: (node: CircuitNode) => void;
}

export function CircuitGraph({ nodes, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!svgRef.current) return
    
    // Очистка
    setError(null)
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Валидация
    if (!nodes || nodes.length === 0) {
      setError('No nodes to visualize')
      return
    }

    if (nodes.length > 500) {
      setError('Circuit too large (>500 nodes). Showing first 500.')
      nodes = nodes.slice(0, 500)
    }

    try {
      const width = 800
      const height = 600
      const colorMap = {
        signal: '#00ff9d',
        component: '#00cc7d',
        constraint: '#00995c',
      }

      // Фильтруем ноды без ID
      const validNodes = nodes.filter(n => n && n.id)
      
      // Создаём связи
      const links: { source: string; target: string; id: string }[] = []
      const nodeMap = new Map(validNodes.map(n => [n.id, n]))
      
      validNodes.forEach(node => {
        if (node.dependencies && Array.isArray(node.dependencies)) {
          node.dependencies.forEach(depName => {
            // Ищем по имени, если ID не найден
            const target = validNodes.find(n => n.name === depName || n.id === depName)
            if (target && target.id !== node.id) {
              links.push({ 
                source: node.id, 
                target: target.id,
                id: `${node.id}-${target.id}`
              })
            }
          })
        }
      })

      // Уникальные связи
      const uniqueLinks = Array.from(new Map(links.map(l => [l.id, l])).values())

      // D3 симуляция
      const simulation = d3.forceSimulation(validNodes as any)
        .force('link', d3.forceLink(uniqueLinks).id((d: any) => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius((d: any) => 10 + (d.complexity || 1)))

      // Рисуем связи
      const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(uniqueLinks)
        .enter()
        .append('line')
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.6)

      // Рисуем узлы
      const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(validNodes)
        .enter()
        .append('g')
        .attr('cursor', 'pointer')
        .call(d3.drag()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d: any) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }))
        .on('click', (event, d) => {
          event.stopPropagation()
          onNodeClick?.(d as CircuitNode)
        })

      // Круги
      node.append('circle')
        .attr('r', (d: CircuitNode) => Math.max(4, Math.min(20, 4 + (d.complexity || 1) * 2)))
        .attr('fill', (d: CircuitNode) => colorMap[d.type] || '#888')
        .attr('stroke', '#000')
        .attr('stroke-width', 2)

      // Подписи (только для важных нод)
      node.append('text')
        .text((d: CircuitNode) => d.name.length > 15 ? d.name.slice(0, 12) + '...' : d.name)
        .attr('x', 12)
        .attr('y', 4)
        .attr('fill', '#fff')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('opacity', (d: CircuitNode) => d.complexity > 3 ? 1 : 0.7)

      // Обновление позиций
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y)

        node.attr('transform', (d: any) => `translate(${d.x || 0},${d.y || 0})`)
      })

      // Очистка при размонтировании
      return () => {
        simulation.stop()
      }
    } catch (err) {
      setError('Failed to render graph: ' + (err as Error).message)
      console.error(err)
    }
  }, [nodes, onNodeClick])

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400">
        ⚠️ {error}
      </div>
    )
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height="600"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        className="bg-bg-light rounded-lg border border-primary/20"
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
        {nodes.length} nodes • Drag to explore • Click to inspect
      </div>
    </div>
  )
}
