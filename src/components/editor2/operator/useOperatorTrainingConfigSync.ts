import type {
  OperatorBoxTrainingConfigRes,
  OperatorTrainingConfigSaveReq,
} from 'maa-copilot-client'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { mutate as mutateCache } from 'swr'

import {
  getOperatorBoxTrainingConfigCacheKey,
  saveOperatorBoxTrainingConfig,
  useOperatorBoxTrainingConfigs,
} from '../../../apis/operator-box-training-config'
import { authAtom } from '../../../store/auth'
import { formatError } from '../../../utils/error'
import { AppToaster } from '../../Toaster'
import type { EditorOperator } from '../types'
import {
  applyOperatorTrainingConfig,
  operatorTrainingConfigFingerprint,
  toOperatorTrainingConfig,
} from './operatorTrainingConfigModel'

const SAVE_DELAY_MS = 500

interface PendingSave {
  boxId: string
  config: OperatorTrainingConfigSaveReq
  userId: string
}

function getScopeKey(pending: PendingSave) {
  return `${pending.userId}:${pending.boxId}:${pending.config.operatorId}`
}

export function useOperatorTrainingConfigSync(boxId?: string) {
  const auth = useAtomValue(authAtom)
  const { data, error, isLoading } = useOperatorBoxTrainingConfigs(boxId)
  const timersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  )
  const pendingRef = useRef(new Map<string, PendingSave>())
  const saveChainsRef = useRef(new Map<string, Promise<void>>())
  const activeScopeRef = useRef({ boxId, userId: auth.userId })
  activeScopeRef.current = { boxId, userId: auth.userId }

  const configsByOperatorId = useMemo(
    () => new Map(data?.map((config) => [config.operatorId, config]) ?? []),
    [data],
  )
  const serverFingerprints = useMemo(
    () =>
      new Map(
        data?.map((config) => [
          config.operatorId,
          operatorTrainingConfigFingerprint(config),
        ]) ?? [],
      ),
    [data],
  )

  const persist = useCallback((pending: PendingSave) => {
    const scopeKey = getScopeKey(pending)
    const previous = saveChainsRef.current.get(scopeKey)
    const next = (previous ?? Promise.resolve()).then(async () => {
      try {
        const saved = await saveOperatorBoxTrainingConfig({
          boxId: pending.boxId,
          config: pending.config,
        })
        await mutateCache(
          getOperatorBoxTrainingConfigCacheKey(
            pending.userId,
            pending.boxId,
          ),
          (current: OperatorBoxTrainingConfigRes[] | undefined) => {
            const configs = current ?? []
            const index = configs.findIndex(
              (config) => config.operatorId === saved.operatorId,
            )
            if (index === -1) return [...configs, saved]
            return configs.map((config, currentIndex) =>
              currentIndex === index ? saved : config,
            )
          },
          { revalidate: false },
        )
      } catch (caught) {
        AppToaster.show({
          intent: 'danger',
          message: formatError(caught),
        })
      }
    })
    saveChainsRef.current.set(scopeKey, next)
    void next.finally(() => {
      if (saveChainsRef.current.get(scopeKey) === next) {
        saveChainsRef.current.delete(scopeKey)
      }
    })
    return next
  }, [])

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) clearTimeout(timer)
      for (const pending of pendingRef.current.values()) {
        if (activeScopeRef.current.userId === pending.userId) {
          void persist(pending)
        }
      }
      timersRef.current.clear()
      pendingRef.current.clear()
    },
    [persist],
  )

  const applyConfig = useCallback(
    (operator: EditorOperator) => {
      const config = configsByOperatorId.get(operator.name)
      return config
        ? applyOperatorTrainingConfig(operator, config)
        : operator
    },
    [configsByOperatorId],
  )

  const scheduleSave = useCallback(
    (operator: EditorOperator) => {
      if (!auth.userId || !boxId) return

      const config = toOperatorTrainingConfig(operator)
      const pending = { boxId, config, userId: auth.userId }
      const scopeKey = getScopeKey(pending)
      const existingTimer = timersRef.current.get(scopeKey)
      if (existingTimer !== undefined) {
        clearTimeout(existingTimer)
        timersRef.current.delete(scopeKey)
        pendingRef.current.delete(scopeKey)
      }
      if (
        serverFingerprints.get(config.operatorId) ===
        operatorTrainingConfigFingerprint(config)
      ) {
        return
      }

      pendingRef.current.set(scopeKey, pending)
      const timer = setTimeout(() => {
        timersRef.current.delete(scopeKey)
        pendingRef.current.delete(scopeKey)
        if (activeScopeRef.current.userId === pending.userId) {
          void persist(pending)
        }
      }, SAVE_DELAY_MS)
      timersRef.current.set(scopeKey, timer)
    },
    [auth.userId, boxId, persist, serverFingerprints],
  )

  return {
    applyConfig,
    error,
    isLoading: Boolean(auth.userId && boxId && isLoading),
    scheduleSave,
  }
}
