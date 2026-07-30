import type {
  CopilotShareImageConfigRes,
  CopilotShareImageConfigUpdateReq,
} from 'maa-copilot-client'

import { OperationShareImageConfigApi } from '../utils/maa-copilot-client'

export async function getOperationShareImageConfigs(copilotId: number) {
  const api = new OperationShareImageConfigApi({
    sendToken: 'optional',
    requireData: true,
  })
  const response = await api.listConfigs({ copilotId })
  return response.data
}

export async function updateOperationShareImageConfig(
  copilotId: number,
  cardKey: string,
  config: CopilotShareImageConfigUpdateReq,
): Promise<CopilotShareImageConfigRes> {
  const api = new OperationShareImageConfigApi({ requireData: true })
  const response = await api.updateConfig({
    copilotId,
    cardKey,
    copilotShareImageConfigUpdateReq: config,
  })
  return response.data
}
