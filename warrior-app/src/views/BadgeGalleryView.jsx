import RankBadge from './shared/RankBadge.jsx'
import { LEVELS } from '../models/RankModel.js'

/**
 * BadgeGalleryView
 * ----------------
 * VIEW layer. Dev/demo screen reachable only at `?badges` — shows all 22
 * rank insignias at once so they can be checked without grinding XP.
 * Not linked from anywhere in the normal flow; it is the first piece of the
 * Modo Demo screen described in REQUIREMENTS.md section 5.
 */
function BadgeGalleryView() {
  return (
    <div className="badge-gallery">
      <h1>Insignias</h1>
      <p className="tier-subtitle">{LEVELS.length} rangos</p>

      <div className="badge-gallery-grid">
        {LEVELS.map((lvl) => (
          <div key={lvl.level} className="badge-gallery-item">
            <RankBadge insignia={lvl.insignia} title={lvl.title} size={52} />
            <p className="badge-gallery-title">{lvl.title}</p>
            <p className="badge-gallery-xp">{lvl.xpRequired.toLocaleString('es')} XP</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BadgeGalleryView
