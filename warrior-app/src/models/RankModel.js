/**
 * RankModel
 * ---------
 * MODEL layer. Pure data and business rules for the XP/rank system.
 * No React, no side effects, no storage access — just the domain logic
 * that Controllers use and Views display.
 *
 * 22 ranks following the real military ladder (the same structure Call of
 * Duty uses): chevrons for enlisted, bars and leaves for officers, stars
 * for generals. `Recruit` and `Legend` are ours, not military — they
 * bookend the ladder as the entry point and the aspirational top.
 *
 * Each rank carries an `insignia` spec that RankBadge renders as SVG:
 *   kind  — glyph family; the visual jump that marks a big promotion
 *   count — how many of that glyph; the small step inside a family
 *   tier  — color ramp, one step per 5-rank block:
 *              steel  (grey)         Recruit -> Corporal
 *              bronze                Sergeant -> Master Gunnery Sergeant
 *              silver (bright white) Second Lieutenant -> Lieutenant Colonel
 *              gold                  Colonel -> General
 *              blue                  Commander, Legend
 *
 * XP thresholds are a PLACEHOLDER curve calibrated against the current flat
 * 100 XP per logged day (see REQUIREMENTS.md section 4): first promotion
 * after a single workout, Legend at ~320 workouts. They need recalibrating
 * if/when XP starts scaling with volume (weight x reps) instead.
 */

export const LEVELS = [
  { level: 1,  title: 'Recruit',                  xpRequired: 0,     insignia: { kind: 'plate',       count: 0, tier: 'steel' } },
  { level: 2,  title: 'Private',                  xpRequired: 100,   insignia: { kind: 'chevron',     count: 1, tier: 'steel' } },
  { level: 3,  title: 'Private First Class',      xpRequired: 300,   insignia: { kind: 'chevron',     count: 2, tier: 'steel' } },
  { level: 4,  title: 'Lance Corporal',           xpRequired: 600,   insignia: { kind: 'chevron',     count: 3, tier: 'steel' } },
  { level: 5,  title: 'Corporal',                 xpRequired: 1000,  insignia: { kind: 'rocker',      count: 1, tier: 'steel' } },
  { level: 6,  title: 'Sergeant',                 xpRequired: 1500,  insignia: { kind: 'rocker',      count: 2, tier: 'bronze' } },
  { level: 7,  title: 'Staff Sergeant',           xpRequired: 2100,  insignia: { kind: 'rocker',      count: 3, tier: 'bronze' } },
  { level: 8,  title: 'Gunnery Sergeant',         xpRequired: 2800,  insignia: { kind: 'rocker-star', count: 1, tier: 'bronze' } },
  { level: 9,  title: 'Master Sergeant',          xpRequired: 3600,  insignia: { kind: 'rocker-star', count: 2, tier: 'bronze' } },
  { level: 10, title: 'Master Gunnery Sergeant',  xpRequired: 4500,  insignia: { kind: 'rocker-star', count: 3, tier: 'bronze' } },
  { level: 11, title: 'Second Lieutenant',        xpRequired: 5500,  insignia: { kind: 'bar',         count: 1, tier: 'silver' } },
  { level: 12, title: 'First Lieutenant',         xpRequired: 6600,  insignia: { kind: 'bar',         count: 2, tier: 'silver' } },
  { level: 13, title: 'Captain',                  xpRequired: 7800,  insignia: { kind: 'bar',         count: 3, tier: 'silver' } },
  { level: 14, title: 'Major',                    xpRequired: 9100,  insignia: { kind: 'diamond',     count: 1, tier: 'silver' } },
  { level: 15, title: 'Lieutenant Colonel',       xpRequired: 10500, insignia: { kind: 'diamond',     count: 2, tier: 'silver' } },
  { level: 16, title: 'Colonel',                  xpRequired: 12000, insignia: { kind: 'wreath',      count: 1, tier: 'gold' } },
  { level: 17, title: 'Brigadier General',        xpRequired: 14000, insignia: { kind: 'star',        count: 1, tier: 'gold' } },
  { level: 18, title: 'Major General',            xpRequired: 16500, insignia: { kind: 'star',        count: 2, tier: 'gold' } },
  { level: 19, title: 'Lieutenant General',       xpRequired: 19500, insignia: { kind: 'star',        count: 3, tier: 'gold' } },
  { level: 20, title: 'General',                  xpRequired: 23000, insignia: { kind: 'star',        count: 4, tier: 'gold' } },
  { level: 21, title: 'Commander',                xpRequired: 27000, insignia: { kind: 'star',        count: 5, tier: 'blue' } },
  { level: 22, title: 'Legend',                   xpRequired: 32000, insignia: { kind: 'laurel',      count: 1, tier: 'blue' } },
]

/**
 * Given total XP, returns the current level and the next one (or null if maxed).
 */
export function getLevelData(xp) {
  let current = LEVELS[0]
  let next = LEVELS[1]
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i]
      next = LEVELS[i + 1] || null
    }
  }
  return { current, next }
}

/**
 * Percentage of progress (0-100) toward the next level, for progress bars.
 */
export function xpProgressPct(xp) {
  const { current, next } = getLevelData(xp)
  if (!next) return 100
  const range = next.xpRequired - current.xpRequired
  const progress = xp - current.xpRequired
  return Math.min(100, (progress / range) * 100)
}
