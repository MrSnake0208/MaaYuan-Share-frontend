const mainStarNames = [
  '任意',
  '天府',
  '天相',
  '巨门',
  '太阳',
  '廉贞',
  '太阴',
  '紫微',
  '七杀',
  '天机',
  '武曲',
  '破军',
  '天同',
  '天梁',
  '贪狼',
] as const

const assistStarNames = [
  '任意',
  '红鸾',
  '阴煞',
  '天魁',
  '八座',
  '陀螺',
  '地劫',
  '解神',
  '禄存',
  '文曲',
  '天钺',
  '火星',
  '文昌',
  '天巫',
  '左辅',
  '铃星',
  '恩光',
  '三台',
  '擎羊',
  '天贵',
  '天姚',
  '天马',
  '天刑',
  '右弼',
  '地空',
] as const

export type MainStarName = (typeof mainStarNames)[number]
export type AssistStarName = (typeof assistStarNames)[number]

export const MAIN_STAR_OPTIONS: MainStarName[] = [...mainStarNames]
export const ASSIST_STAR_OPTIONS: AssistStarName[] = [...assistStarNames]

export const ASSIST_STAR_DESCRIPTIONS: Record<AssistStarName, string> = {
  任意: '不限制',
  地劫: '技能免伤+',
  禄存: '普攻免伤+',
  红鸾: '受治疗加成+',
  文昌: '治疗加成+',
  文曲: '普攻增伤+',
  解神: '技能增伤+',
  天魁: '地属性增伤+',
  天钺: '水属性增伤+',
  左辅: '火属性增伤+',
  右弼: '风属性增伤+',
  天马: '阴属性增伤+',
  擎羊: '阳属性增伤+',
  陀螺: '地属性抗性+',
  火星: '水属性抗性+',
  铃星: '火属性抗性+',
  地空: '风属性抗性+',
  天刑: '阴属性抗性+',
  天姚: '阳属性抗性+',
  阴煞: '地/水属性增伤+',
  天巫: '火/风属性增伤+',
  三台: '阴/阳属性增伤+',
  八座: '地/水属性抗性+',
  恩光: '火/风属性抗性+',
  天贵: '阴/阳属性抗性+',
}

export interface StarStoneOperatorProfile {
  prof?: string[]
  subProf?: string[]
}

export interface StarStoneAvailability {
  available: boolean
  reason?: string
}

interface RestrictionRule {
  allowed: readonly string[]
  reason: string
}

const AVAILABLE: StarStoneAvailability = { available: true }

const MAIN_STAR_SUB_PROF_RESTRICTIONS: Partial<
  Record<MainStarName, RestrictionRule>
> = {
  天机: {
    allowed: ['shenji', 'guidao'],
    reason: '仅限神纪/诡道密探',
  },
  破军: {
    allowed: ['pojun'],
    reason: '仅限破军密探',
  },
  紫微: {
    allowed: ['longdun'],
    reason: '仅限龙盾密探',
  },
}

const ASSIST_STAR_SUB_PROF_RESTRICTIONS: Partial<
  Record<AssistStarName, RestrictionRule>
> = {
  文昌: {
    allowed: ['qihuang'],
    reason: '仅限岐黄密探',
  },
}

const ASSIST_STAR_PROF_RESTRICTIONS: Partial<
  Record<AssistStarName, RestrictionRule>
> = {
  天魁: { allowed: ['地'], reason: '仅限地属性密探' },
  天钺: { allowed: ['水'], reason: '仅限水属性密探' },
  左辅: { allowed: ['火'], reason: '仅限火属性密探' },
  右弼: { allowed: ['风'], reason: '仅限风属性密探' },
  天马: { allowed: ['阴'], reason: '仅限阴属性密探' },
  擎羊: { allowed: ['阳'], reason: '仅限阳属性密探' },
  阴煞: { allowed: ['地', '水'], reason: '仅限地/水属性密探' },
  天巫: { allowed: ['火', '风'], reason: '仅限火/风属性密探' },
  三台: { allowed: ['阴', '阳'], reason: '仅限阴/阳属性密探' },
}

function checkRestriction(
  values: string[] | undefined,
  rule: RestrictionRule | undefined,
): StarStoneAvailability {
  if (!rule || (values && values.some((value) => rule.allowed.includes(value)))) {
    return AVAILABLE
  }
  return { available: false, reason: rule.reason }
}

export function getMainStarAvailability(
  star: MainStarName,
  profile: StarStoneOperatorProfile,
): StarStoneAvailability {
  return checkRestriction(
    profile.subProf,
    MAIN_STAR_SUB_PROF_RESTRICTIONS[star],
  )
}

export function getAssistStarAvailability(
  star: AssistStarName,
  profile: StarStoneOperatorProfile,
): StarStoneAvailability {
  const subProfAvailability = checkRestriction(
    profile.subProf,
    ASSIST_STAR_SUB_PROF_RESTRICTIONS[star],
  )
  if (!subProfAvailability.available) {
    return subProfAvailability
  }
  return checkRestriction(profile.prof, ASSIST_STAR_PROF_RESTRICTIONS[star])
}
