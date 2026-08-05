import type {
  OperatorTrainingConfigSaveReq,
} from 'maa-copilot-client'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import {
  saveOperatorTrainingConfig,
  useOperatorTrainingConfigs,
} from '../../../apis/operator-training-config'
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

export function useOperatorTrainingConfigSync() {
  const auth = useAtomValue(authAtom)
  const { data, isLoading, mutate } = useOperatorTrainingConfigs()
  const timersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  )
  const pendingRef = useRef(
    new Map<string, OperatorTrainingConfigSaveReq>(),
  )
  const saveChainsRef = useRef(new Map<string, Promise<void>>())

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

  const persist = useCallback(
    (req: OperatorTrainingConfigSaveReq) => {
      const previous = saveChainsRef.current.get(req.operatorId)
      const next = (previous ?? Promise.resolve()).then(async () => {
        try {
          const saved = await saveOperatorTrainingConfig(req)
          await mutate(
            (current) => {
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
        } catch (error) {
          AppToaster.show({ intent: 'danger', message: formatError(error) })
        }
      })
      saveChainsRef.current.set(req.operatorId, next)
      void next.finally(() => {
        if (saveChainsRef.current.get(req.operatorId) === next) {
          saveChainsRef.current.delete(req.operatorId)
        }
      })
      return next
    },
    [mutate],
  )
  const persistRef = useRef(persist)
  persistRef.current = persist

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer)
      }
      for (const req of pendingRef.current.values()) {
        void persistRef.current(req)
      }
      timersRef.current.clear()
      pendingRef.current.clear()
    },
    [],
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
      if (!auth.userId) return

      const req = toOperatorTrainingConfig(operator)
      const existingTimer = timersRef.current.get(req.operatorId)
      if (existingTimer !== undefined) {
        clearTimeout(existingTimer)
        timersRef.current.delete(req.operatorId)
        pendingRef.current.delete(req.operatorId)
      }
      if (
        serverFingerprints.get(req.operatorId) ===
        operatorTrainingConfigFingerprint(req)
      ) {
        return
      }

      pendingRef.current.set(req.operatorId, req)
      const timer = setTimeout(() => {
        timersRef.current.delete(req.operatorId)
        pendingRef.current.delete(req.operatorId)
        void persist(req)
      }, SAVE_DELAY_MS)
      timersRef.current.set(req.operatorId, timer)
    },
    [auth.userId, persist, serverFingerprints],
  )

  return {
    applyConfig,
    isLoading: Boolean(auth.userId && isLoading),
    scheduleSave,
  }
}
