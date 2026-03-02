'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { CircuitNode } from '@/lib/circom-parser'

interface Props {
  nodes: CircuitNode[];
  onNodeClick?: (node: CircuitNode) => void;
}

export function CircuitGraph({ nodes, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 800
    const height = 600

    // Цвета по типу
    const colorMap = {
      signal: '#00ff9d',
      component: '#00cc7d',
      constraint: '#00995c',
    }

    // Создаём связи (edges) из dependencies
    const links: { source: string; target: string }[] = []
    nodes.forEach(node => {
      node.dependencies.forEach(dep => {
        const target = nodes.find(n => n.name === dep)
        if (target) {
          links.push({ source: node.id, target: target.id })
        }
      })
    })

    // D3 force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))

    // Рисуем связи
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)

    // Рисуем узлы
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => onNodeClick?.(d as CircuitNode))

    // Круги узлов
    node.append('circle')
      .attr('r', (d: CircuitNode) => 5 + d.complexity)
      .attr('fill', (d: CircuitNode) => colorMap[d.type])
      .attr('stroke', '#000')
      .attr('stroke-width', 2)

    // Подписи
    node.append('text')
      .text((d: CircuitNode) => d.name)
      .attr('x', 12)
      .attr('y', 4)
      .attr('fill', '#fff')
      .attr('font-size', '10px')

    // Обновление позиций
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, onNodeClick])

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="600"
      viewBox="0 0 800 600"
      className="bg-bg-light rounded-lg"
    />
  )
}
