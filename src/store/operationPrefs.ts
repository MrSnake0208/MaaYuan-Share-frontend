import { atomWithStorage } from 'jotai/utils'

/**
 * 「已读」「沉底」功能的启用/关闭开关。
 *
 * 设计说明（见 .agent-teams/onboarding-tutorial/research.md）：
 * - 不改动既有的集合 atom（readOperationIdsAtom / sunkOperationIdsAtom），
 *   避免破坏老用户已持久化的 `maa-copilot-read-operations` / `maa-copilot-sunk-operations` 数组数据。
 * - 默认 true：保持现状「始终开启」，向后兼容（老用户 localStorage 无此 key 时依然启用）。
 * - 引导教程（OnboardingDialog）与「偏好设置」（ProfilePreferences）共用这一对 atom，天然同步。
 */
export const readEnabledAtom = atomWithStorage<boolean>(
  'maa-copilot-read-enabled',
  true,
  undefined,
  { getOnInit: true },
)

export const sunkEnabledAtom = atomWithStorage<boolean>(
  'maa-copilot-sunk-enabled',
  true,
  undefined,
  { getOnInit: true },
)

export const downloadJsonEnabledAtom = atomWithStorage<boolean>(
  'maa-copilot-download-json-enabled',
  true,
  undefined,
  { getOnInit: true },
)

/**
 * 首次访问引导教程是否已完成。仅移动端弹出，完成/关闭后写入 true，此后不再弹出。
 */
export const onboardingDoneAtom = atomWithStorage<boolean>(
  'maa-copilot-onboarding-done',
  false,
  undefined,
  { getOnInit: true },
)
