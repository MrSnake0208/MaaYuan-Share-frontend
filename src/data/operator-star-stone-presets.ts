import type { OperatorInfo } from '../models/operator'
import type { AssistStarName, MainStarName } from './star-stones'

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
