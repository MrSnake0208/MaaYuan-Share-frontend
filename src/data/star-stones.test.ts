import { describe, expect, it } from 'vitest'

import {
  AssistStarName,
  MainStarName,
  getAssistStarAvailability,
  getMainStarAvailability,
} from './star-stones'

describe('star-stone availability rules', () => {
  it('limits special main stars by sub-profession', () => {
    const subProfessions = ['shenji', 'guidao', 'pojun', 'longdun', 'qihuang']
    const rules: Array<[MainStarName, string[]]> = [
      ['天机', ['shenji', 'guidao']],
      ['破军', ['pojun']],
      ['紫微', ['longdun']],
    ]

    for (const [star, allowed] of rules) {
      for (const subProf of subProfessions) {
        expect(
          getMainStarAvailability(star, { subProf: [subProf] }).available,
          `${star} availability for ${subProf}`,
        ).toBe(allowed.includes(subProf))
      }
    }
  })

  it('limits 文昌 by sub-profession and damage stars by profession', () => {
    expect(
      getAssistStarAvailability('文昌', { subProf: ['qihuang'] }).available,
    ).toBe(true)
    expect(
      getAssistStarAvailability('文昌', { subProf: ['shenji'] }).available,
    ).toBe(false)
    const professions = ['地', '水', '火', '风', '阴', '阳', '混沌']
    const rules: Array<[AssistStarName, string[]]> = [
      ['天魁', ['地']],
      ['天钺', ['水']],
      ['左辅', ['火']],
      ['右弼', ['风']],
      ['天马', ['阴']],
      ['擎羊', ['阳']],
      ['阴煞', ['地', '水']],
      ['天巫', ['火', '风']],
      ['三台', ['阴', '阳']],
    ]

    for (const [star, allowed] of rules) {
      for (const prof of professions) {
        expect(
          getAssistStarAvailability(star, { prof: [prof] }).available,
          `${star} availability for ${prof}`,
        ).toBe(allowed.includes(prof))
      }
    }
  })

  it('does not limit generic and resistance assist stars by profession', () => {
    const unrestricted: AssistStarName[] = [
      '任意',
      '地劫',
      '禄存',
      '红鸾',
      '文曲',
      '解神',
      '陀螺',
      '火星',
      '铃星',
      '地空',
      '天刑',
      '天姚',
      '八座',
      '恩光',
      '天贵',
    ]

    for (const star of unrestricted) {
      expect(
        getAssistStarAvailability(star, { prof: ['混沌'] }).available,
        `${star} should not be limited by profession`,
      ).toBe(true)
    }
  })
})
