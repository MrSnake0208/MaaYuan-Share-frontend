import type { OperatorInfo } from '../models/operator'
import type { AssistStarName, MainStarName } from './star-stones'

export type StarPresetValues<T extends string> = readonly [T?, T?, T?]

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

const createMainPreset = (
  id: string,
  values: StarPresetValues<MainStarName>,
): OperatorStarPreset<MainStarName> => ({
  id,
  label: values.filter(Boolean).join('·'),
  values,
})

const TIANFU_WUQU_POJUN = createMainPreset('tianfu-wuqu-pojun', [
  '天府',
  '武曲',
  '破军',
])
const TANGLANG_WUQU_POJUN = createMainPreset('tanlang-wuqu-pojun', [
  '贪狼',
  '武曲',
  '破军',
])
const TIANFU_WUQU_JUMEN = createMainPreset('tianfu-wuqu-jumen', [
  '天府',
  '武曲',
  '巨门',
])
const TIANJI_TAIYANG_JUMEN = createMainPreset('tianji-taiyang-jumen', [
  '天机',
  '太阳',
  '巨门',
])
const TIANJI_TAIYANG_TAIYIN = createMainPreset('tianji-taiyang-taiyin', [
  '天机',
  '太阳',
  '太阴',
])
const TIANTONG_TIANLIANG_JUMEN = createMainPreset('tiantong-tianliang-jumen', [
  '天同',
  '天梁',
  '巨门',
])
const TIANFU_WUQU_TAIYANG = createMainPreset('tianfu-wuqu-taiyang', [
  '天府',
  '武曲',
  '太阳',
])
const TIANFU_WUQU_TIANJI = createMainPreset('tianfu-wuqu-tianji', [
  '天府',
  '武曲',
  '天机',
])
const TIANXIANG_WUQU_POJUN = createMainPreset('tianxiang-wuqu-pojun', [
  '天相',
  '武曲',
  '破军',
])
const TIANTONG_WUQU_POJUN = createMainPreset('tiantong-wuqu-pojun', [
  '天同',
  '武曲',
  '破军',
])
const TIANXIANG_TIANJI_JUMEN = createMainPreset('tianxiang-tianji-jumen', [
  '天相',
  '天机',
  '巨门',
])
const ZIWEI_TIANXIANG_JUMEN = createMainPreset('ziwei-tianxiang-jumen', [
  '紫微',
  '天相',
  '巨门',
])
const ZIWEI_TIANXIANG_TANGLANG = createMainPreset('ziwei-tianxiang-tanlang', [
  '紫微',
  '天相',
  '贪狼',
])

// 人工维护入口：按密探 id 添加主星与辅星预设，两类预设可以独立组合。
export const OPERATOR_STAR_STONE_PRESETS: Partial<
  Record<OperatorId, OperatorStarStonePresetSet>
> = {
  char_096_xiahouyuan: {
    mainStarPresets: [TIANFU_WUQU_POJUN, TANGLANG_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_050_xunyu: {
    mainStarPresets: [TIANFU_WUQU_JUMEN],
    assistStarPresets: [],
  },
  char_095_zhangyan: {
    mainStarPresets: [TIANJI_TAIYANG_JUMEN],
    assistStarPresets: [],
  },
  char_097_zhongyao: {
    mainStarPresets: [TIANJI_TAIYANG_TAIYIN],
    assistStarPresets: [],
  },
  char_099_pangxi: {
    mainStarPresets: [TIANJI_TAIYANG_TAIYIN],
    assistStarPresets: [],
  },
  char_070_dongfeng: {
    mainStarPresets: [TIANTONG_TIANLIANG_JUMEN, TIANFU_WUQU_TAIYANG],
    assistStarPresets: [
      {
        id: 'wenchang',
        label: '文昌',
        values: ['文昌'],
      },
    ],
  },
  char_077_anqi: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_044_zhangliao: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_058_machao: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_101_lvbu: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_080_mateng: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_072_zhugejin: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_003_sunshangxiang: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_007_lvmeng: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_038_luxun: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_053_zhangfei: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_059_taishici: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_094_yufan: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_089_zhangxiu: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_056_zhangjiao: {
    mainStarPresets: [TIANFU_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_045_zhangzhongjing: {
    mainStarPresets: [TIANFU_WUQU_TAIYANG],
    assistStarPresets: [],
  },
  char_023_shizimiao: {
    mainStarPresets: [TIANFU_WUQU_TAIYANG],
    assistStarPresets: [],
  },
  char_068_huangyueying: {
    mainStarPresets: [TIANFU_WUQU_TAIYANG],
    assistStarPresets: [],
  },
  char_083_zhuran: {
    mainStarPresets: [TIANFU_WUQU_TAIYANG],
    assistStarPresets: [],
  },
  char_008_huatuo: {
    mainStarPresets: [TIANFU_WUQU_TAIYANG],
    assistStarPresets: [],
  },
  char_098_liuzhang: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_074_xunyou: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_042_wangcan: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_046_zhouyu: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_088_liubao: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_093_shixie: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_052_caiyan: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_064_ganning: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_079_liuyao: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_062_zhanghe: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_069_zhangmiao: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_091_zhangzhao: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_103_caopi: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_004_guojia: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_104_zhugeliang: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_063_xushu: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_087_miheng: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_001_yangxiu: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_082_huanggai: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_060_zhangkai: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_105_simahui: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_066_zhanglu: {
    mainStarPresets: [TIANFU_WUQU_TIANJI],
    assistStarPresets: [],
  },
  char_076_lingtong: {
    mainStarPresets: [TIANXIANG_WUQU_POJUN, TIANTONG_WUQU_POJUN],
    assistStarPresets: [],
  },
  char_065_zhenfu: {
    mainStarPresets: [TIANXIANG_TIANJI_JUMEN],
    assistStarPresets: [],
  },
  char_012_yanliang: {
    mainStarPresets: [ZIWEI_TIANXIANG_JUMEN],
    assistStarPresets: [],
  },
  char_039_guojie: {
    mainStarPresets: [ZIWEI_TIANXIANG_JUMEN],
    assistStarPresets: [],
  },
  char_055_xiahoudun: {
    mainStarPresets: [ZIWEI_TIANXIANG_TANGLANG],
    assistStarPresets: [],
  },
  char_040_sunquan: {
    mainStarPresets: [ZIWEI_TIANXIANG_TANGLANG],
    assistStarPresets: [],
  },
}
