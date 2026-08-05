import {
  OperatorDiscPresetCreateReq,
  OperatorDiscPresetUpdateReq,
} from 'maa-copilot-client'
import { useAtomValue } from 'jotai'
import useSWR from 'swr'

import { authAtom } from '../store/auth'
import { OperatorDiscPresetApi } from '../utils/maa-copilot-client'
import { useSWRRefresh } from '../utils/swr'

const PRESET_CACHE_KEY = 'operatorDiscPresets'

export function useOperatorDiscPresets() {
  const auth = useAtomValue(authAtom)

  return useSWR(
    auth.userId ? [PRESET_CACHE_KEY, auth.userId] : null,
    async () => {
      const response = await new OperatorDiscPresetApi({
        requireData: true,
      }).listDiscPresets()
      return response.data
    },
    {
      revalidateOnFocus: false,
    },
  )
}

export function useRefreshOperatorDiscPresets() {
  const refresh = useSWRRefresh()
  return () => refresh((key) => key.includes(PRESET_CACHE_KEY))
}

export async function createOperatorDiscPreset(
  req: OperatorDiscPresetCreateReq,
) {
  const response = await new OperatorDiscPresetApi({
    requireData: true,
  }).createDiscPreset({ operatorDiscPresetCreateReq: req })
  return response.data
}

export async function updateOperatorDiscPreset(
  req: OperatorDiscPresetUpdateReq,
) {
  const response = await new OperatorDiscPresetApi({
    requireData: true,
  }).updateDiscPreset({ operatorDiscPresetUpdateReq: req })
  return response.data
}

export async function deleteOperatorDiscPreset(id: string) {
  await new OperatorDiscPresetApi().deleteDiscPreset({
    commonIdReqString: { id },
  })
}
