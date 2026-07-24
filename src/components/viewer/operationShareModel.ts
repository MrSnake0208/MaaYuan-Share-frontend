import type { Language } from '../../i18n/i18n'
import { CopilotDocV1 } from '../../models/copilot.schema'
import type { Operation } from '../../models/operation'
import {
  OPERATORS,
  getLocalizedOperatorName,
  getModuleName,
  withDefaultRequirements,
} from '../../models/operator'
import { readOperatorStats } from '../../utils/operatorStats'
import {
  buildOperationActionDisplay,
  formatTokenSummary,
  groupTokensForTable,
} from './ActionSequenceViewer'

export interface OperationShareOperator {
  slot?: number
  name: string
  rawName: string
  avatarId?: string
  starLevel?: number
  skill?: number
  module?: string
}

export interface OperationShareGroup {
  name: string
  operators: OperationShareOperator[]
}

export interface OperationShareAction {
  raw: string
  label: string
}

export type OperationShareCellColumn = `slot-${number}` | 'others' | 'notes'

export interface OperationShareCardConfig {
  showTargetSwitches: boolean
  showNotes: boolean
  notes: Record<number, string>
  cellColors: Record<string, string>
}

export const OPERATION_SHARE_CELL_COLORS = [
  '#f4ecdf',
  '#f2dfb9',
  '#d8e9e4',
  '#dbe7ea',
  '#f4d9d1',
  '#dfe4e2',
] as const

const OPERATION_SHARE_CARD_CONFIG_STORAGE_VERSION = 1
const OPERATION_SHARE_CARD_CONFIG_STORAGE_PREFIX =
  'maa-copilot-operation-share-card-config'
const SHARE_CELL_KEY_PATTERN = /^\d+:(?:slot-\d+|others|notes)$/
const OPERATION_SHARE_CELL_COLOR_SET = new Set<string>(
  OPERATION_SHARE_CELL_COLORS,
)

export interface OperationShareRound {
  round: number
  slots: Record<number, OperationShareAction[]>
  others: OperationShareAction[]
}

export interface OperationShareSource {
  type: 'original' | 'repost'
  strategyAuthor: string
  sharer?: string
  platform?: string
  originalUrl?: string
}

export interface OperationShareModel {
  title: string
  stage: string
  author: string
  originalAuthor?: string
  source: OperationShareSource
  shortCode: string
  maayuanUrl: string
  qrTargetUrl: string
  qrLabel: string
  operators: OperationShareOperator[]
  groups: OperationShareGroup[]
  actionSlots: number[]
  rounds: OperationShareRound[]
}

