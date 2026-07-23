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

export interface OperationShareRound {
  round: number
  slots: Record<number, OperationShareAction[]>
  others: OperationShareAction[]
}

export interface OperationShareModel {
  title: string
  stage: string
  author: string
  originalAuthor?: string
  operators: OperationShareOperator[]
  groups: OperationShareGroup[]
  actionSlots: number[]
  rounds: OperationShareRound[]
}

function isTargetSwitchAction(raw: string) {
  return raw === '额外:左侧目标' || raw === '额外:右侧目标'
}

function isHiddenShareAction(raw: string) {
  return raw.startsWith('额外:等待')
}

function formatShareActionSummary(raw: string, language: Language) {
  if (raw === '额外:左侧目标') return '右滑'
  if (raw === '额外:右侧目标') return '左滑'
  return formatTokenSummary(raw, language)
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

  return {
    title: content.doc.title?.trim() || '未命名作业',
    stage:
      operation.preLevel?.name?.trim() ||
      content.stageName?.trim() ||
      '未知关卡',
    author: operation.uploader?.trim() || '匿名作者',
    originalAuthor:
      operation.metadata?.sourceType === 'repost'
        ? operation.metadata.repostAuthor?.trim() || undefined
        : undefined,
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
