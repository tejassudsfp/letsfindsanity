'use client'

import { useState, useMemo } from 'react'

interface DataPoint {
  date: string
  [key: string]: number | string
}

interface LineChartProps {
  data: DataPoint[]
  lines: {
    key: string
    label: string
    color: string
  }[]
  height?: number
}

export default function LineChart({ data, lines, height = 300 }: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null)

  const { maxValue, points, chartData } = useMemo(() => {
    if (!data || data.length === 0) return { maxValue: 0, points: {}, chartData: [] }

    // Find max value across all lines
    let max = 0
    lines.forEach(line => {
      data.forEach(d => {
        const val = Number(d[line.key]) || 0
        if (val > max) max = val
      })
    })

    // Add 10% padding
    max = max * 1.1 || 1

    // Calculate points for each line
    const chartPoints: Record<string, Array<{x: number, y: number, value: number}>> = {}
    const width = 100
    const padding = 8

    lines.forEach(line => {
      chartPoints[line.key] = data.map((d, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2)
        const value = Number(d[line.key]) || 0
        const y = height - padding - (value / max) * (height - padding * 2)
        return { x, y, value }
      })
    })

    return { maxValue: max, points: chartPoints, chartData: data }
  }, [data, lines, height])

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '14px'
      }}>
        no data available
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Chart */}
      <svg
        viewBox={`0 0 100 ${height}`}
        style={{
          width: '100%',
          height: `${height}px`,
          overflow: 'visible'
        }}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = height - 8 - ratio * (height - 16)
          return (
            <g key={ratio}>
              <line
                x1="8"
                y1={y}
                x2="92"
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.3"
                strokeDasharray="1,1"
              />
              <text
                x="6"
                y={y + 1.5}
                fontSize="4"
                fill="var(--text-tertiary)"
                textAnchor="end"
              >
                {Math.round(maxValue * ratio).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Lines */}
        {lines.map(line => {
          const linePoints = points[line.key].map(p => `${p.x},${p.y}`).join(' ')
          return (
            <polyline
              key={line.key}
              points={linePoints}
              fill="none"
              stroke={line.color}
              strokeWidth="0.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )
        })}

        {/* Hover vertical line */}
        {hoveredPoint !== null && (
          <line
            x1={points[lines[0].key][hoveredPoint.index].x}
            y1="8"
            x2={points[lines[0].key][hoveredPoint.index].x}
            y2={height - 8}
            stroke="var(--text-tertiary)"
            strokeWidth="0.3"
            strokeDasharray="2,2"
          />
        )}

        {/* Data points */}
        {lines.map(line => (
          points[line.key].map((p, i) => {
            const isHovered = hoveredPoint?.index === i
            return (
              <circle
                key={`${line.key}-${i}`}
                cx={p.x}
                cy={p.y}
                r={isHovered ? "1.5" : "1"}
                fill={line.color}
                stroke="var(--bg-primary)"
                strokeWidth="0.5"
                style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                onMouseEnter={() => setHoveredPoint({ index: i, x: p.x, y: p.y })}
              />
            )
          })
        ))}

        {/* Invisible wider circles for easier hover */}
        {data.map((d, i) => {
          const p = points[lines[0].key][i]
          return (
            <circle
              key={`hover-${i}`}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredPoint({ index: i, x: p.x, y: p.y })}
            />
          )
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div style={{
          position: 'absolute',
          left: `${points[lines[0].key][hoveredPoint.index].x}%`,
          top: '0',
          transform: 'translateX(-50%)',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none',
          zIndex: 10,
          whiteSpace: 'nowrap'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '12px' }}>
            {chartData[hoveredPoint.index].date}
          </div>
          {lines.map(line => {
            const value = points[line.key][hoveredPoint.index].value
            return (
              <div key={line.key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: line.color
                }} />
                <span className="text-secondary" style={{ fontSize: '11px' }}>{line.label}:</span>
                <span style={{ fontWeight: 600, fontSize: '12px' }}>
                  {value.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginTop: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {lines.map(line => (
          <div key={line.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <div style={{
              width: '16px',
              height: '3px',
              background: line.color,
              borderRadius: '2px'
            }} />
            <span className="text-secondary">{line.label}</span>
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        paddingLeft: '8%',
        paddingRight: '8%',
        fontWeight: 500
      }}>
        <span>{data[0]?.date}</span>
        {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