export function createOperationShareCardConfig(): OperationShareCardConfig {
  return {
    showTargetSwitches: true,
    showNotes: false,
    notes: {},
    cellColors: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeOperationShareCardConfig(
  value: unknown,
): OperationShareCardConfig {
  const defaults = createOperationShareCardConfig()
  if (!isRecord(value)) return defaults

  const notes: Record<number, string> = {}
  if (isRecord(value.notes)) {
    Object.entries(value.notes).forEach(([round, note]) => {
      if (/^\d+$/.test(round) && typeof note === 'string') {
        notes[Number(round)] = note.slice(0, 160)
      }
    })
  }

  const cellColors: Record<string, string> = {}
  if (isRecord(value.cellColors)) {
    Object.entries(value.cellColors).forEach(([key, color]) => {
      if (
        SHARE_CELL_KEY_PATTERN.test(key) &&
        typeof color === 'string' &&
        OPERATION_SHARE_CELL_COLOR_SET.has(color.toLowerCase())
      ) {
        cellColors[key] = color.toLowerCase()
      }
    })
  }

  return {
    showTargetSwitches:
      typeof value.showTargetSwitches === 'boolean'
        ? value.showTargetSwitches
        : defaults.showTargetSwitches,
    showNotes:
      typeof value.showNotes === 'boolean'
        ? value.showNotes
        : defaults.showNotes,
    notes,
    cellColors,
  }
}

function operationShareCardConfigStorageKey(operationId: number) {
  return `${OPERATION_SHARE_CARD_CONFIG_STORAGE_PREFIX}:v${OPERATION_SHARE_CARD_CONFIG_STORAGE_VERSION}:${operationId}`
}

export function loadOperationShareCardConfig(
  operationId: number,
  storage: Pick<Storage, 'getItem'> = window.localStorage,
) {
  try {
    const raw = storage.getItem(operationShareCardConfigStorageKey(operationId))
    if (!raw) return createOperationShareCardConfig()
    const stored = JSON.parse(raw) as unknown
    if (
      !isRecord(stored) ||
      stored.version !== OPERATION_SHARE_CARD_CONFIG_STORAGE_VERSION
    ) {
      return createOperationShareCardConfig()
    }
    return normalizeOperationShareCardConfig(stored.config)
  } catch {
    return createOperationShareCardConfig()
  }
}

export function saveOperationShareCardConfig(
  operationId: number,
  config: OperationShareCardConfig,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
) {
  try {
    storage.setItem(
      operationShareCardConfigStorageKey(operationId),
      JSON.stringify({
        version: OPERATION_SHARE_CARD_CONFIG_STORAGE_VERSION,
        config: normalizeOperationShareCardConfig(config),
      }),
    )
    return true
  } catch {
    return false
  }
}

export function buildOperationShareCellKey(
  round: number,
  column: OperationShareCellColumn,
) {
  return `${round}:${column}`
}

function isTargetSwitchAction(raw: string) {
  return raw === '额外:左侧目标' || raw === '额外:右侧目标'
}

export function filterOperationShareActions(
  actions: OperationShareAction[],
  showTargetSwitches: boolean,
) {
  return showTargetSwitches
    ? actions
    : actions.filter((action) => !isTargetSwitchAction(action.raw))
}

function isHiddenShareAction(raw: string) {
  return raw.startsWith('额外:等待')
}

function formatShareActionSummary(raw: string, language: Language) {
  if (raw === '额外:左侧目标') return '右滑'
  if (raw === '额外:右侧目标') return '左滑'
  return formatTokenSummary(raw, language)
}

function normalizeHttpUrl(raw?: string) {
  const value = raw?.trim()
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function mapOperator(
  operator: CopilotDocV1.Operator,
  language: Language,
  slot?: number,
): OperationShareOperator {
  const info = OPERATORS.find((candidate) => candidate.name === operator.name)
  const requirements = withDefaultRequirements(
    operator.requirements,
    info?.rarity,
  )
  const stats = readOperatorStats(operator)
  const module =
    requirements.module === CopilotDocV1.Module.Default
      ? undefined
      : getModuleName(requirements.module)

  return {
    slot,
    name: getLocalizedOperatorName(operator.name, language),
    rawName: operator.name,
    avatarId: info?.id,
    starLevel: stats.hasStar
      ? Math.min(5, Math.max(0, stats.starLevel))
      : undefined,
    skill: operator.skill,
    module,
  }
}

export function buildOperationShareModel(
  operation: Operation,
  language: Language,
  maayuanUrl = '?op=' + operation.id,
): OperationShareModel {
  const content = operation.parsedContent
  const operators = (content.opers ?? []).map((operator, index) =>
    mapOperator(operator, language, index + 1),
  )
  const groups = (content.groups ?? []).map((group, groupIndex) => ({
    name: group.name?.trim() || `密探组 ${groupIndex + 1}`,
    operators: (group.opers ?? []).map((operator) =>
      mapOperator(operator, language),
    ),
  }))

  const actionDisplay = buildOperationActionDisplay(operation, language)
  const rounds = actionDisplay.rounds.map((round) => {
    const grouped = groupTokensForTable(
      round.tokens.filter((token) => !isHiddenShareAction(token.raw)),
      actionDisplay.slotAssignments,
    )
    const slots: Record<number, OperationShareAction[]> = {}
    const otherTokens = [...grouped.others]
    for (let slot = 1; slot <= 5; slot += 1) {
      const key = String(slot) as keyof typeof grouped.slotMap
      const slotTokens = grouped.slotMap[key] ?? []
      otherTokens.push(
        ...slotTokens.filter((token) => isTargetSwitchAction(token.raw)),
      )
      slots[slot] = slotTokens
        .filter((token) => !isTargetSwitchAction(token.raw))
        .map((token) => ({
          raw: token.raw,
          label: `${token.order + 1}${formatShareActionSummary(token.raw, language)}`,
        }))
    }
    return {
      round: round.round,
      slots,
      others: otherTokens
        .sort((left, right) => left.order - right.order)
        .map((token) => ({
          raw: token.raw,
          label: `${token.order + 1}${formatShareActionSummary(token.raw, language)}`,
        })),
    }
  })

  const actionSlots = [1, 2, 3, 4, 5].filter(
    (slot) =>
      Boolean(actionDisplay.slotAssignments[slot]?.name) ||
      rounds.some((round) => round.slots[slot]?.length),
  )
  const author = operation.uploader?.trim() || '匿名作者'
  const isRepost = operation.metadata?.sourceType === 'repost'
  const originalAuthor = isRepost
    ? operation.metadata?.repostAuthor?.trim() || undefined
    : undefined
  const originalUrl = isRepost
    ? normalizeHttpUrl(operation.metadata?.repostUrl)
    : undefined
  const source: OperationShareSource = isRepost
    ? {
        type: 'repost',
        strategyAuthor: originalAuthor || '原作者未填写',
        sharer: author,
        platform: operation.metadata?.repostPlatform?.trim() || undefined,
        originalUrl,
      }
    : {
        type: 'original',
        strategyAuthor: author,
      }

  return {
    title: content.doc.title?.trim() || '未命名作业',
    stage:
      operation.preLevel?.name?.trim() ||
      content.stageName?.trim() ||
      '未知关卡',
    author,
    originalAuthor,
    source,
    shortCode: String(operation.id),
    maayuanUrl,
    qrTargetUrl: originalUrl || maayuanUrl,
    qrLabel: originalUrl ? '扫码查看原贴' : '扫码查看 MaaYuan 作业',
    operators,
    groups,
    actionSlots: actionSlots.length > 0 ? actionSlots : [1, 2, 3, 4, 5],
    rounds,
  }
}

function sanitizeFilePart(value: string, fallback: string) {
  const sanitized = value
    .split('')
    .filter((character) => character.charCodeAt(0) > 31)
    .join('')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/[. ]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return sanitized || fallback
}

export function buildOperationShareFilename(
  model: Pick<OperationShareModel, 'stage' | 'title'>,
) {
  const stage = sanitizeFilePart(model.stage, '未知关卡')
  const title = sanitizeFilePart(model.title, '未命名作业')
  return `${stage}-${title}.png`
}

export function buildOperationShareUrl(operationId: number, origin: string) {
  const url = new URL('/', origin)
  url.searchParams.set('op', String(operationId))
  return url.toString()
}

export function calculateSharePixelRatio(cardHeight: number) {
  if (!Number.isFinite(cardHeight) || cardHeight <= 0) return 2
  return Math.max(1, Math.min(2, 16000 / cardHeight))
}

export class ObjectUrlStore {
  private current?: string

  replace(blob: Blob) {
    this.revoke()
    this.current = URL.createObjectURL(blob)
    return this.current
  }

  revoke() {
    if (!this.current) return
    URL.revokeObjectURL(this.current)
    this.current = undefined
  }
}
