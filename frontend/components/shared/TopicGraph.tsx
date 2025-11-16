'use client'

import { useEffect, useRef, useState } from 'react'

interface Node {
  id: string
  label: string
  value: number
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface Edge {
  from: string
  to: string
  value: number
}

interface TopicGraphProps {
  nodes: Node[]
  edges: Edge[]
  onNodeClick?: (nodeId: string) => void
}

export default function TopicGraph({ nodes, edges, onNodeClick }: TopicGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null)
  const animationRef = useRef<number>()
  const nodeMapRef = useRef<Map<string, Node>>(new Map())

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const width = canvas.width = canvas.clientWidth
    const height = canvas.height = canvas.clientHeight

    // Initialize node positions
    const nodeMap = new Map<string, Node>()
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      const radius = Math.min(width, height) * 0.3
      nodeMap.set(node.id, {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      })
    })
    nodeMapRef.current = nodeMap

    // Simple force simulation
    const simulate = () => {
      const alpha = 0.1
      const centerForce = 0.01
      const repulsionForce = 3000
      const attractionForce = 0.001

      // Apply forces
      nodeMap.forEach(node => {
        // Center force
        node.vx = (node.vx || 0) + (width / 2 - (node.x || 0)) * centerForce
        node.vy = (node.vy || 0) + (height / 2 - (node.y || 0)) * centerForce

        // Repulsion between nodes
        nodeMap.forEach(other => {
          if (node.id === other.id) return
          const dx = (node.x || 0) - (other.x || 0)
          const dy = (node.y || 0) - (other.y || 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = repulsionForce / (dist * dist)
          node.vx = (node.vx || 0) + (dx / dist) * force
          node.vy = (node.vy || 0) + (dy / dist) * force
        })

        // Attraction along edges
        edges.forEach(edge => {
          if (edge.from === node.id) {
            const other = nodeMap.get(edge.to)
            if (other) {
              const dx = (other.x || 0) - (node.x || 0)
              const dy = (other.y || 0) - (node.y || 0)
              node.vx = (node.vx || 0) + dx * attractionForce * edge.value
              node.vy = (node.vy || 0) + dy * attractionForce * edge.value
            }
          }
          if (edge.to === node.id) {
            const other = nodeMap.get(edge.from)
            if (other) {
              const dx = (other.x || 0) - (node.x || 0)
              const dy = (other.y || 0) - (node.y || 0)
              node.vx = (node.vx || 0) + dx * attractionForce * edge.value
              node.vy = (node.vy || 0) + dy * attractionForce * edge.value
            }
          }
        })

        // Apply velocity
        node.x = (node.x || 0) + (node.vx || 0) * alpha
        node.y = (node.y || 0) + (node.vy || 0) * alpha

        // Damping
        node.vx = (node.vx || 0) * 0.9
        node.vy = (node.vy || 0) * 0.9
      })
    }

    // Render function
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw edges
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)'
      edges.forEach(edge => {
        const from = nodeMap.get(edge.from)
        const to = nodeMap.get(edge.to)
        if (from && to) {
          ctx.lineWidth = Math.sqrt(edge.value) * 0.5
          ctx.beginPath()
          ctx.moveTo(from.x || 0, from.y || 0)
          ctx.lineTo(to.x || 0, to.y || 0)
          ctx.stroke()
        }
      })

      // Draw nodes
      nodeMap.forEach(node => {
        const radius = Math.sqrt(node.value) * 3 + 5
        const isHovered = hoveredNode === node.id

        // Node circle
        ctx.fillStyle = isHovered ? '#6366f1' : '#8b5cf6'
        ctx.beginPath()
        ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI)
        ctx.fill()

        // Node label
        if (isHovered || node.value > 3) {
          ctx.fillStyle = '#fff'
          ctx.font = isHovered ? 'bold 14px sans-serif' : '12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(node.label, node.x || 0, (node.y || 0) - radius - 10)
        }
      })
    }

    // Animation loop
    let frame = 0
    const animate = () => {
      if (frame < 300) { // Run simulation for 300 frames
        simulate()
      }
      render()
      frame++
      // Continue animating to handle hover states
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle mouse move for hover
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      let foundNode: string | null = null
      nodeMap.forEach(node => {
        const radius = Math.sqrt(node.value) * 3 + 5
        const dx = (node.x || 0) - x
        const dy = (node.y || 0) - y
        if (Math.sqrt(dx * dx + dy * dy) < radius) {
          foundNode = node.id
        }
      })
      setHoveredNode(foundNode)
      setMousePos(foundNode ? { x: e.clientX, y: e.clientY } : null)
      canvas.style.cursor = foundNode ? 'pointer' : 'default'
    }

    // Handle click
    const handleClick = (e: MouseEvent) => {
      if (hoveredNode && onNodeClick) {
        onNodeClick(hoveredNode)
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [nodes, edges, onNodeClick])

  const hoveredNodeData = hoveredNode ? nodes.find(n => n.id === hoveredNode) : null

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '600px',
          borderRadius: '8px',
          background: 'var(--bg-secondary)'
        }}
      />
      {hoveredNodeData && mousePos && (
        <div style={{
          position: 'fixed',
          left: `${mousePos.x + 10}px`,
          top: `${mousePos.y + 10}px`,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '8px 12px',
          pointerEvents: 'none',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '14px',
          fontWeight: 500
        }}>
          <div style={{ color: 'var(--accent)', marginBottom: '4px' }}>
            #{hoveredNodeData.label}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            {hoveredNodeData.value} {hoveredNodeData.value === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      )}
    </div>
  )
}
