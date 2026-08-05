import {
  Button,
  Callout,
  Icon,
  NonIdealState,
  Spinner,
} from '@blueprintjs/core'

import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'

import { AccountAuthDialog } from '../components/AccountManager'
import { SheetProvider } from '../components/editor/operator/sheet/SheetProvider'
import { OperatorFilterProvider } from '../components/editor/operator/sheet/sheetOperator/SheetOperatorFilterProvider'
import { OperatorItem } from '../components/editor2/operator/OperatorItem'
import { SheetList } from '../components/editor2/operator/sheet/SheetList'
import { useOperatorTrainingConfigSync } from '../components/editor2/operator/useOperatorTrainingConfigSync'
import { createOperator } from '../components/editor2/reconciliation'
import type { EditorOperator } from '../components/editor2/types'
import { useTranslation } from '../i18n/i18n'
import { authAtom } from '../store/auth'
import { formatError } from '../utils/error'
import {
  loadOperatorRecorderSelection,
  saveOperatorRecorderSelection,
} from './operator-recorder-storage'

export const OperatorRecorderPage = () => {
  const t = useTranslation()
  const auth = useAtomValue(authAtom)
  const { applyConfig, error, isLoading, scheduleSave } =
    useOperatorTrainingConfigSync()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [operators, setOperators] = useState<EditorOperator[]>([])
  const [restoredUserId, setRestoredUserId] = useState<string>()
  const persistedSelectionRef = useRef<{
    userId: string
    fingerprint: string
  }>()

  useEffect(() => {
    const userId = auth.userId
    if (!userId) {
      setOperators([])
      setRestoredUserId(undefined)
      persistedSelectionRef.current = undefined
      return
    }
    if (isLoading || error || restoredUserId === userId) return

    const operatorNames = loadOperatorRecorderSelection(userId)
    setOperators(
      operatorNames.map((name) => applyConfig(createOperator({ name }))),
    )
    setRestoredUserId(userId)
    persistedSelectionRef.current = undefined
  }, [applyConfig, auth.userId, error, isLoading, restoredUserId])

  useEffect(() => {
    const userId = auth.userId
    if (!userId || restoredUserId !== userId) return

    const operatorNames = operators.map((operator) => operator.name)
    const fingerprint = JSON.stringify(operatorNames)
    if (
      persistedSelectionRef.current?.userId === userId &&
      persistedSelectionRef.current.fingerprint === fingerprint
    ) {
      return
    }

    saveOperatorRecorderSelection(userId, operatorNames)
    persistedSelectionRef.current = { userId, fingerprint }
  }, [auth.userId, operators, restoredUserId])

  const selectOperator = useCallback(
    (selected: { name: string }) => {
      setOperators((current) => {
        if (current.some((operator) => operator.name === selected.name)) {
          return current
        }
        return [...current, applyConfig(createOperator(selected))]
      })
      return true
    },
    [applyConfig],
  )

  const updateOperator = useCallback(
    (next: EditorOperator) => {
      setOperators((current) =>
        current.map((operator) =>
          operator.id === next.id ? next : operator,
        ),
      )
      scheduleSave(next)
    },
    [scheduleSave],
  )

  const removeOperators = useCallback(
    (index: number | number[] | undefined) => {
      if (index === undefined) return
      const indexes = new Set(Array.isArray(index) ? index : [index])
      setOperators((current) =>
        current.filter((_, currentIndex) => !indexes.has(currentIndex)),
      )
    },
    [],
  )

  const removeOperatorById = useCallback((id: string) => {
    setOperators((current) =>
      current.filter((operator) => operator.id !== id),
    )
  }, [])

  return (
    <main className="mx-auto w-full max-w-screen-lg px-4 py-8 md:px-8">
      <AccountAuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />

      <header className="border-b border-gray-200 pb-5 dark:border-gray-700">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon icon="people" size={22} className="text-sky-600" />
            <h1 className="m-0 text-2xl font-semibold">
              {t.pages.operator_recorder.title}
            </h1>
          </div>
          <p className="mb-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t.pages.operator_recorder.subtitle}
          </p>
        </div>
      </header>

      {!auth.userId ? (
        <NonIdealState
          className="min-h-[28rem]"
          icon="user"
          title={t.pages.operator_recorder.login_required}
          action={
            <Button
              intent="primary"
              icon="log-in"
              onClick={() => setAuthDialogOpen(true)}
            >
              {t.components.AccountManager.login_register}
            </Button>
          }
        />
      ) : error ? (
        <Callout className="mt-6" intent="danger" icon="error">
          {t.pages.operator_recorder.load_failed({
            error: formatError(error),
          })}
        </Callout>
      ) : isLoading ? (
        <div className="flex min-h-[28rem] items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <SheetProvider
          submitOperator={selectOperator}
          submitGroup={() => false}
          existedOperators={operators}
          existedGroups={[]}
          removeOperator={removeOperators}
          removeGroup={() => {}}
        >
          <OperatorFilterProvider>
            <div className="mt-5 flex min-h-0 flex-col overflow-hidden border border-gray-200 bg-white/80 dark:border-gray-700 dark:bg-slate-900/80">
              <section
                className="h-[min(52vh,34rem)] min-h-[22rem] overflow-hidden"
                aria-label={t.pages.operator_recorder.subtitle}
              >
                <SheetList maxSelectedOperators={Number.POSITIVE_INFINITY} />
              </section>
              <div className="h-px shrink-0 bg-gray-200 dark:bg-gray-700" />
              <section
                className="min-h-[28rem] overflow-auto px-4 py-7"
                aria-label={t.pages.operator_recorder.subtitle}
              >
                {operators.length ? (
                  <ul className="m-0 grid list-none grid-cols-1 gap-7 p-0 sm:grid-cols-2 xl:grid-cols-3">
                    {operators.map((operator) => (
                      <li
                        key={operator.id}
                        className="min-w-0 border-b border-gray-200 pb-7 dark:border-gray-700"
                        style={{
                          contentVisibility: 'auto',
                          containIntrinsicSize: '360px 620px',
                        }}
                      >
                        <OperatorItem
                          centerControls
                          operator={operator}
                          onChange={updateOperator}
                          onRemove={() => removeOperatorById(operator.id)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <NonIdealState
                    className="min-h-[24rem]"
                    icon="people"
                    title={t.pages.operator_recorder.no_operator}
                  />
                )}
              </section>
            </div>
          </OperatorFilterProvider>
        </SheetProvider>
      )}
    </main>
  )
}
