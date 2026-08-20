/**
 * RankBadge
 * ---------
 * VIEW layer (shared). Renders a rank's insignia as inline SVG from the
 * `insignia` spec on RankModel.LEVELS — no image assets, so it stays crisp
 * at any size and adds nothing to the bundle.
 *
 * Glyph language follows real military insignia: chevrons and rockers for
 * enlisted ranks, bars and leaves for officers, stars for generals. Some
 * shapes are stylized rather than exact (the "diamond" stands in for an oak
 * leaf, the wreath for the colonel's eagle) — at 44px an accurate eagle
 * reads as a smudge, and legibility matters more than fidelity here.
 */

const TIER_COLORS = {
  steel: '#8a99a8',
  bronze: '#c9803f',
  silver: '#f2f7ff',
  gold: '#ffb800',
  blue: '#00a3ff',
}

/** Points for a 5-pointed star, first point up. */
function starPoints(cx, cy, r) {
  const inner = r * 0.42
  const pts = []
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : inner
    const angle = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`)
  }
  return pts.join(' ')
}

/** Chevrons pointing up, stacked from a baseline going upward. */
function chevrons(count, { baseline, step = 6, height = 6, half = 11 }) {
  return Array.from({ length: count }, (_, i) => {
    const y = baseline - i * step
    return <path key={`c${i}`} d={`M${22 - half} ${y} L22 ${y - height} L${22 + half} ${y}`} />
  })
}

/** Rockers (inverted chevrons) below, narrowing as they descend so they
 *  stay inside the plate's taper. */
function rockers(count, { top, step = 5, height = 5 }) {
  const halves = [10, 8.5, 7]
  return Array.from({ length: count }, (_, i) => {
    const y = top + i * step
    const half = halves[i] ?? 7
    return <path key={`r${i}`} d={`M${22 - half} ${y} L22 ${y + height} L${22 + half} ${y}`} />
  })
}

/** Horizontally centered x positions for `count` items spaced `gap` apart. */
function spread(count, gap) {
  const start = 22 - ((count - 1) * gap) / 2
  return Array.from({ length: count }, (_, i) => start + i * gap)
}

function Glyph({ kind, count, color }) {
  const stroke = { stroke: color, strokeWidth: 2.6, fill: 'none', strokeLinecap: 'round' }

  switch (kind) {
    case 'chevron':
      return <g {...stroke}>{chevrons(count, { baseline: 24 + (count - 1) * 3 })}</g>

    case 'rocker':
      // Deliberate gap between the chevron stack and the rockers — packed
      // tighter, Corporal/Sergeant/Staff Sergeant become indistinguishable.
      return (
        <g {...stroke}>
          {chevrons(3, { baseline: 20, step: 5, height: 5 })}
          {rockers(count, { top: 27, step: 5.5 })}
        </g>
      )

    case 'rocker-star':
      return (
        <>
          <g {...stroke}>
            {chevrons(3, { baseline: 17, step: 5, height: 5 })}
            {rockers(3, { top: 31 })}
          </g>
          <g fill={color}>
            {spread(count, 9).map((x) => (
              <polygon key={x} points={starPoints(x, 24, 4)} />
            ))}
          </g>
        </>
      )

    case 'bar':
      return (
        <g fill={color}>
          {spread(count, 8).map((x) => (
            <rect key={x} x={x - 2.2} y={15} width={4.4} height={18} rx={1.2} />
          ))}
        </g>
      )

    case 'diamond':
      return (
        <g fill={color}>
          {spread(count, 13).map((x) => (
            <polygon key={x} points={`${x},15 ${x + 5.5},24 ${x},33 ${x - 5.5},24`} />
          ))}
        </g>
      )

    case 'wreath':
      return (
        <>
          <g stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round">
            <path d="M14 33 Q6 24 14 15" />
            <path d="M30 33 Q38 24 30 15" />
          </g>
          <polygon points={starPoints(22, 24, 7)} fill={color} />
        </>
      )

    case 'star':
      // Five stars wrap to a second row so they stay legible at 44px.
      if (count === 5) {
        return (
          <g fill={color}>
            {spread(3, 11).map((x) => (
              <polygon key={`t${x}`} points={starPoints(x, 19, 5)} />
            ))}
            {spread(2, 11).map((x) => (
              <polygon key={`b${x}`} points={starPoints(x, 31, 5)} />
            ))}
          </g>
        )
      }
      return (
        <g fill={color}>
          {spread(count, count > 2 ? 9 : 11).map((x) => (
            <polygon key={x} points={starPoints(x, 24, count > 2 ? 5.5 : 7)} />
          ))}
        </g>
      )

    case 'laurel':
      return (
        <>
          <circle cx={22} cy={24} r={13} stroke={color} strokeWidth={2.2} fill="none" />
          <polygon points={starPoints(22, 24, 8)} fill={color} />
        </>
      )

    case 'plate':
    default:
      return null
  }
}

function RankBadge({ insignia, size = 44, title }) {
  if (!insignia) return null

  const color = TIER_COLORS[insignia.tier] || TIER_COLORS.steel

  return (
    <svg
      className="rank-badge"
      viewBox="0 0 44 52"
      width={size}
      height={(size * 52) / 44}
      role="img"
      aria-label={title ? `Insignia de ${title}` : 'Insignia de rango'}
      style={{ '--badge-color': color }}
    >
      {title && <title>{title}</title>}
      <path
        className="rank-badge-plate"
        d="M22 1.5 L41.5 12 V34 L22 50.5 L2.5 34 V12 Z"
        fill="#0d0d0d"
        stroke={color}
        strokeWidth={1.6}
      />
      <Glyph kind={insignia.kind} count={insignia.count} color={color} />
    </svg>
  )
}

export default RankBadge
