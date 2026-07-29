import type { OperatorInfo } from '../models/operator'

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
export type StarPresetValues<T extends string> = readonly [T, T?, T?]

export interface OperatorStarPreset<T extends string> {
  id: string
  label: string
  description?: string
  values: StarPresetValues<T>
}

export interface OperatorStarStonePresetSet {
  mainStarPresets: OperatorStarPreset<MainStarName>[]
  assistStarPresets: OperatorStarPreset<AssistStarName>[]
}

type OperatorId = OperatorInfo['id']

export const MAIN_STAR_OPTIONS: MainStarName[] = [...mainStarNames]
export const ASSIST_STAR_OPTIONS: AssistStarName[] = [...assistStarNames]

// 人工维护入口：按密探 id 添加主星与辅星预设，两类预设可以独立组合。
export const OPERATOR_STAR_STONE_PRESETS: Partial<
  Record<OperatorId, OperatorStarStonePresetSet>
> = {
  char_070_dongfeng: {
    mainStarPresets: [
      {
        id: 'tiantong-tianliang-jumen',
        label: '天同·天梁·巨门',
        values: ['天同', '天梁', '巨门'],
      },
      {
        id: 'tianfu-wuqu-taiyang',
        label: '天府·武曲·太阳',
        values: ['天府', '武曲', '太阳'],
      },
    ],
    assistStarPresets: [
      {
        id: 'wenchang',
        label: '文昌',
        values: ['文昌'],
      },
    ],
  },
}
