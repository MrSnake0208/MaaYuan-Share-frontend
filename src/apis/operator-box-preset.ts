import type {
  OperatorBoxPresetCreateReq,
  OperatorBoxPresetDeleteReq,
  OperatorBoxPresetUpdateReq,
} from 'maa-copilot-client'
import { useAtomValue } from 'jotai'
import useSWR from 'swr'

import { authAtom } from '../store/auth'
import { OperatorBoxPresetApi } from '../utils/maa-copilot-client'

const PRESET_CACHE_KEY = 'operatorBoxPresets'

export function useOperatorBoxPresets() {
  const auth = useAtomValue(authAtom)

  return useSWR(
    auth.userId ? [PRESET_CACHE_KEY, auth.userId] : null,
    async () => {
      const response = await new OperatorBoxPresetApi({
        requireData: true,
      }).listOperatorBoxPresets()
      return response.data
    },
    { revalidateOnFocus: false },
  )
}

export async function createOperatorBoxPreset(
  req: OperatorBoxPresetCreateReq,
) {
  const response = await new OperatorBoxPresetApi({
    requireData: true,
  }).createOperatorBoxPreset({ operatorBoxPresetCreateReq: req })
  return response.data
}

export async function updateOperatorBoxPreset(
  req: OperatorBoxPresetUpdateReq,
) {
  const response = await new OperatorBoxPresetApi({
    requireData: true,
  }).updateOperatorBoxPreset({ operatorBoxPresetUpdateReq: req })
  return response.data
}

export async function deleteOperatorBoxPreset(
  req: OperatorBoxPresetDeleteReq,
) {
  await new OperatorBoxPresetApi().deleteOperatorBoxPreset({
    operatorBoxPresetDeleteReq: req,
  })
}
