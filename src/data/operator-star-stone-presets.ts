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

const STAR_ID_PARTS: Record<string, string> = {
  七杀: 'qisha',
  三台: 'santai',
  右弼: 'youbi',
  地劫: 'dijie',
  天同: 'tiantong',
  天巫: 'tianwu',
  天府: 'tianfu',
  天机: 'tianji',
  天马: 'tianma',
  天梁: 'tianliang',
  天相: 'tianxiang',
  天钺: 'tianyue',
  天魁: 'tiankui',
  太阴: 'taiyin',
  太阳: 'taiyang',
  左辅: 'zuofu',
  巨门: 'jumen',
  文昌: 'wenchang',
  文曲: 'wenqu',
  武曲: 'wuqu',
  红鸾: 'hongluan',
  紫微: 'ziwei',
  解神: 'jieshen',
  贪狼: 'tanlang',
  擎羊: 'qingyang',
  破军: 'pojun',
  禄存: 'lucun',
  阴煞: 'yinsha',
}

const createPreset = <T extends string>(
  values: StarPresetValues<T>,
): OperatorStarPreset<T> => {
  const selectedValues = values.filter(
    (value): value is T => value !== undefined,
  )
  return {
    id: selectedValues.map(value => STAR_ID_PARTS[value] ?? value).join('-'),
    label: selectedValues.join('·'),
    values,
  }
}

const createPresetSet = (
  mainStarValues: StarPresetValues<MainStarName>[],
  assistStarValues: StarPresetValues<AssistStarName>[] = [],
): OperatorStarStonePresetSet => ({
  mainStarPresets: mainStarValues.map(values => createPreset(values)),
  assistStarPresets: assistStarValues.map(values => createPreset(values)),
})

// 人工维护入口：按密探 id 添加主星与辅星预设，两类预设可以独立组合。
export const OPERATOR_STAR_STONE_PRESETS: Partial<
  Record<OperatorId, OperatorStarStonePresetSet>
