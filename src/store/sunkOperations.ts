import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

const storageKey = 'maa-copilot-sunk-operations'

export const toggleSunkOperation = (
  operationIds: number[],
  operationId: number,
) =>
  operationIds.includes(operationId)
    ? operationIds.filter((id) => id !== operationId)
    : [...operationIds, operationId]

export const moveSunkOperationsToBottom = <T extends { id: number }>(
  operations: T[],
  sunkOperationIds: number[],
) => {
  if (sunkOperationIds.length === 0) return operations

  const sunkOperationIdSet = new Set(sunkOperationIds)
  const regularOperations: T[] = []
  const sunkOperations: T[] = []

  operations.forEach((operation) => {
    if (sunkOperationIdSet.has(operation.id)) {
      sunkOperations.push(operation)
    } else {
      regularOperations.push(operation)
    }
  })

  return [...regularOperations, ...sunkOperations]
}

export const sunkOperationIdsAtom = atomWithStorage<number[]>(
  storageKey,
  [],
  undefined,
  { getOnInit: true },
)

export const toggleSunkOperationAtom = atom(
  null,
  (get, set, operationId: number) => {
    set(
      sunkOperationIdsAtom,
      toggleSunkOperation(get(sunkOperationIdsAtom), operationId),
    )
  },
)
