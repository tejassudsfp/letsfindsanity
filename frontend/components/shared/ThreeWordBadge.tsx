import Link from 'next/link'

interface ThreeWordBadgeProps {
  threeWordId: string
  clickable?: boolean
}

export default function ThreeWordBadge({ threeWordId, clickable = true }: ThreeWordBadgeProps) {
  const badge = (
    <span className="lowercase" style={{
      padding: '4px 8px',
      borderRadius: '4px',
      border: '1px solid var(--border)',
      fontSize: '14px',
      display: 'inline-block'
    }}>
      {threeWordId}
    </span>
  )

  if (clickable) {
    return (
      <Link href={`/identity/${threeWordId}`}>
        {badge}
      </Link>
    )
  }

  return badge
}
