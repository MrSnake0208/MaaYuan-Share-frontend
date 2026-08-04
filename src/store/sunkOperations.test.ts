import { describe, expect, it } from 'vitest'

import {
  moveSunkOperationsToBottom,
  toggleSunkOperation,
} from './sunkOperations'

describe('toggleSunkOperation', () => {
  it('adds an operation to the sunk list without mutating the current list', () => {
    const current = [1, 2]

    expect(toggleSunkOperation(current, 3)).toEqual([1, 2, 3])
    expect(current).toEqual([1, 2])
  })

  it('removes an operation from the sunk list', () => {
    expect(toggleSunkOperation([1, 2, 3], 2)).toEqual([1, 3])
  })
})

describe('moveSunkOperationsToBottom', () => {
  it('stably moves sunk operations after regular operations', () => {
    const operations = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]

    expect(moveSunkOperationsToBottom(operations, [3, 1])).toEqual([
      { id: 2 },
      { id: 4 },
      { id: 1 },
      { id: 3 },
    ])
    expect(operations.map(({ id }) => id)).toEqual([1, 2, 3, 4])
  })

  it('returns the same array when no operations are sunk', () => {
    const operations = [{ id: 1 }]

    expect(moveSunkOperationsToBottom(operations, [])).toBe(operations)
  })
})
