export type BasicActionSymbol = '普' | '大' | '下'

export type ChipVariant =
  | 'warm'
  | 'danger'
  | 'info'
  | 'teal'
  | 'success'
  | 'neutral'

export const BASIC_ACTION_VARIANTS: Record<BasicActionSymbol, ChipVariant> = {
  普: 'warm',
  大: 'danger',
  下: 'info',
}

export const CHIP_VARIANT_DOT_CLASS: Record<ChipVariant, string> = {
  warm: 'bg-amber-400',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  teal: 'bg-cyan-500',
  success: 'bg-lime-500',
  neutral: 'bg-slate-400',
}

export const SLOT_KEYS = ['1', '2', '3', '4', '5'] as const

export type SlotKey = (typeof SLOT_KEYS)[number]

export interface TokenEntry {
  token: string
  index: number
}

export function extractSlotFromToken(rawToken: string): SlotKey | null {
  const token = rawToken.trim()
  if (!token) {
    return null
  }

  const baseMatch = token.match(/^([1-5])([普大下])$/)
  if (baseMatch) {
    return baseMatch[1] as SlotKey
  }

  if (token.startsWith('额外:')) {
    const payload = token.slice('额外:'.length)
    const againMatch = payload.match(/^([1-5])([普大下])$/)
    if (againMatch) {
      return againMatch[1] as SlotKey
    }

    return null
  }

  if (token.startsWith('重开:检测')) {
    const downMatch = token.match(/重开:检测([1-5])号位阵亡/)
    if (downMatch) {
      return downMatch[1] as SlotKey
    }
  }

  return null
}

export function groupTokensBySlot(actions: string[][]): {
  slotMap: Partial<Record<SlotKey, TokenEntry[]>>
  others: TokenEntry[]
} {
  const slotMap: Partial<Record<SlotKey, TokenEntry[]>> = {}
  const others: TokenEntry[] = []

  actions.forEach((entry, index) => {
    const token = String(entry?.[0] ?? '').trim()
    if (!token) {
      return
    }

    const slot = extractSlotFromToken(token)
    if (slot) {
      if (!slotMap[slot]) {
        slotMap[slot] = []
      }
      slotMap[slot]!.push({ token, index })
      return
    }

    others.push({ token, index })
  })

  return { slotMap, others }
}

export interface GroupWithAttributionResult {
  slotMap: Partial<Record<SlotKey, TokenEntry[]>>
  others: TokenEntry[]
  errors: { index: number; token: string; reason: string }[]
}

/**
 * 按“类表格视图”归属规则，将允许的额外动作（等待/切换至左侧目标/切换至右侧目标）
 * 归属到实际执行的号位：
 * 1) 单个额外动作归属给其后紧邻出现的下一条号位项；
 * 2) 连续额外动作块统一归属给该块之后出现的第一条号位项；
 * 3) 序列起始处的额外动作归属给其后第一条号位项；
 * 4) 序列末尾且后无号位项时，回归最近一次出现的号位项；若从未出现号位项则报错；
 * 5) 非法额外动作类型（不在允许范围）报错并给出具体位置；
 * 6) 不改变原始顺序，仅做归属。
 */
export function groupTokensBySlotWithExtraAttribution(
  actions: string[][],
): GroupWithAttributionResult {
  const slotMap: Partial<Record<SlotKey, TokenEntry[]>> = {}
  const others: TokenEntry[] = []
  const errors: { index: number; token: string; reason: string }[] = []

  const pendingExtras: TokenEntry[] = []
  let lastSeenSlot: SlotKey | null = null

  const isAllowedExtra = (token: string): boolean => {
    if (!token.startsWith('额外:')) return false
    const payload = token.slice('额外:'.length)
    // 再动（形如 额外:1普）不属于“额外动作”范围，在本规则中视作有号位项，交由 extractSlotFromToken 处理
    if (/^[1-5][普大下]$/.test(payload)) return false
    if (payload === '左侧目标') return true
    if (payload === '右侧目标') return true
    if (payload.startsWith('等待')) return true // 等待 或 等待:ms
    return false
  }

  const pushToSlot = (slot: SlotKey, entry: TokenEntry) => {
    if (!slotMap[slot]) slotMap[slot] = []
    slotMap[slot]!.push(entry)
  }

  actions.forEach((entry, index) => {
    const token = String(entry?.[0] ?? '').trim()
    if (!token) return

    const slot = extractSlotFromToken(token)
    if (slot) {
      // 将前面积压的额外动作块整体归属到当前号位
      if (pendingExtras.length > 0) {
        pendingExtras.forEach((e) => pushToSlot(slot, e))
        pendingExtras.length = 0
      }
      pushToSlot(slot, { token, index })
      lastSeenSlot = slot
      return
    }

    if (token.startsWith('额外:')) {
      if (isAllowedExtra(token)) {
        // 暂存，等待下一个号位项出现时整体归属
        pendingExtras.push({ token, index })
      } else {
        // 不在允许范围内的额外动作：记录错误并归入 others
        errors.push({ index, token, reason: '非法额外动作类型' })
        others.push({ token, index })
      }
      return
    }

    // 其他非“额外:”前缀的动作（如重开等）归入 others
    others.push({ token, index })
  })

  // 序列末尾仍有额外动作未归属
  if (pendingExtras.length > 0) {
    if (lastSeenSlot) {
      pendingExtras.forEach((e) => pushToSlot(lastSeenSlot!, e))
      pendingExtras.length = 0
    } else {
      // 从未出现号位项，无法归属 —— 视为无效输入
      pendingExtras.forEach((e) => others.push(e))
      errors.push({ index: -1, token: '', reason: '序列内从未出现号位项，额外动作无法归属' })
    }
  }

  return { slotMap, others, errors }
}

export function resolveChipVariant(rawToken: string): ChipVariant {
  const token = rawToken.trim()
  if (!token) {
    return 'neutral'
  }

  const baseMatch = token.match(/^([1-5])([普大下])$/)
  if (baseMatch) {
    const symbol = baseMatch[2] as BasicActionSymbol
    return BASIC_ACTION_VARIANTS[symbol]
  }

  if (token.startsWith('额外:')) {
    const extraPayload = token.slice('额外:'.length)
    const normalizedExtraPayload = extraPayload.toLowerCase()
    const againMatch = extraPayload.match(/^([1-5])([普大下])$/)
    if (againMatch) {
      const actionSymbol = againMatch[2] as BasicActionSymbol
      return BASIC_ACTION_VARIANTS[actionSymbol]
    }

    if (extraPayload.startsWith('等待')) {
      return 'neutral'
    }
    if (extraPayload.includes('左侧') || extraPayload.includes('右侧')) {
      return 'teal'
    }
    if (extraPayload.includes('吕布')) {
      return 'success'
    }
    if (
      extraPayload.includes('自动') ||
      normalizedExtraPayload.includes('auto')
    ) {
      return 'info'
    }
    if (
      extraPayload.includes('史子眇') ||
      normalizedExtraPayload.includes('sp')
    ) {
      return 'warm'
    }
    return 'neutral'
  }

  if (token.startsWith('重开:')) {
    return 'danger'
  }

  return 'neutral'
}
