import { describe, expect, it } from 'vitest'

import {
  dismissRetireNotice,
  isRetireNoticeDismissed,
  isRetiringHost,
} from './siteRetireNotice'

describe('isRetiringHost', () => {
  it('命中带端口的旧域名', () => {
    expect(
      isRetiringHost('share.maayuan.fun:16666', 'share.maayuan.fun:16666'),
    ).toBe(true)
  })

  it('忽略端口差异（带端口 vs 不带端口）', () => {
    expect(isRetiringHost('share.maayuan.fun', 'share.maayuan.fun:16666')).toBe(
      true,
    )
    expect(isRetiringHost('share.maayuan.fun:16666', 'share.maayuan.fun')).toBe(
      true,
    )
  })

  it('不命中其他域名', () => {
    expect(isRetiringHost('share.maayuan.top', 'share.maayuan.fun:16666')).toBe(
      false,
    )
    expect(isRetiringHost('maayuan.top', 'share.maayuan.fun:16666')).toBe(false)
    expect(isRetiringHost('localhost:3000', 'share.maayuan.fun:16666')).toBe(
      false,
    )
  })

  it('未配置旧域名时永不命中', () => {
    expect(isRetiringHost('share.maayuan.fun:16666', undefined)).toBe(false)
    expect(isRetiringHost('share.maayuan.fun:16666', '')).toBe(false)
  })
})

describe('迁移提示关闭状态', () => {
  it('默认未关闭，关闭后再次读取为已关闭', () => {
    localStorage.clear()
    expect(isRetireNoticeDismissed()).toBe(false)

    dismissRetireNotice()
    expect(isRetireNoticeDismissed()).toBe(true)
  })
})
