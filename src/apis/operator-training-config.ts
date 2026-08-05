import { OperatorTrainingConfigSaveReq } from 'maa-copilot-client'
import { useAtomValue } from 'jotai'
import useSWR from 'swr'

import { authAtom } from '../store/auth'
import { OperatorTrainingConfigApi } from '../utils/maa-copilot-client'

const TRAINING_CONFIG_CACHE_KEY = 'operatorTrainingConfigs'

export function useOperatorTrainingConfigs() {
  const auth = useAtomValue(authAtom)

  return useSWR(
    auth.userId ? [TRAINING_CONFIG_CACHE_KEY, auth.userId] : null,
    async () => {
      const response = await new OperatorTrainingConfigApi({
        requireData: true,
      }).listConfigs()
      return response.data
    },
    {
      revalidateOnFocus: false,
    },
  )
}

export async function saveOperatorTrainingConfig(
  req: OperatorTrainingConfigSaveReq,
) {
  const response = await new OperatorTrainingConfigApi({
    requireData: true,
  }).saveConfig({ operatorTrainingConfigSaveReq: req })
  return response.data
}
