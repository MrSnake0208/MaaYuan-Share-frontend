import type {
  OperatorBoxTrainingConfigBatchSaveReq,
  OperatorBoxTrainingConfigSaveReq,
} from 'maa-copilot-client'
import { useAtomValue } from 'jotai'
import useSWR from 'swr'

import { authAtom } from '../store/auth'
import { OperatorBoxTrainingConfigApi } from '../utils/maa-copilot-client'

const BOX_TRAINING_CONFIG_CACHE_KEY = 'operatorBoxTrainingConfigs'

export function getOperatorBoxTrainingConfigCacheKey(
  userId: string,
  boxId: string,
) {
  return [BOX_TRAINING_CONFIG_CACHE_KEY, userId, boxId] as const
}

export function useOperatorBoxTrainingConfigs(boxId?: string) {
  const auth = useAtomValue(authAtom)

  return useSWR(
    auth.userId && boxId
      ? getOperatorBoxTrainingConfigCacheKey(auth.userId, boxId)
      : null,
    async () => {
      const response = await new OperatorBoxTrainingConfigApi({
        requireData: true,
      }).listOperatorBoxTrainingConfigs({ boxId: boxId! })
      return response.data
    },
    { revalidateOnFocus: false },
  )
}

export async function saveOperatorBoxTrainingConfig(
  req: OperatorBoxTrainingConfigSaveReq,
) {
  const response = await new OperatorBoxTrainingConfigApi({
    requireData: true,
  }).saveOperatorBoxTrainingConfig({
    operatorBoxTrainingConfigSaveReq: req,
  })
  return response.data
}

export async function saveOperatorBoxTrainingConfigs(
  req: OperatorBoxTrainingConfigBatchSaveReq,
) {
  const response = await new OperatorBoxTrainingConfigApi({
    requireData: true,
  }).saveOperatorBoxTrainingConfigs({
    operatorBoxTrainingConfigBatchSaveReq: req,
  })
  return response.data
}
