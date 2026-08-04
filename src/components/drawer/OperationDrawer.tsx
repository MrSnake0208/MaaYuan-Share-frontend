import { Button, Drawer, DrawerSize } from '@blueprintjs/core'

import { useTranslation } from 'i18n/i18n'
import { useAtomValue, useSetAtom } from 'jotai'
import { SyntheticEvent } from 'react'
import { useSearchParams } from 'react-router-dom'

import { OperationSetViewer } from 'components/viewer/OperationSetViewer'
import { OperationViewer } from 'components/viewer/OperationViewer'
import {
  readOperationIdsAtom,
  toggleReadOperationAtom,
} from 'store/readOperations'
import {
  sunkOperationIdsAtom,
  toggleSunkOperationAtom,
} from 'store/sunkOperations'

const ReadOperationButton = ({ operationId }: { operationId: number }) => {
  const t = useTranslation()
  const readOperationIds = useAtomValue(readOperationIdsAtom)
  const toggleReadOperation = useSetAtom(toggleReadOperationAtom)
  const isRead = readOperationIds.includes(operationId)

  return (
    <Button
      active={isRead}
      icon={isRead ? 'tick' : 'eye-open'}
      intent={isRead ? 'success' : 'none'}
      text={t.components.drawer.OperationDrawer.read}
      aria-label={
        isRead
          ? t.components.drawer.OperationDrawer.mark_unread
          : t.components.drawer.OperationDrawer.mark_read
      }
      onClick={() => toggleReadOperation(operationId)}
    />
  )
}

const SunkOperationButton = ({ operationId }: { operationId: number }) => {
  const t = useTranslation()
  const sunkOperationIds = useAtomValue(sunkOperationIdsAtom)
  const toggleSunkOperation = useSetAtom(toggleSunkOperationAtom)
  const isSunk = sunkOperationIds.includes(operationId)

  return (
    <Button
      active={isSunk}
      icon="sort-desc"
      intent={isSunk ? 'warning' : 'none'}
      text={t.components.drawer.OperationDrawer.sink}
      aria-label={
        isSunk
          ? t.components.drawer.OperationDrawer.restore_order
          : t.components.drawer.OperationDrawer.sink_to_bottom
      }
      onClick={() => toggleSunkOperation(operationId)}
    />
  )
}

const OperationStatusButtons = ({ operationId }: { operationId: number }) => (
  <>
    <ReadOperationButton operationId={operationId} />
    <SunkOperationButton operationId={operationId} />
  </>
)

export function OperationDrawer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const operationId = +(searchParams.get('op') || NaN) || undefined
  const operationSetId = +(searchParams.get('opset') || NaN) || undefined

  const closeOperation = (e?: SyntheticEvent) => {
    // 如果是通过鼠标点击外面来触发的关闭，那么只在左键点击时关闭，避免用后退键点击时关闭后又立即打开的问题
    // (原因是后退键会先触发关闭，然后触发浏览器的后退操作，使页面回到上一个 URL，导致又触发打开)
    if (e?.nativeEvent instanceof MouseEvent && e.nativeEvent.button !== 0) {
      return
    }

    setSearchParams((params) => {
      params.delete('op')
      return params
    })
  }

  const closeOperationSet = (e?: SyntheticEvent) => {
    if (e?.nativeEvent instanceof MouseEvent && e.nativeEvent.button !== 0) {
      return
    }

    setSearchParams((params) => {
      params.delete('opset')
      return params
    })
  }

  if (operationSetId) {
    return (
      <Drawer
        size={DrawerSize.LARGE}
        isOpen={!!operationSetId}
        onClose={closeOperationSet}
      >
        {operationSetId && (
          <OperationSetViewer
            operationSetId={operationSetId}
            onCloseDrawer={closeOperationSet}
          />
        )}

        <Drawer
          usePortal={false} // 嵌套 Drawer 时需要关闭 Portal
          size={DrawerSize.LARGE}
          isOpen={!!operationId}
          onClose={closeOperation}
        >
          {operationId && (
            <OperationViewer
              operationId={operationId}
              onCloseDrawer={closeOperation}
              headerActions={<OperationStatusButtons operationId={operationId} />}
            />
          )}
        </Drawer>
      </Drawer>
    )
  }

  return (
    <Drawer
      size={DrawerSize.LARGE}
      isOpen={!!operationId}
      onClose={closeOperation}
    >
      {operationId && (
        <OperationViewer
          operationId={operationId}
          onCloseDrawer={closeOperation}
          headerActions={<OperationStatusButtons operationId={operationId} />}
        />
      )}
    </Drawer>
  )
}
