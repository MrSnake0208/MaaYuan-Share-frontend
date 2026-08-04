export const OPERATOR_LEVEL_MIN = 1
export const OPERATOR_LEVEL_MAX = 100
export const OPERATOR_ELITE_MIN = 0
export const OPERATOR_ELITE_MAX = 17

/** 每 5 级增加 1 点修为上限，100 级时上限为 17。 */
export function getMaxEliteForLevel(level: number): number {
  const normalizedLevel = Math.min(
    OPERATOR_LEVEL_MAX,
    Math.max(OPERATOR_LEVEL_MIN, Math.trunc(level)),
  )
  return Math.min(
    OPERATOR_ELITE_MAX,
    Math.max(OPERATOR_ELITE_MIN, Math.floor(normalizedLevel / 5) - 3),
  )
}

