import { useAtomValue } from 'jotai'
import {
  OperatorStarStonePresetCreateReq,
  OperatorStarStonePresetUpdateReq,
} from 'maa-copilot-client'
import useSWR from 'swr'

import { authAtom } from '../store/auth'
import { OperatorStarStonePresetApi } from '../utils/maa-copilot-client'
import { useSWRRefresh } from '../utils/swr'

const PRESET_CACHE_KEY = 'operatorStarStonePresets'

export function useOperatorStarStonePresets() {
  const auth = useAtomValue(authAtom)

  return useSWR(
    auth.userId ? [PRESET_CACHE_KEY, auth.userId] : null,
    async () => {
      const response = await new OperatorStarStonePresetApi({
        requireData: true,
      }).listPresets()
      return response.data
    },
    {
      revalidateOnFocus: false,
    },
  )
}

export function useRefreshOperatorStarStonePresets() {
  const refresh = useSWRRefresh()
  return () => refresh((key) => key.includes(PRESET_CACHE_KEY))
}

export async function createOperatorStarStonePreset(
  req: OperatorStarStonePresetCreateReq,
) {
  const response = await new OperatorStarStonePresetApi({
    requireData: true,
  }).createPreset({ operatorStarStonePresetCreateReq: req })
  return response.data
}

export async function updateOperatorStarStonePreset(
  req: OperatorStarStonePresetUpdateReq,
) {
  const response = await new OperatorStarStonePresetApi({
    requireData: true,
  }).updatePreset({ operatorStarStonePresetUpdateReq: req })
  return response.data
}

export async function deleteOperatorStarStonePreset(id: string) {
  await new OperatorStarStonePresetApi().deletePreset({
    commonIdReqString: { id },
  })
}
