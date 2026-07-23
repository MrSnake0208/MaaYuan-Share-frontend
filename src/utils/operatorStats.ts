import { CopilotDocV1 } from '../models/copilot.schema'

export type OperatorStats = {
  starLevel: number
  attack: number
  hp: number
  hasStar: boolean
  hasAttack: boolean
  hasHp: boolean
}

export const readOperatorStats = (op: CopilotDocV1.Operator): OperatorStats => {
  const legacy = op as CopilotDocV1.Operator & {
    starLevel?: unknown
    star_level?: unknown
    attack?: unknown
    hp?: unknown
  }
  const extensions = (op as any).extensions as
    | {
        stats?: {
          starLevel?: unknown
          star_level?: unknown
          attack?: unknown
          hp?: unknown
        }
      }
    | undefined

  const starRaw =
    extensions?.stats?.starLevel ??
    extensions?.stats?.star_level ??
    legacy.starLevel ??
    legacy.star_level
  const attackRaw = extensions?.stats?.attack ?? legacy.attack
  const hpRaw = extensions?.stats?.hp ?? legacy.hp

  const hasStar = starRaw !== undefined
  const hasAttack = attackRaw !== undefined
  const hasHp = hpRaw !== undefined

  return {
    starLevel: Number(starRaw) || 0,
    attack: Number(attackRaw) || 0,
    hp: Number(hpRaw) || 0,
    hasStar,
    hasAttack,
    hasHp,
  }
}
