import { describe, expect, it } from 'vitest'

import { getProfIconPath } from './profIcon'

describe('getProfIconPath', () => {
  it.each([
    ['混沌', 'chaos'],
    ['地', 'earth'],
    ['水', 'water'],
    ['火', 'fire'],
    ['风', 'wind'],
    ['阳', 'yang'],
    ['阴', 'yin'],
  ])('maps %s to an ASCII-only filename', (profId, filename) => {
    expect(getProfIconPath(profId)).toBe(
      `/assets/prof-icons/${filename}.png`,
    )
  })

  it('does not construct a path for an unknown profession', () => {
    expect(getProfIconPath('unknown')).toBeUndefined()
  })
})