> = {
  char_001_yangxiu: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '擎羊', '三台']],
  ),
  char_002_jiaxu: createPresetSet([
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_003_sunshangxiang: createPresetSet(
    [['天府', '武曲', '破军']],
    [
      ['解神', '左辅', '天巫'],
      ['解神', '左辅', '文曲'],
    ],
  ),
  char_004_guojia: createPresetSet(
    [['天府', '武曲', '天机']],
    [['文曲', '右弼', '天巫']],
  ),
  char_005_lusu: createPresetSet([['天相', '天同', '天梁']]),
  char_007_lvmeng: createPresetSet(
    [['天府', '武曲', '破军']],
    [['解神', '左辅', '文曲']],
  ),
  char_008_huatuo: createPresetSet(
    [['天府', '武曲', '太阳']],
    [['擎羊', '三台']],
  ),
  char_012_yanliang: createPresetSet([
    ['紫微', '天相', '巨门'],
    ['紫微', '天相', '七杀'],
  ]),
  char_013_chendeng: createPresetSet([
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_014_achan: createPresetSet([['天府', '武曲', '破军']]),
  char_023_shizimiao: createPresetSet(
    [['天府', '武曲', '太阳']],
    [['文昌', '红鸾']],
  ),
  char_024_ganji: createPresetSet([['天府', '武曲', '天机']]),
  char_038_luxun: createPresetSet([['天府', '武曲', '破军']]),
  char_039_guojie: createPresetSet([
    ['紫微', '天相', '巨门'],
    ['紫微', '天相', '天同'],
  ]),
  char_040_sunquan: createPresetSet([['紫微', '天相', '贪狼']]),
  char_041_zhangxiu: createPresetSet([['天府', '武曲', '天机']]),
  char_042_wangcan: createPresetSet(
    [['天府', '武曲', '天机']],
    [['红鸾']],
  ),
  char_044_zhangliao: createPresetSet(
    [['天府', '武曲', '破军']],
    [['解神', '天魁', '文曲']],
  ),
  char_045_zhangzhongjing: createPresetSet(
    [['天府', '武曲', '太阳']],
    [['文昌', '红鸾']],
  ),
  char_046_zhouyu: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '天钺', '阴煞']],
  ),
  char_047_gehong: createPresetSet([['天府', '武曲', '天机']]),
  char_050_xunyu: createPresetSet([
    ['天府', '武曲', '巨门'],
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_051_pangtong: createPresetSet([
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_052_caiyan: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '天钺', '阴煞']],
  ),
  char_053_zhangfei: createPresetSet(
    [['天府', '武曲', '破军']],
    [['文曲', '右弼', '天巫']],
  ),
  char_055_xiahoudun: createPresetSet([
    ['紫微', '天相', '贪狼'],
    ['紫微', '天相', '天同'],
  ]),
  char_056_zhangjiao: createPresetSet(
    [['天府', '武曲', '破军']],
    [['解神', '天马', '三台']],
  ),
  char_057_chengyu: createPresetSet([
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_058_machao: createPresetSet(
    [['天府', '武曲', '破军']],
    [
      ['解神', '天魁', '阴煞'],
      ['解神', '天魁', '文曲'],
    ],
  ),
  char_059_taishici: createPresetSet(
    [['天府', '武曲', '破军']],
    [['文曲', '右弼', '天巫']],
  ),
  char_060_zhangkai: createPresetSet(
    [['天府', '武曲', '天机']],
    [['天马', '三台']],
  ),
  char_062_zhanghe: createPresetSet(
    [['天府', '武曲', '天机']],
    [['红鸾']],
  ),
  char_063_xushu: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '擎羊', '三台']],
  ),
  char_064_ganning: createPresetSet(
    [['天府', '武曲', '天机']],
    [
      ['解神', '天钺', '阴煞'],
      ['解神', '天钺', '文曲'],
    ],
  ),
  char_065_zhenfu: createPresetSet(
    [
      ['天相', '天机', '巨门'],
      ['天相', '天同', '太阴'],
    ],
    [['左辅', '天巫']],
  ),
  char_066_zhanglu: createPresetSet(
    [['天府', '武曲', '天机']],
    [['天马', '解神']],
  ),
  char_067_kongrong: createPresetSet(
    [
      ['天府', '武曲', '天机'],
      ['天同', '天梁', '太阴'],
    ],
    [['天钺', '文曲']],
  ),
  char_068_huangyueying: createPresetSet(
    [
      ['天府', '武曲', '太阳'],
      ['紫微', '天相', '天同'],
    ],
    [['擎羊', '三台']],
  ),
  char_069_zhangmiao: createPresetSet(
    [['天府', '武曲', '天机']],
    [['文曲', '右弼', '天巫']],
  ),
  char_070_dongfeng: createPresetSet(
    [
      ['天同', '天梁', '巨门'],
      ['天府', '武曲', '太阳'],
      ['天同', '天梁', '太阴'],
    ],
    [
      ['文昌'],
      ['文昌', '红鸾'],
    ],
  ),
  char_071_caozhi: createPresetSet([
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_072_zhugejin: createPresetSet(
    [['天府', '武曲', '破军']],
    [['解神', '天钺', '阴煞']],
  ),
  char_073_zhugedan: createPresetSet([
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_074_xunyou: createPresetSet([
    ['天府', '武曲', '天机'],
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_075_manchong: createPresetSet(
    [['天府', '武曲', '破军']],
    [['天马', '三台']],
  ),
  char_076_lingtong: createPresetSet(
    [
      ['天相', '武曲', '破军'],
      ['天同', '武曲', '破军'],
      ['天府', '武曲', '破军'],
    ],
    [['解神', '左辅', '天巫']],
  ),
  char_077_anqi: createPresetSet(
    [['天府', '武曲', '破军']],
    [['天魁', '阴煞']],
  ),
  char_078_xixue: createPresetSet([
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_079_liuyao: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '天钺', '阴煞']],
  ),
  char_080_mateng: createPresetSet(
    [['天府', '武曲', '破军']],
    [
      ['解神', '天魁', '阴煞'],
      ['解神', '天魁'],
    ],
  ),
  char_081_linghumao: createPresetSet(
    [
      ['天府', '武曲', '天机'],
      ['天机', '巨门', '太阳'],
    ],
    [['天钺']],
  ),
  char_082_huanggai: createPresetSet(
    [['天府', '武曲', '天机']],
    [
      ['文曲', '天马', '三台'],
      ['解神', '天马', '三台'],
    ],
  ),
  char_083_zhuran: createPresetSet(
    [['天府', '武曲', '太阳']],
    [['擎羊']],
  ),
  char_084_chendengsp: createPresetSet([['天相', '天同', '天梁']]),
  char_085_shizimiaosp: createPresetSet([['天府', '武曲', '太阳']]),
  char_086_kuaiyue: createPresetSet([
    ['天同', '天梁', '太阴'],
    ['天同', '天梁', '贪狼'],
    ['天同', '太阴', '天相'],
    ['太阳', '巨门', '天相'],
    ['天同', '巨门', '天相'],
  ]),
  char_087_miheng: createPresetSet(
    [['天府', '武曲', '天机']],
    [['文曲', '擎羊', '三台']],
  ),
  char_088_liubao: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '天钺', '阴煞']],
  ),
  char_089_zhangxiu: createPresetSet(
    [['天府', '武曲', '破军']],
    [['解神', '天马', '三台']],
  ),
  char_090_dongbai: createPresetSet(
    [['天同', '天梁', '太阴']],
    [['天魁', '禄存', '地劫']],
  ),
  char_091_zhangzhao: createPresetSet(
    [['天府', '武曲', '天机']],
    [
      ['文曲', '右弼', '天巫'],
      ['文曲', '右弼'],
    ],
  ),
  char_092_chengpu: createPresetSet(
    [
      ['太阳', '巨门', '天相'],
      ['天府', '武曲', '天机'],
    ],
    [['解神']],
  ),
  char_093_shixie: createPresetSet(
    [['天府', '武曲', '天机']],
    [['天钺', '文曲']],
  ),
  char_094_yufan: createPresetSet(
    [['天府', '武曲', '破军']],
    [['天马', '三台']],
  ),
  char_095_zhangyan: createPresetSet(
    [
      ['天机', '太阳', '巨门'],
      ['天府', '武曲', '天机'],
    ],
    [['解神', '左辅', '天巫']],
  ),
  char_096_xiahouyuan: createPresetSet(
    [
      ['天府', '武曲', '破军'],
      ['贪狼', '武曲', '破军'],
    ],
    [['解神', '擎羊', '文曲']],
  ),
  char_097_zhongyao: createPresetSet([
    ['天机', '太阳', '太阴'],
    ['天机', '太阳', '武曲'],
  ]),
  char_098_liuzhang: createPresetSet([
    ['天府', '武曲', '天机'],
    ['天府', '武曲', '太阳'],
  ]),
  char_099_pangxi: createPresetSet([['天机', '太阳', '太阴']]),
  char_100_zhouzhong: createPresetSet([['天同', '天梁', '太阴']]),
  char_101_lvbu: createPresetSet(
    [
      ['天府', '武曲', '破军'],
      ['贪狼', '武曲', '破军'],
    ],
    [['解神', '天魁', '文曲']],
  ),
  char_102_jianyong: createPresetSet([['天府', '武曲', '天机']]),
  char_103_caopi: createPresetSet(
    [['天府', '武曲', '天机']],
    [['文曲', '右弼', '天巫']],
  ),
  char_104_zhugeliang: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '擎羊', '三台']],
  ),
  char_105_simahui: createPresetSet(
    [['天府', '武曲', '天机']],
    [['天马', '三台']],
  ),
  char_106_kuailiang: createPresetSet([['天相', '天同', '巨门']]),
  char_107_guonvwang: createPresetSet([['天府', '武曲', '破军']]),
  char_108_fazheng: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '天马', '三台']],
  ),
  char_109_chenqun: createPresetSet([['天府', '太阳', '七杀']]),
  char_110_fenggongzhu: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '擎羊', '三台']],
  ),
  char_111_fenggongjiu: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '擎羊', '三台']],
  ),
  char_112_pangde: createPresetSet(
    [
      ['天同', '天梁', '天相'],
      ['天府', '武曲', '破军'],
    ],
    [['阴煞', '天钺', '文曲']],
  ),
  char_113_luzhi: createPresetSet(
    [['天府', '武曲', '天机']],
    [['解神', '天魁', '阴煞']],
  ),
  char_114_chenji: createPresetSet([['天府', '武曲', '天机']]),
  char_115_chenying: createPresetSet([['天府', '武曲', '破军']]),
  char_119_sunjing: createPresetSet([['天府', '武曲', '破军']]),
  char_121_menghuo: createPresetSet(
    [['天相', '巨门', '太阳']],
    [['文昌', '红鸾']],
  ),
  char_122_zhangsong: createPresetSet([['武曲', '天府', '太阳']]),
  char_123_sunfu: createPresetSet(
    [['天府', '武曲', '天机']],
    [['文曲', '天钺']],
  ),
  char_124_simafu: createPresetSet(
    [['天府', '武曲', '破军']],
    [['阴煞', '天钺', '文曲']],
  ),
  char_125_zhaoyun: createPresetSet(
    [['天府', '武曲', '破军']],
    [['文曲', '右弼', '天巫']],
  ),
}
