import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const storageKey = 'maa-copilot-read-operations'

export const toggleReadOperation = (
  operationIds: number[],
  operationId: number,
) =>
  operationIds.includes(operationId)
    ? operationIds.filter((id) => id !== operationId)
    : [...operationIds, operationId]

export const readOperationIdsAtom = atomWithStorage<number[]>(
  storageKey,
  [],
  undefined,
  {
    getOnInit: true,
  },
)

export const toggleReadOperationAtom = atom(
  null,
  (get, set, operationId: number) => {
    set(
      readOperationIdsAtom,
      toggleReadOperation(get(readOperationIdsAtom), operationId),
    )
  },
)
