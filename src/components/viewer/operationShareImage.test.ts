import { describe, expect, it } from 'vitest'

import {
  OPERATION_SHARE_CARD_OVERFLOW_MESSAGE,
  assertOperationShareCardFits,
} from './operationShareImage'

describe('operation share image sizing', () => {
  it('accepts content that fits the portrait canvas', () => {
    expect(() => assertOperationShareCardFits(1440)).not.toThrow()
  })

  it('rejects oversized content instead of shrinking its text', () => {
    expect(() => assertOperationShareCardFits(1441)).toThrow(
      OPERATION_SHARE_CARD_OVERFLOW_MESSAGE,
    )
  })
})
