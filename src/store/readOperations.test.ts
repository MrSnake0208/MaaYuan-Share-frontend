import { describe, expect, it } from 'vitest'

import { toggleReadOperation } from './readOperations'

describe('toggleReadOperation', () => {
  it('marks an unread operation as read without mutating the current list', () => {
    const current = [1, 2]

    expect(toggleReadOperation(current, 3)).toEqual([1, 2, 3])
    expect(current).toEqual([1, 2])
  })

  it('marks a read operation as unread', () => {
    expect(toggleReadOperation([1, 2, 3], 2)).toEqual([1, 3])
  })
})
