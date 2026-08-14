import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { OperatorAvatar } from './OperatorAvatar'

describe('OperatorAvatar responsive sources', () => {
  it('uses 96px as the minimum source for regular avatars', () => {
    const markup = renderToStaticMarkup(
      createElement(OperatorAvatar, { id: 'test-operator', size: 'large' }),
    )

    expect(markup).toContain(
      '/assets/operator-avatars/webp96/test-operator.webp',
    )
    expect(markup).toContain(
      '/assets/operator-avatars/webp192/test-operator.webp 2x',
    )
    expect(markup).not.toContain(
      '/assets/operator-avatars/webp32/test-operator.webp',
    )
  })

  it('keeps the compact source for 20px avatars', () => {
    const markup = renderToStaticMarkup(
      createElement(OperatorAvatar, { id: 'test-operator', size: 'small' }),
    )

    expect(markup).toContain(
      '/assets/operator-avatars/webp32/test-operator.webp',
    )
    expect(markup).toContain(
      '/assets/operator-avatars/webp96/test-operator.webp 2x',
    )
  })
})
